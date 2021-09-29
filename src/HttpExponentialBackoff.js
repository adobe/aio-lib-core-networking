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

const DEFAULT_MAX_RETRIES = 3
const DEFAULY_INITIAL_DELAY_MS = 100
const loggerNamespace = '@adobe/aio-lib-core-networking:HttpExponentialBackoff'
const logger = require('@adobe/aio-lib-core-logging')(loggerNamespace, { level: process.env.LOG_LEVEL })
const { createFetch } = require('./utils')

/* global Request, Response, ProxyAuthOptions */ // for linter

/**
 * Fetch Retry Options
 *
 * @typedef {object} RetryOptions
 * @property {number} maxRetries the maximum number of retries to try (default:3)
 * @property {number} initialDelayInMillis the initial delay in milliseconds (default:100ms)
 * @property {ProxyAuthOptions} proxy  the (optional) proxy auth options
 */

/**
 * This class provides methods to implement fetch with retries.
 * The retries use exponential backoff strategy
 * with defaults set to max of 3 retries and initial Delay as 100ms
 */
class HttpExponentialBackoff {
  /**
   * This function will retry connecting to a url end-point, with
   * exponential backoff. Returns a Promise.
   *
   * @param {string} url endpoint url
   * @param {object|Request} requestOptions request options
   * @param {RetryOptions} [retryOptions] (optional) retry options
   * @param {Function|Array} [retryOn] (optional) Function or Array. If provided, will be used instead of the default
   * @param {Function|number} [retryDelay] (optional) Function or number. If provided, will be used instead of the default
   * @returns {Promise<Response>} Promise object representing the http response
   */
  async exponentialBackoff (url, requestOptions, retryOptions = {},
    retryOn, retryDelay) {
    const {
      maxRetries = DEFAULT_MAX_RETRIES,
      initialDelayInMillis = DEFAULY_INITIAL_DELAY_MS,
      proxy
    } = retryOptions
    return this.exponentialBackoffHelper(url, requestOptions,
      { maxRetries, initialDelayInMillis, proxy }, retryOn, retryDelay)
  }

  /**
    * This function is to be called from any SDK that needs to implement fetch with retries.
    * If retryOn is provided, the default implementation of retryOn will not be used.
    * In case of a custom retryOn, care should be taken to handle number of retries.
    * Fetch-Retry honors only one of retryOn or retries options in the request.
    *
    * @param {string} url endpoint url
    * @param {Request} requestOptions request options
    * @param {RetryOptions} retryOptions retry options with keys being maxRetries and initialDelay in ms
    * @param {Function|Array} retryOn Optional Function or Array. If provided, will be used instead of the default
    * @param {Function|number} retryDelay Optional Function or number. If provided, will be used instead of the default
    * @private
    */
  async exponentialBackoffHelper (url, requestOptions, retryOptions, retryOn, retryDelay) {
    const retryFunctions = this.__getRetryOptions(retryOptions.maxRetries, retryOptions.initialDelayInMillis)
    requestOptions.retries = retryOptions.maxRetries
    requestOptions.retryOn = retryOn || retryFunctions.retryOn
    requestOptions.retryDelay = retryDelay || retryFunctions.retryDelay

    const proxyFetch = createFetch(retryOptions.proxy)
    const fetch = require('fetch-retry')(proxyFetch)
    return fetch(url, requestOptions)
  }

  /**
    * Fetch the retry options with max retries and initial delay in millis
    *
    * @param {number} retries Max number of retries
    * @param {number} initialDelayInMillis used for exponential backoff as the multiplying factor
    * @returns {object} retryOptions {{retryDelay: (function(*=, *, *): number), retryOn: (function(...[*]=))}}
    * @private
    */
  __getRetryOptions (retries, initialDelayInMillis) {
    return {
      retryOn: this.__getRetryOn(retries),
      retryDelay: this.__getRetryDelay(initialDelayInMillis)
    }
  }

  /**
    * The function that evaluates the condition for retries.
    * The retryOn function must return a boolean on evaluation
    *
    * @param {number} retries Max number of retries
    * @returns {Function} retryOnFunction {function(...[*]=)}
    * @private
    */
  __getRetryOn (retries) {
    return function (attempt, error, response) {
      if (attempt < retries && (error !== null || (response.status > 499 && response.status < 600))) {
        const msg = `Retrying after attempt ${attempt + 1}. failed: ${error || response.statusText}`
        logger.debug(msg)
        return true
      }
      return false
    }
  }

  /**
    * Retry Delay returns a function that implements exponential backoff
    *
    * @param {number} initialDelayInMillis The multiplying factor and the initial delay. Eg. 100 would mean the retries would be spaced at 100, 200, 400, .. ms
    * @returns {Function} retryDelayFunction {function(*=, *, *): number}
    * @private
    */
  __getRetryDelay (initialDelayInMillis) {
    return function (attempt, error, response) {
      const timeToWait = Math.pow(2, attempt) * initialDelayInMillis // 1000, 2000, 4000
      const msg = `Request will be retried after ${timeToWait} ms`
      logger.debug(msg)
      return timeToWait
    }
  }
}

module.exports = HttpExponentialBackoff
