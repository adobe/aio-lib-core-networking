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
const { createApiServer, createHttpsProxy, createHttpProxy } = require('@adobe/aio-lib-test-proxy')
const { getProxyForUrl } = require('proxy-from-env')
const url = require('url')

jest.mock('proxy-from-env')

// unmock node-fetch
jest.mock('node-fetch', () =>
  jest.requireActual('node-fetch')
)

beforeEach(() => {
  jest.useRealTimers()
  getProxyForUrl.mockReset()
})

test('proxy init error', () => {
  const err = new codes.ERROR_PROXY_FETCH_INITIALIZATION({
    sdkDetails: {},
    messageValues: 'proxyUrl'
  })
  expect(() => new ProxyFetch()).toThrow(err)
})

describe('http proxy', () => {
  const protocol = 'http'
  let proxyServer, apiServer
  const portNotInUse = 3009

  describe('no auth', () => {
    beforeAll(async () => {
      proxyServer = await createHttpProxy({ useBasicAuth: false })
      apiServer = await createApiServer({ port: 3000, useSsl: false })
    })

    afterAll(async () => {
      await proxyServer.stop()
      await apiServer.close()
    })

    test('success', async () => {
      const apiServerAddress = apiServer.address()
      const queryObject = { foo: 'bar' }

      const testUrl = `${protocol}://localhost:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`

      const proxyUrl = proxyServer.url
      const proxyFetch = new ProxyFetch({ proxyUrl, rejectUnauthorized: false })
      const response = await proxyFetch.fetch(testUrl)

      const json = await response.json()
      expect(json).toStrictEqual(queryObject)
    })

    test('failure', async () => {
      // connect to non-existent server port
      const testUrl = `${protocol}://localhost:${portNotInUse}/mirror/?foo=bar`

      const proxyUrl = proxyServer.url
      const proxyFetch = new ProxyFetch({ proxyUrl, rejectUnauthorized: false })

      const response = await proxyFetch.fetch(testUrl)
      expect(response.ok).toEqual(false)
      expect(response.status).toEqual(502)
    })
  })

  describe('basic auth', () => {
    beforeAll(async () => {
      proxyServer = await createHttpProxy({ useBasicAuth: true })
      apiServer = await createApiServer({ port: 3000, useSsl: false })
    })

    afterAll(async () => {
      await proxyServer.stop()
      await apiServer.close()
    })

    test('success', async () => {
      const queryObject = { foo: 'bar' }
      const apiServerPort = apiServer.address().port

      const username = 'admin'
      const password = 'secret'
      const headers = {
        'Proxy-Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
      }

      const urlWithAuth = new url.URL(proxyServer.url)
      urlWithAuth.username = username
      urlWithAuth.password = password
      const proxyUrl = urlWithAuth.toString()

      const proxyFetch = new ProxyFetch({ proxyUrl, username, password, rejectUnauthorized: false })

      const testUrl = `${protocol}://localhost:${apiServerPort}/mirror?${queryString.stringify(queryObject)}`
      const response = await proxyFetch.fetch(testUrl, { headers })
      expect(response.ok).toEqual(true)
      const json = await response.json()
      expect(json).toStrictEqual(queryObject)
    })

    test('failure', async () => {
      const queryObject = { bar: 'foo' }
      const apiServerPort = apiServer.address().port

      const username = 'foo'
      const password = 'dont-know-the-password'
      const headers = {
        'Proxy-Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
      }

      const urlWithAuth = new url.URL(proxyServer.url)
      urlWithAuth.username = username
      urlWithAuth.password = password
      const proxyUrl = urlWithAuth.toString()

      const proxyFetch = new ProxyFetch({ proxyUrl, username, password, rejectUnauthorized: false })

      const testUrl = `${protocol}://localhost:${apiServerPort}/mirror?${queryString.stringify(queryObject)}`
      const response = await proxyFetch.fetch(testUrl, { headers })
      expect(response.ok).toEqual(false)
      expect(response.status).toEqual(403)
    })
  })

  describe('HttpExponentialBackoff', () => {
    beforeAll(async () => {
      proxyServer = await createHttpProxy()
      apiServer = await createApiServer({ port: 3002, useSsl: false })
    })

    afterAll(async () => {
      await proxyServer.stop()
      await apiServer.close()
    })

    test('success', async () => {
      const apiServerPort = apiServer.address().port
      const queryObject = { foo: 'bar' }

      const testUrl = `${protocol}://localhost:${apiServerPort}/mirror?${queryString.stringify(queryObject)}`
      const proxyUrl = proxyServer.url

      const fetchRetry = new HttpExponentialBackoff()
      const response = await fetchRetry.exponentialBackoff(testUrl, { method: 'GET' }, {
        proxy: { proxyUrl }
      })
      const json = await response.json()
      expect(json).toStrictEqual(queryObject)
    })

    test('failure', async () => {
      // connect to non-existent server port
      const testUrl = `${protocol}://localhost:3009/mirror/?foo=bar`
      const proxyUrl = proxyServer.url

      const fetchRetry = new HttpExponentialBackoff()
      const response = await fetchRetry.exponentialBackoff(testUrl, { method: 'GET' }, {
        proxy: { proxyUrl },
        maxRetries: 2
      }, [], 0) // retryDelay must be zero for test timings
      expect(response.ok).toEqual(false)
      expect(response.status).toEqual(502)
    })
  })
})

