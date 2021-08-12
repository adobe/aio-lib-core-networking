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

const loggerNamespace = '@adobe/aio-lib-core-networking:NTLMFetch'
const logger = require('@adobe/aio-lib-core-logging')(
  loggerNamespace, { level: process.env.LOG_LEVEL })
const originalFetch = require('node-fetch')
const { codes } = require('./SDKErrors')
const http = require('http')
const { ntlm } = require('httpntlm')

/* global Response */

/**
 * NTLM Auth Options.
 *
 * @typedef {object} NtlmAuthOptions
 * @property {string} username - the Active Directory username
 * @property {string} password - the Active Directory password
 * @property {string} domain - the Active Directory domain
 * @property {string} [workstation] - the workstation name
 */

/**
 * This provides a wrapper for fetch that facilitates NTLM Auth negotiation and authorization.
 */
class NtlmFetch {
  /**
   * Initialize this class with NTLM auth options
   *
   * @param {NtlmAuthOptions} authOptions the auth options to connect with
   */
  constructor (authOptions = {}) {
    logger.debug(`constructor - authOptions: ${JSON.stringify(authOptions)}`)
    const { username, password, domain, workstation = '' } = authOptions

    const initErrors = []
    if (!username) {
      initErrors.push('username')
    }
    if (!password) {
      initErrors.push('password')
    }
    if (!domain) {
      initErrors.push('domain')
    }

    if (initErrors.length) {
      const sdkDetails = { username, password, domain, workstation }
      throw new codes.ERROR_NTLM_FETCH_INITIALIZATION({ sdkDetails, messageValues: `${initErrors.join(', ')}` })
    }

    this.authOptions = authOptions
    return this
  }

  /**
   * Connects to the url with a NTLM Type 1 negotiation (encoding the NTLM auth details), and returns the Type2 Message challenge.
   *
   * @private
   * @param {string} url the url to connect to
   * @param {object} agent the http agent to use
   * @returns {string} NTLM Type 2 Message challenge
   */
  async ntlmNegotiate (url, agent) {
    logger.debug(`ntlmNegotiate - url: ${url} agent: ${agent}`)

    if (!agent) {
      logger.debug('ntlmNegotiate - agent not set')
      const sdkDetails = { url, agent }
      throw new codes.ERROR_NTLM_NEGOTIATE_NO_AGENT({ sdkDetails })
    }
    const Authorization = ntlm.createType1Message(this.authOptions)
    logger.debug(`ntlmNegotiate - Authorization ${Authorization}`)

    const response = await originalFetch(url, {
      headers: {
        Connection: 'keep-alive',
        Authorization
      },
      agent
    })

    const wwwAuthenticate = response.headers.get('www-authenticate')
    // the header contains the NTLM Type 2 Message, parse and return
    return ntlm.parseType2Message(wwwAuthenticate)
  }

  /**
   * Fetch function, using the configured NTLM Auth options.
   *
   * @param {string} url - the url to fetch from
   * @param {object} options - the fetch options
   * @returns {Promise<Response>} Promise object representing the http response
   */
  async fetch (url, options = {}) {
    // NTLM needs a Keep-Alive connection, so we set this as an agent for node-fetch
    const agent = new http.Agent({
      keepAlive: true
    })

    logger.debug(`fetch - initial parameters. url: ${url} options: ${JSON.stringify(options)}`)

    // check whether it even needs auth
    const response = await originalFetch(url, options)
    if (response.ok) {
      logger.debug(`http resource ${url} does not require auth, skipping.`)
      return response
    }

    // check whether the response status is 401 Unauthorized
    if (!response.status === 401) {
      logger.debug(`http resource ${url} did not return 401 Unauthorized, skipping.`)
      return response
    }

    // check for header "WWW-Authenticate: NTLM"
    const wwwAuthenticate = response.headers.get('www-authenticate')
    if (!wwwAuthenticate && wwwAuthenticate.includes('NTLM')) {
      logger.debug(`http resource ${url} did not have a 'WWW-Authenticate: NTLM' header, skipping.`)
      return response
    }

    // if we got here, it's an NTLM challenge, so we proceed
    const ntlmType2Challenge = await this.ntlmNegotiate(url, agent)
    logger.debug(`fetch - ntlmType2Challenge ${ntlmType2Challenge}`)

    // create a NTLM Type 3 authorization from the Type 2 challenge, and we respond to the challenge
    const ntlmType3Authorization = ntlm.createType3Message(ntlmType2Challenge, this.authOpts)
    logger.debug(`fetch - ntlmType3Authorization ${ntlmType3Authorization}`)

    if (!options.headers) {
      options.headers = {}
    }
    options.headers.Authorization = ntlmType3Authorization

    logger.debug(`fetch - final parameters. url: ${url} options: ${JSON.stringify(options)}`)

    return originalFetch(url, {
      ...options,
      agent
    }
    )
  }
}

module.exports = NtlmFetch
