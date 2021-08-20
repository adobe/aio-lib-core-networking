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
const loggerNamespace = '@adobe/aio-lib-core-networking:test/http-proxy'
const logger = require('@adobe/aio-lib-core-logging')(loggerNamespace, { level: process.env.LOG_LEVEL })

const express = require('express')
const httpProxy = require('http-proxy')
const basicAuth = require('express-basic-auth')
const ntlmAuth = require('express-ntlm')
const { createLdapServer } = require('./ldap-server')

/**
 * Create a pass-through HTTP proxy server.
 *
 * @param {object} options the options object
 * @param {boolean} [options.useBasicAuth=false] enable Basic auth on the pass-through proxy
 * @param {boolean} [options.useNtlmAuth=false] enable NTLM auth on the pass-through proxy
 * @param {number} [options.port=3000] the port number to listen to
 * @returns {object} the HTTP proxy server object
 */
async function createHttpProxy (options = {}) {
  const { useBasicAuth = false, useNtlmAuth = false, port = 3000 } = options

  // proxy options: https://github.com/http-party/node-http-proxy/blob/HEAD/lib/http-proxy.js#L26-L42
  const proxy = httpProxy.createProxyServer({})

  const app = express()

  if (useBasicAuth) {
    app.use(basicAuth({
      users: { admin: 'secret' },
      challenge: true
    }))
  }

  if (useNtlmAuth) {
    const ldapServer = createLdapServer()

    app.use(ntlmAuth({
      debug: function () {
        var args = Array.prototype.slice.apply(arguments)
        console.log.apply(null, args)
      },
      domain: 'MYDOMAIN',
      domaincontroller: ldapServer.url

      // use different port (default: 389)
      // domaincontroller: 'ldap://myad.example:3899',
    }))
  }

  app.all('*', function (req, res) {
    logger.debug('Request', req.method, req.url)
    const target = `${req.protocol}://${req.headers.host}`
    proxy.web(req, res, { target }, e => {
      logger.debug(e)
      switch (e.code) {
        case 'ECONNREFUSED': // in case we need to differentiate
        default:
          res.status(503).send(e)
      }
    })
  })

  const server = await app.listen(port, 'localhost')
  return new Promise(resolve => {
    server.on('listening', () => {
      logger.debug('Proxy server started on port %s at %s', server.address().port, server.address().address)
      resolve(server)
    })
  })
}

module.exports = {
  createHttpProxy
}
