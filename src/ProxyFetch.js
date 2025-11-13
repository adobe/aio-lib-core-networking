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
const logger = require('@adobe/aio-lib-core-logging')(loggerNamespace, { level: process.env.LOG_LEVEL })
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
 * @param {ProxyAuthOptions} proxyOptions an object which contains auth information
 * @returns {http.Agent} a http.Agent for basic auth proxy
 */
function proxyAgent (resourceUrl, proxyAuthOptions) {
  if (typeof resourceUrl !== 'string') {
    throw new codes.ERROR_PROXY_FETCH_INITIALIZATION_TYPE({ sdkDetails: { resourceUrl }, messageValues: 'resourceUrl must be of type string' })
  }

  const { proxyUrl, username, password, rejectUnauthorized = true } = proxyAuthOptions
  const proxyOpts = urlToHttpOptions(proxyUrl)

  if (!proxyOpts.auth && username && password) {
    logger.debug('username and password not set in proxy url, using credentials passed in the constructor.')
    proxyOpts.auth = `${username}:${password}`
  }

  proxyOpts.rejectUnauthorized = rejectUnauthorized
  if (rejectUnauthorized === false) {
    logger.warn(`proxyAgent - rejectUnauthorized is set to ${rejectUnauthorized}`)
  }

  if (resourceUrl.startsWith('https')) {
    return new PatchedHttpsProxyAgent(proxyUrl, proxyOpts)
  } else {
    return new HttpProxyAgent(proxyUrl, proxyOpts)
  }
}

/**
 * Proxy Auth Options
 *
 * @typedef {object} ProxyAuthOptions
 * @property {string} proxyUrl - the proxy's url
 * @property {string} [username] the username for basic auth
 * @property {string} [password] the password for basic auth
 * @property {boolean} rejectUnauthorized - set to false to not reject unauthorized server certs
 */

/**
 * This provides a wrapper for fetch that facilitates proxy auth authorization.
 */
class ProxyFetch {
  /**
   * Initialize this class with Proxy auth options
   *
   * @param {ProxyAuthOptions} proxyAuthOptions the auth options to connect with
   */
  constructor (proxyAuthOptions = {}) {
    logger.debug(`constructor - authOptions: ${JSON.stringify(proxyAuthOptions)}`)
    const { proxyUrl } = proxyAuthOptions
    const { auth } = urlToHttpOptions(proxyUrl)

    if (!proxyUrl) {
      const sdkDetails = { proxyUrl, auth }
      throw new codes.ERROR_PROXY_FETCH_INITIALIZATION({ sdkDetails, messageValues: 'proxyUrl' })
    }

    if (!auth) {
      logger.debug('constructor: username or password not set, proxy is anonymous.')
    }

    this.authOptions = proxyAuthOptions
    return this
  }

  /**
   * Fetch function, using the configured NTLM Auth options.
   *
   * @param {string | Request} resource - the url or Request object to fetch from
   * @param {object} options - the fetch options
   * @returns {Promise<Response>} Promise object representing the http response
   */
  async fetch (resource, options = {}) {
    return originalFetch(resource, {
      ...options,
      agent: proxyAgent(resource, this.authOptions)
    })
  }
}

module.exports = ProxyFetch
