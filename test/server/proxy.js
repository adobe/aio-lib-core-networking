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

const loggerNamespace = '@adobe/aio-lib-core-networking:test/proxy'
const logger = require('@adobe/aio-lib-core-logging')(loggerNamespace, { level: process.env.LOG_LEVEL })
const mockttp = require('mockttp')
const syswidecas = require('syswide-cas')
const { mkdtemp, writeFile } = require('fs/promises')
const path = require('path')
const os = require('os')

/**
 * HTTP Options
 *
 * @typedef {object} HttpOptions the http proxy options
 * @property {number} port the port to use
 * @property {boolean} useBasicAuth use basic authorization
 * @property {boolean} [username=admin] the username for basic authorization
 * @property {boolean} [password=secret] the password for basic authorization
 */

/**
 * Create a HTTP forwarding proxy
 *
 * For use in tests only.
 * Default port is 8080.
 *
 * @param {HttpOptions} httpOptions the http proxy options
 * @returns {Promise<mockttp.Mockttp>} the proxy server instance
 */
async function createHttpProxy (httpOptions = {}) {
  const { port = 8080 } = httpOptions
  const server = mockttp.getLocal()

  setupServerRules(server, httpOptions)

  await server.start(port)

  logger.debug(`http proxy server running on port ${server.port}`)
  return server
}

/**
 * Generate certs for SSL, and add it to the root CAs temporarily.
 * This prevents any self-signed cert errors for tests when using the https proxy.
 *
 * @returns {object} the https object containing the cert and key
 */
async function generateCertAndAddToRootCAs () {
  const https = await mockttp.generateCACertificate()

  const tmpFolder = await mkdtemp(path.join(os.tmpdir(), 'test-proxy-'))
  const certPath = path.join(tmpFolder, 'server.crt')
  await writeFile(certPath, https.cert)

  syswidecas.addCAs(certPath)

  return https
}

/**
 * Setup the rules for a server.
 *
 * httpOptions.basicAuth defaults to false, and the default username and password
 * for httpOptions is admin, and secret (respectively)
 *
 * @param {mockttp.Mockttp} server the proxy server instance to set up
 * @param {HttpOptions} httpOptions the http proxy options
 * @returns {Promise<mockttp.Mockttp>} the proxy server instance
 */
function setupServerRules (server, httpOptions) {
  const { useBasicAuth = false, username = 'admin', password = 'secret' } = httpOptions
  const passThroughOptions = { ignoreHostHttpsErrors: ['localhost', '127.0.0.1'] }

  if (!useBasicAuth) {
    server.anyRequest().thenPassThrough(passThroughOptions)
  } else {
    const authorization = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    // this rule makes the request pass through (authorization correct)
    server.anyRequest()
      .withHeaders({ 'Proxy-Authorization': authorization })
      .thenPassThrough(passThroughOptions)
    // this rule makes any other request fail
    server.anyRequest().thenReply(403)
  }

  return server
}

/**
 * Create a HTTPS forwarding proxy
 *
 * For use in tests only.
 * Default port is 8081.
 *
 * @param {HttpOptions} httpOptions the http proxy options
 * @returns {Promise<mockttp.Mockttp>} the proxy server instance
 */
async function createHttpsProxy (httpOptions = {}) {
  const { port = 8081 } = httpOptions
  const https = await generateCertAndAddToRootCAs()
  const server = mockttp.getLocal({ https })

  setupServerRules(server, httpOptions)

  await server.start(port)

  logger.debug(`https proxy server running on port ${server.port}`)
  return server
}

module.exports = {
  createHttpProxy,
  createHttpsProxy
}
