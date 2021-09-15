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
const HttpExponentialBackoff = require('../src/HttpExponentialBackoff')
const { codes } = require('../src/SDKErrors')
const queryString = require('query-string')
const { createHttpsProxy } = require('./server/proxy')
const { createApiServer } = require('./server/api-server')

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
  let proxyServer, proxyFetch

  beforeAll(async () => {
    proxyServer = await createHttpsProxy()
    const proxyUrl = proxyServer.url
    proxyFetch = new ProxyFetch({ proxyUrl, rejectUnauthorized: false })
  })

  afterAll(async () => {
    await proxyServer.stop()
  })

  test('api server success', async () => {
    const apiServer = await createApiServer({ useSsl: true })
    const apiServerAddress = apiServer.address()
    const queryObject = { foo: 'bar' }

    const testUrl = `https://localhost:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`
    const response = await proxyFetch.fetch(testUrl)

    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
    apiServer.close()
  })

  test('api server failure', async () => {
    // api server is not instantiated
    const testUrl = 'https://localhost:3000/mirror/?foo=bar'
    const response = await proxyFetch.fetch(testUrl)
    expect(response.ok).toEqual(false)
    expect(response.status).toEqual(502)
  })
})

describe('proxy (basic auth)', () => {
  let proxyServer, proxyUrl
  let apiServer, apiServerAddress

  beforeAll(async () => {
    proxyServer = await createHttpsProxy({ useBasicAuth: true })
    proxyUrl = proxyServer.url

    apiServer = await createApiServer({ useSsl: true })
    apiServerAddress = apiServer.address()
  })

  afterAll(() => {
    proxyServer.stop()
    apiServer.close()
  })

  test('api server success', async () => {
    const queryObject = { foo: 'bar' }

    const username = 'admin'
    const password = 'secret'
    const headers = {
      'Proxy-Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    }
    const proxyFetch = new ProxyFetch({ proxyUrl, username, password, rejectUnauthorized: false })

    const testUrl = `https://localhost:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`
    const response = await proxyFetch.fetch(testUrl, { headers })
    expect(response.ok).toEqual(true)
    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
  })

  test('api server failure', async () => {
    const queryObject = { bar: 'foo' }

    const username = 'foo'
    const password = 'dont-know-the-password'
    const headers = {
      'Proxy-Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    }
    const proxyFetch = new ProxyFetch({ proxyUrl, username, password, rejectUnauthorized: false })

    const testUrl = `https://localhost:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`
    const response = await proxyFetch.fetch(testUrl, { headers })
    expect(response.ok).toEqual(false)
    expect(response.status).toEqual(403)
  })
})

describe('HttpExponentialBackoff with proxy', () => {
  let proxyServer, proxyUrl

  beforeAll(async () => {
    proxyServer = await createHttpsProxy()
    proxyUrl = proxyServer.url
  })

  afterAll(() => {
    proxyServer.stop()
  })

  test('api server success', async () => {
    const apiServer = await createApiServer({ useSsl: true })
    const apiServerAddress = apiServer.address()
    const queryObject = { foo: 'bar' }

    const testUrl = `https://localhost:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`

    const fetchRetry = new HttpExponentialBackoff()
    const response = await fetchRetry.exponentialBackoff(testUrl, { method: 'GET' }, {
      proxy: { proxyUrl }
    })
    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
    apiServer.close()
  })

  test('api server failure', async () => {
    // api server is not instantiated
    const testUrl = 'https://localhost:3002/mirror/?foo=bar'
    const fetchRetry = new HttpExponentialBackoff()
    const response = await fetchRetry.exponentialBackoff(testUrl, { method: 'GET' }, {
      proxy: { proxyUrl },
      maxRetries: 2
    }, [], 0) // retryDelay must be zero for test timings
    expect(response.ok).toEqual(false)
    expect(response.status).toEqual(502)
  })
})
