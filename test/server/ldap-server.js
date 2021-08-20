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

const loggerNamespace = '@adobe/aio-lib-core-networking:test/ldap-server'
const logger = require('@adobe/aio-lib-core-logging')(loggerNamespace, { level: process.env.LOG_LEVEL })

const ldap = require('ldapjs')

// see https://github.com/ldapjs/node-ldapjs/blob/master/examples/inmemory.js

/**
 * Create an in-memory LDAP server.
 *
 * @param {number} [port=1389] the port number to listen to
 * @returns {object} the LDAP server instance
 */
function createLdapServer (port = 1389) {
  const server = ldap.createServer()

  server.bind('cn=admin', (req, res, next) => {
    if (req.dn.toString() !== 'cn=admin' || req.credentials !== 'secret') {
      return next(new ldap.InvalidCredentialsError())
    }

    res.end()
    return next()
  })

  server.listen(port, 'localhost', () => {
    logger.debug(`LDAP server up at: ${server.url}`)
  })
  return server
}

module.exports = {
  createLdapServer
}
