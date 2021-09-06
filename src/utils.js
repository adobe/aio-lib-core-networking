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

const url = require('url')
const originalFetch = require('node-fetch')
const config = require('@adobe/aio-lib-core-config')
const loggerNamespace = '@adobe/aio-lib-core-networking/utils'
const logger = require('@adobe/aio-lib-core-logging')(loggerNamespace, { level: process.env.LOG_LEVEL })

/* global ProxyAuthOptions */

/**
 * Gets the proxy options from the config.
 *
 * @returns {ProxyAuthOptions} the proxy options
 */
function getProxyOptionsFromConfig () {
  logger.debug('getProxyOptionsFromConfig: getting proxy options from the config')

  let proxyOptions = null
  const proxyUrl = config.get('proxy.url')
  const username = config.get('proxy.username')
  const password = config.get('proxy.password')

  if (!proxyUrl) {
    logger.debug('getProxyOptionsFromConfig: proxy.url not set. Proxy will not be used.')
  } else {
    proxyOptions = { proxyUrl }
    logger.debug(`getProxyOptionsFromConfig - proxy.url ${proxyUrl}, proxy.username: ${username}, proxy.password: ${password}`)
    if (!username || !password) {
      logger.debug('getProxyOptionsFromConfig: username or password not set, proxy is anonymous.')
    } else {
      proxyOptions = { ...proxyOptions, username, password }
    }
  }

  return proxyOptions
}

/**
 * Return the appropriate Fetch function depending on proxy settings.
 *
 * @param {ProxyAuthOptions} [proxyOptions] the options for the proxy
 * @param {string} proxyOptions.proxyUrl the url for the proxy
 * @param {string} proxyOptions.username the username for the proxy
 * @param {string} proxyOptions.password the password for the proxy
 * @returns {Function} the Fetch API function
 */
function createFetch (proxyOptions = getProxyOptionsFromConfig()) {
  return async (resource, options) => {
    if (proxyOptions) {
      // in this closure: for fetch-retry, if we don't require it dynamically here, ProxyFetch will be an empty object
      const ProxyFetch = require('./ProxyFetch')
      const proxyFetch = new ProxyFetch(proxyOptions)
      return proxyFetch.fetch(resource, options)
    } else {
      return originalFetch(resource, options)
    }
  }
}

/**
 * Converts a URL to a suitable object for http request options.
 *
 * @private
 * @param {string} aUrl the url to parse
 * @returns {object} an object to pass for http request options
 */
function urlToHttpOptions (aUrl) {
  // URL.urlToHttpOptions is only in node 15 or greater
  const { protocol, hostname, hash, search, pathname, path, href, username, password, port } = new url.URL(aUrl)
  const options = {
    protocol,
    hostname,
    hash,
    search,
    pathname,
    path,
    href,
    port
  }

  if (username && password) {
    options.auth = `${username}:${password}`
  }
  return options
}

module.exports = {
  urlToHttpOptions,
  createFetch,
  getProxyOptionsFromConfig
}