describe('https proxy', () => {
  const protocol = 'https'
  let proxyServer, apiServer
  const portNotInUse = 3009

  describe('no auth', () => {
    beforeAll(async () => {
      proxyServer = await createHttpsProxy()
      apiServer = await createApiServer({ port: 3001, useSsl: true })
    })

    afterAll(async () => {
      await proxyServer.stop()
      await apiServer.close()
    })

    test('success', async () => {
      const apiServerAddress = apiServer.address()
      const queryObject = { foo: 'bar' }

      const testUrl = `${protocol}://localhost:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`

      const proxyUrl = proxyServer.url
      const proxyFetch = new ProxyFetch({ proxyUrl, rejectUnauthorized: false })
      const response = await proxyFetch.fetch(testUrl)

      const json = await response.json()
      expect(json).toStrictEqual(queryObject)
    })

    test('failure', async () => {
      // connect to non-existent server port
      const testUrl = `${protocol}://localhost:${portNotInUse}/mirror/?foo=bar`

      const proxyUrl = proxyServer.url
      const proxyFetch = new ProxyFetch({ proxyUrl, rejectUnauthorized: false })

      const response = await proxyFetch.fetch(testUrl)
      expect(response.ok).toEqual(false)
      expect(response.status).toEqual(502)
    })
  })

  describe('basic auth', () => {
    beforeAll(async () => {
      proxyServer = await createHttpsProxy({ useBasicAuth: true })
      apiServer = await createApiServer({ port: 3001, useSsl: true })
    })

    afterAll(async () => {
      await proxyServer.stop()
      await apiServer.close()
    })

    test('success', async () => {
      const queryObject = { foo: 'bar' }
      const apiServerPort = apiServer.address().port

      const username = 'admin'
      const password = 'secret'
      const headers = {
        'Proxy-Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
      }
      const proxyUrl = proxyServer.url
      const proxyFetch = new ProxyFetch({ proxyUrl, username, password, rejectUnauthorized: false })

      const testUrl = `${protocol}://localhost:${apiServerPort}/mirror?${queryString.stringify(queryObject)}`
      const response = await proxyFetch.fetch(testUrl, { headers })
      expect(response.ok).toEqual(true)
      const json = await response.json()
      expect(json).toStrictEqual(queryObject)
    })

    test('failure', async () => {
      const queryObject = { bar: 'foo' }
      const apiServerPort = apiServer.address().port

      const username = 'foo'
      const password = 'dont-know-the-password'
      const headers = {
        'Proxy-Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
      }
      const proxyUrl = proxyServer.url
      const proxyFetch = new ProxyFetch({ proxyUrl, username, password, rejectUnauthorized: false })

      const testUrl = `${protocol}://localhost:${apiServerPort}/mirror?${queryString.stringify(queryObject)}`
      const response = await proxyFetch.fetch(testUrl, { headers })
      expect(response.ok).toEqual(false)
      expect(response.status).toEqual(403)
    })
  })

  describe('HttpExponentialBackoff', () => {
    beforeAll(async () => {
      proxyServer = await createHttpsProxy()
      apiServer = await createApiServer({ port: 3001, useSsl: true })
    })

    afterAll(async () => {
      await proxyServer.stop()
      await apiServer.close()
    })

    test('success', async () => {
      const apiServerPort = apiServer.address().port
      const queryObject = { foo: 'bar' }

      const testUrl = `${protocol}://localhost:${apiServerPort}/mirror?${queryString.stringify(queryObject)}`
      const proxyUrl = proxyServer.url

      const fetchRetry = new HttpExponentialBackoff()
      const response = await fetchRetry.exponentialBackoff(testUrl, { method: 'GET' }, {
        proxy: { proxyUrl, rejectUnauthorized: false }
      })
      const json = await response.json()
      expect(json).toStrictEqual(queryObject)
    })

    test('failure', async () => {
      // connect to non-existent server port
      const testUrl = `${protocol}://localhost:3009/mirror/?foo=bar`
      const proxyUrl = proxyServer.url

      const fetchRetry = new HttpExponentialBackoff()
      const response = await fetchRetry.exponentialBackoff(testUrl, { method: 'GET' }, {
        proxy: { proxyUrl, rejectUnauthorized: false },
        maxRetries: 2
      }, [], 0) // retryDelay must be zero for test timings
      expect(response.ok).toEqual(false)
      expect(response.status).toEqual(502)
    })
  })
})
