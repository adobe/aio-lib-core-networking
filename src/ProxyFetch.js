/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const loggerNamespace = '@adobe/aio-lib-core-networking:ProxyFetch'
const coreLogging = require('@adobe/aio-lib-core-logging')
const originalFetch = require('node-fetch')
const { codes } = require('./SDKErrors')
const { HttpProxyAgent } = require('http-proxy-agent')
const { HttpsProxyAgent } = require('https-proxy-agent')
const { urlToHttpOptions } = require('./utils')

/* global Response, Request */

/**
 * HttpsProxyAgent needs a patch for TLS connections.
 * It doesn't pass in the original options during a SSL connect.
 *
 * See https://github.com/TooTallNate/proxy-agents/issues/89
 * An alternative is to use https://github.com/delvedor/hpagent
 * @private
 */
class PatchedHttpsProxyAgent extends HttpsProxyAgent {
  constructor (proxyUrl, opts) {
    super(proxyUrl, opts)
    this.savedOpts = opts
  }

  async connect (req, opts) {
    return super.connect(req, { ...this.savedOpts, ...opts })
  }
}

/**
 * @private
 *
 * @param {string} resourceUrl an endpoint url for proxyAgent selection
 * @param {ProxyOptions} proxyOptions an object which contains proxy information
 * @param {object} logger the logger instance
 * @returns {http.Agent} a http.Agent for basic auth proxy
 */
function proxyAgent (resourceUrl, proxyOptions, logger) {
  if (typeof resourceUrl !== 'string') {
    throw new codes.ERROR_PROXY_FETCH_INITIALIZATION_TYPE({ sdkDetails: { resourceUrl }, messageValues: 'resourceUrl must be of type string' })
  }

  const { proxyUrl, username, password, rejectUnauthorized = true } = proxyOptions
  const proxyHttpOptions = urlToHttpOptions(proxyUrl)

  if (!proxyHttpOptions.auth && username && password) {
    logger.debug('username and password not set in proxy url, using credentials passed in the constructor.')
    proxyHttpOptions.auth = `${username}:${password}`
  }

  proxyHttpOptions.rejectUnauthorized = rejectUnauthorized
  if (rejectUnauthorized === false) {
    logger.warn(`proxyAgent - rejectUnauthorized is set to ${rejectUnauthorized}`)
  }

  if (resourceUrl.startsWith('https')) {
    return new PatchedHttpsProxyAgent(proxyUrl, proxyHttpOptions)
  } else {
    return new HttpProxyAgent(proxyUrl, proxyHttpOptions)
  }
}

/**
 * Proxy Auth Options
 *
 * @typedef {object} ProxyOptions
 * @property {string} proxyUrl - the proxy's url
 * @property {string} [username] the username for basic auth
 * @property {string} [password] the password for basic auth
 * @property {boolean} rejectUnauthorized - set to false to not reject unauthorized server certs
 * @property {string} [logLevel] the log level to use (default: process.env.LOG_LEVEL or 'info')
 */

/**
 * This provides a wrapper for fetch that facilitates proxy auth authorization.
 */
class ProxyFetch {
  /**
   * Initialize this class with Proxy auth options
   *
   * @param {ProxyOptions} proxyOptions the auth options to connect with
   */
  constructor (proxyOptions = {}) {
    this.logLevel = proxyOptions.logLevel || process.env.LOG_LEVEL || 'info'
    this.logger = coreLogging(loggerNamespace, { level: this.logLevel })

    this.logger.debug(`constructor - authOptions: ${JSON.stringify(proxyOptions)}`)
    const { proxyUrl } = proxyOptions
    const { auth } = urlToHttpOptions(proxyUrl)

    if (!proxyUrl) {
      const sdkDetails = { proxyUrl, auth }
      throw new codes.ERROR_PROXY_FETCH_INITIALIZATION({ sdkDetails, messageValues: 'proxyUrl' })
    }

    if (!auth) {
      this.logger.debug('constructor: username or password not set, proxy is anonymous.')
    }

    this.proxyOptions = proxyOptions
    return this
  }

  /**
   * Fetch function, using the configured fetch options, and proxy options (set in the constructor).
   *
   * @param {string | Request} resource - the url or Request object to fetch from
   * @param {object} options - the fetch options
   * @returns {Promise<Response>} Promise object representing the http response
   */
  async fetch (resource, options = {}) {
    return originalFetch(resource, {
      ...options,
      agent: proxyAgent(resource, this.proxyOptions, this.logger)
    })
  }
}

module.exports = ProxyFetch
