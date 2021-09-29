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
const { getProxyForUrl } = require('proxy-from-env')
const loggerNamespace = '@adobe/aio-lib-core-networking/utils'
const logger = require('@adobe/aio-lib-core-logging')(loggerNamespace, { level: process.env.LOG_LEVEL })

/* global ProxyAuthOptions */

/**
 * Return the appropriate Fetch function depending on proxy settings.
 *
 * @param {ProxyAuthOptions} [proxyAuthOptions] the proxy auth options
 * @returns {Function} the Fetch API function
 */
function createFetch (proxyAuthOptions) {
  const fn = async (resource, options) => {
    // proxyAuthOptions as a parameter will override any proxy env vars
    if (!proxyAuthOptions) {
      const proxyUrl = getProxyForUrl(resource)
      if (proxyUrl) {
        proxyAuthOptions = { proxyUrl }
      }
    }

    if (proxyAuthOptions) {
      logger.debug(`createFetch: proxy url found ${proxyAuthOptions.proxyUrl} for url ${resource}`)
      // in this closure: for fetch-retry, if we don't require it dynamically here, ProxyFetch will be an empty object
      const ProxyFetch = require('./ProxyFetch')
      const proxyFetch = new ProxyFetch(proxyAuthOptions)
      return proxyFetch.fetch(resource, options)
    } else {
      logger.debug('createFetch: proxy url not found, using plain fetch')
      return originalFetch(resource, options)
    }
  }
  const { Request, Response, Headers } = originalFetch
  fn.Request = Request
  fn.Response = Response
  fn.Headers = Headers
  return fn
}

/**
 * Converts a URL to a suitable object for http request options.
 *
 * @private
 * @param {string} aUrl the url to parse
 * @returns {object} an object to pass for http request options
 */
function urlToHttpOptions (aUrl) {
  if (!aUrl) {
    return {}
  }

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
  createFetch
}
