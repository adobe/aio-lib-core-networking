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
const loggerNamespace = '@adobe/aio-lib-core-networking:test/api-server'
const logger = require('@adobe/aio-lib-core-logging')(loggerNamespace, { level: process.env.LOG_LEVEL })
const express = require('express')
const mockttp = require('mockttp')
const https = require('https')
const http = require('http')

/**
 * Create a simple API server.
 *
 * @param {object} options the options object
 * @param {number} [options.port=3000] the port number to listen to
 * @param {number} [options.useSsl=false] use ssl (https)
 * @returns {object} the HTTP proxy server object
 */
async function createApiServer (options = {}) {
  const { port = 3000, useSsl = false } = options

  const app = express()
  app.use(express.json())

  let server

  app.get('/mirror', function (req, res) {
    return res.status(200).json({
      ...req.query
    })
  })

  app.post('/post', function (req, res) {
    return res.status(200).send(req.body)
  })

  if (useSsl) {
    const httpsOptions = await mockttp.generateCACertificate()

    server = https.createServer(httpsOptions, app).listen(port, 'localhost')
  } else {
    server = http.createServer(app).listen(port, 'localhost')
  }

  return new Promise(resolve => {
    server.on('listening', () => {
      logger.debug(`API server started on port ${server.address().port} at ${server.address().address}`)
      resolve(server)
    })
  })
}

module.exports = {
  createApiServer
}
