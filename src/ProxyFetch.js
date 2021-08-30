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
const HttpProxyAgent = require('proxy-agent')
const { urlToHttpOptions } = require('./utils')
const http = require('http')

/* global Response, Request */

/**
 * Auth Options.
 *
 * @typedef {object} ProxyAuthOptions
 * @property {string} username - the username
 * @property {string} password - the password
 * @property {string} [domain] - (NTLM auth only) the Active Directory domain
 * @property {string} [workstation] - (NTLM auth only) the workstation name
 */

/**
 * This provides a wrapper for fetch that facilitates NTLM Auth negotiation and authorization.
 */
class ProxyFetch {
  /**
   * Initialize this class with Proxy auth options
   *
   * @param {ProxyAuthOptions} authOptions the auth options to connect with
   */
  constructor (authOptions = {}) {
    logger.debug(`constructor - authOptions: ${JSON.stringify(authOptions)}`)
    const { proxyUrl, username, password } = authOptions

    const initErrors = []
    if (!proxyUrl) {
      initErrors.push('proxyUrl')
    }

    if (!username || !password) {
      logger.debug('username or password not set, proxy is anonymous.')
    }

    if (initErrors.length) {
      const sdkDetails = { proxyUrl, username, password }
      throw new codes.ERROR_PROXY_FETCH_INITIALIZATION({ sdkDetails, messageValues: `${initErrors.join(', ')}` })
    }

    this.authOptions = authOptions
    return this
  }

  /**
   * Returns the http.Agent used for this proxy
   *
   * @returns {http.Agent} a http.Agent for basic auth proxy
   */
  proxyAgent () {
    const { proxyUrl, username, password } = this.authOptions
    const proxyOpts = urlToHttpOptions(proxyUrl)

    if (!proxyOpts.auth && username && password) {
      logger.debug('username and password not set in proxy url, using credentials passed in the constructor.')
      proxyOpts.auth = `${username}:${password}`
    }
    return new HttpProxyAgent(proxyOpts)
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
      agent: this.proxyAgent()
    })
  }
}

module.exports = ProxyFetch
