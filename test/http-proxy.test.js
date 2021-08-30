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

const ProxyFetch = require('../src/ProxyFetch')
const { codes } = require('../src/SDKErrors')
const queryString = require('query-string')
const { createHttpProxy } = require('./server/http-proxy')
const { createApiServer } = require('./server/api-server')

let apiServerPort = 3001

// unmock node-fetch
jest.mock('node-fetch', () =>
  jest.requireActual('node-fetch')
)

test('proxy init error', () => {
  const err = new codes.ERROR_PROXY_FETCH_INITIALIZATION({
    sdkDetails: {},
    messageValues: 'proxyUrl'
  })
  expect(() => new ProxyFetch()).toThrow(err)
})

describe('proxy (no auth)', () => {
  let proxyServer, proxyCleanup, proxyFetch

  beforeAll(async () => {
    [proxyServer, proxyCleanup] = await createHttpProxy()

    const proxyServerAddress = proxyServer.address()
    const proxyUrl = `http://${proxyServerAddress.address}:${proxyServerAddress.port}`
    proxyFetch = new ProxyFetch({ proxyUrl })
  })

  afterAll(() => {
    proxyServer.close()
    proxyCleanup()
  })

  test('api server success', async () => {
    const apiServer = await createApiServer({ port: apiServerPort++ })
    const apiServerAddress = apiServer.address()
    const queryObject = { foo: 'bar' }

    const testUrl = `http://${apiServerAddress.address}:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`
    const response = await proxyFetch.fetch(testUrl)
    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
    apiServer.close()
  })

  test('api server failure', async () => {
    // api server is not instantiated
    const testUrl = 'http://localhost:3001/mirror/?foo=bar'
    const response = await proxyFetch.fetch(testUrl)
    expect(response.ok).toEqual(false)
    expect(response.status).toEqual(503)
  })
})

describe('proxy (basic auth)', () => {
  let proxyServer, proxyCleanup, proxyUrl
  let apiServer, apiServerAddress

  beforeAll(async () => {
    [proxyServer, proxyCleanup] = await createHttpProxy({ useBasicAuth: true }) // admin:secret

    const proxyServerAddress = proxyServer.address()
    proxyUrl = `http://${proxyServerAddress.address}:${proxyServerAddress.port}`

    apiServer = await createApiServer({ port: apiServerPort++ })
    apiServerAddress = apiServer.address()
  })

  afterAll(() => {
    proxyServer.close()
    proxyCleanup()
    apiServer.close()
  })

  test('api server success', async () => {
    const queryObject = { foo: 'bar' }

    const username = 'admin'
    const password = 'secret'
    // we only set headers here for our test proxy server which doesn't handle the Proxy-Authorization header
    // see https://github.com/LionC/express-basic-auth/pull/39
    const headers = {
      Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    }
    const proxyFetch = new ProxyFetch({ proxyUrl, username, password })

    const testUrl = `http://${apiServerAddress.address}:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`
    const response = await proxyFetch.fetch(testUrl, { headers })
    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
  })

  test('api server failure', async () => {
    const queryObject = { bar: 'foo' }

    const username = 'foo'
    const password = 'dont-know-the-password'
    // we only set headers here for our test proxy server which doesn't handle the Proxy-Authorization header
    // see https://github.com/LionC/express-basic-auth/pull/39
    const headers = {
      Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    }
    const proxyFetch = new ProxyFetch({ proxyUrl, username, password })

    const testUrl = `http://${apiServerAddress.address}:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`
    const response = await proxyFetch.fetch(testUrl, { headers })
    expect(response.ok).toEqual(false)
    expect(response.status).toEqual(401)
    expect(response.headers.get('www-authenticate')).toEqual('Basic')
  })
})
