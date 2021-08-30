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
  urlToHttpOptions
}
