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
const { createHttpsProxy, createHttpProxy } = require('./server/proxy')
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
  let httpsProxyServer, httpProxyServer
  let httpApiServer, httpsApiServer
  const portNotInUse = 3009

  beforeAll(async () => {
    httpsProxyServer = await createHttpsProxy()
    httpProxyServer = await createHttpProxy()

    httpsApiServer = await createApiServer({ port: 3001, useSsl: true })
    httpApiServer = await createApiServer({ port: 3000, useSsl: false })
  })

  afterAll(async () => {
    await httpsProxyServer.stop()
    await httpProxyServer.stop()

    await httpsApiServer.close()
    await httpApiServer.close()
  })

  test('api server success (https)', async () => {
    const apiServerAddress = httpsApiServer.address()
    const queryObject = { foo: 'bar' }

    const testUrl = `https://localhost:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`

    const proxyUrl = httpsProxyServer.url
    const proxyFetch = new ProxyFetch({ proxyUrl, rejectUnauthorized: false })
    const response = await proxyFetch.fetch(testUrl)

    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
  })

  test('api server failure (https)', async () => {
    // connect to non-existent server port
    const testUrl = `https://localhost:${portNotInUse}/mirror/?foo=bar`

    const proxyUrl = httpsProxyServer.url
    const proxyFetch = new ProxyFetch({ proxyUrl, rejectUnauthorized: false })

    const response = await proxyFetch.fetch(testUrl)
    expect(response.ok).toEqual(false)
    expect(response.status).toEqual(502)
  })

  test('api server success (http)', async () => {
    const apiServerAddress = httpApiServer.address()
    const queryObject = { foo: 'bar' }

    const testUrl = `http://localhost:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`

    const proxyUrl = httpProxyServer.url
    const proxyFetch = new ProxyFetch({ proxyUrl, rejectUnauthorized: false })
    const response = await proxyFetch.fetch(testUrl)

    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
  })

  test('api server failure (http)', async () => {
    // connect to non-existent server port
    const testUrl = `http://localhost:${portNotInUse}/mirror/?foo=bar`

    const proxyUrl = httpProxyServer.url
    const proxyFetch = new ProxyFetch({ proxyUrl, rejectUnauthorized: false })

    const response = await proxyFetch.fetch(testUrl)
    expect(response.ok).toEqual(false)
    expect(response.status).toEqual(502)
  })
})

describe('proxy (basic auth)', () => {
  let httpsProxyServer, httpProxyServer
  let httpsApiServer, httpApiServer

  beforeAll(async () => {
    httpsProxyServer = await createHttpsProxy({ useBasicAuth: true })
    httpProxyServer = await createHttpProxy({ useBasicAuth: true })

    httpsApiServer = await createApiServer({ port: 3001, useSsl: true })
    httpApiServer = await createApiServer({ port: 3002, useSsl: false })
  })

  afterAll(async () => {
    await httpsProxyServer.stop()
    await httpProxyServer.stop()

    await httpsApiServer.close()
    await httpApiServer.close()
  })

  test('api server success (https)', async () => {
    const queryObject = { foo: 'bar' }
    const httpsApiServerPort = httpsApiServer.address().port

    const username = 'admin'
    const password = 'secret'
    const headers = {
      'Proxy-Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    }
    const proxyUrl = httpsProxyServer.url
    const proxyFetch = new ProxyFetch({ proxyUrl, username, password, rejectUnauthorized: false })

    const testUrl = `https://localhost:${httpsApiServerPort}/mirror?${queryString.stringify(queryObject)}`
    const response = await proxyFetch.fetch(testUrl, { headers })
    expect(response.ok).toEqual(true)
    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
  })

  test('api server failure (https)', async () => {
    const queryObject = { bar: 'foo' }
    const httpsApiServerPort = httpsApiServer.address().port

    const username = 'foo'
    const password = 'dont-know-the-password'
    const headers = {
      'Proxy-Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    }
    const proxyUrl = httpsProxyServer.url
    const proxyFetch = new ProxyFetch({ proxyUrl, username, password, rejectUnauthorized: false })

    const testUrl = `https://localhost:${httpsApiServerPort}/mirror?${queryString.stringify(queryObject)}`
    const response = await proxyFetch.fetch(testUrl, { headers })
    expect(response.ok).toEqual(false)
    expect(response.status).toEqual(403)
  })

  test('api server success (http)', async () => {
    const queryObject = { foo: 'bar' }
    const httpApiServerPort = httpApiServer.address().port

    const username = 'admin'
    const password = 'secret'
    const headers = {
      'Proxy-Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    }
    const proxyUrl = httpProxyServer.url
    const proxyFetch = new ProxyFetch({ proxyUrl, username, password, rejectUnauthorized: false })

    const testUrl = `http://localhost:${httpApiServerPort}/mirror?${queryString.stringify(queryObject)}`
    const response = await proxyFetch.fetch(testUrl, { headers })
    expect(response.ok).toEqual(true)
    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
  })

  test('api server failure (http)', async () => {
    const queryObject = { bar: 'foo' }
    const httpApiServerPort = httpApiServer.address().port

    const username = 'foo'
    const password = 'dont-know-the-password'
    const headers = {
      'Proxy-Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    }
    const proxyUrl = httpProxyServer.url
    const proxyFetch = new ProxyFetch({ proxyUrl, username, password, rejectUnauthorized: false })

    const testUrl = `http://localhost:${httpApiServerPort}/mirror?${queryString.stringify(queryObject)}`
    const response = await proxyFetch.fetch(testUrl, { headers })
    expect(response.ok).toEqual(false)
    expect(response.status).toEqual(403)
  })
})

describe('HttpExponentialBackoff with proxy', () => {
  let httpsProxyServer, httpProxyServer
  let httpsApiServer, httpApiServer

  beforeAll(async () => {
    httpsProxyServer = await createHttpsProxy()
    httpProxyServer = await createHttpProxy()

    httpsApiServer = await createApiServer({ port: 3001, useSsl: true })
    httpApiServer = await createApiServer({ port: 3002, useSsl: false })
  })

  afterAll(async () => {
    await httpsProxyServer.stop()
    await httpProxyServer.stop()

    await httpsApiServer.close()
    await httpApiServer.close()
  })

  test('api server success (https)', async () => {
    const apiServerPort = httpsApiServer.address().port
    const queryObject = { foo: 'bar' }

    const testUrl = `https://localhost:${apiServerPort}/mirror?${queryString.stringify(queryObject)}`
    const proxyUrl = httpsProxyServer.url

    const fetchRetry = new HttpExponentialBackoff()
    const response = await fetchRetry.exponentialBackoff(testUrl, { method: 'GET' }, {
      proxy: { proxyUrl }
    })
    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
  })

  test('api server failure (https)', async () => {
    // connect to non-existent server port
    const testUrl = 'https://localhost:3009/mirror/?foo=bar'
    const proxyUrl = httpsProxyServer.url

    const fetchRetry = new HttpExponentialBackoff()
    const response = await fetchRetry.exponentialBackoff(testUrl, { method: 'GET' }, {
      proxy: { proxyUrl },
      maxRetries: 2
    }, [], 0) // retryDelay must be zero for test timings
    expect(response.ok).toEqual(false)
    expect(response.status).toEqual(502)
  })

  test('api server success (http)', async () => {
    const apiServerPort = httpApiServer.address().port
    const queryObject = { foo: 'bar' }

    const testUrl = `http://localhost:${apiServerPort}/mirror?${queryString.stringify(queryObject)}`
    const proxyUrl = httpProxyServer.url

    const fetchRetry = new HttpExponentialBackoff()
    const response = await fetchRetry.exponentialBackoff(testUrl, { method: 'GET' }, {
      proxy: { proxyUrl }
    })
    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
  })

  test('api server failure (http)', async () => {
    // connect to non-existent server port
    const testUrl = 'http://localhost:3009/mirror/?foo=bar'
    const proxyUrl = httpProxyServer.url

    const fetchRetry = new HttpExponentialBackoff()
    const response = await fetchRetry.exponentialBackoff(testUrl, { method: 'GET' }, {
      proxy: { proxyUrl },
      maxRetries: 2
    }, [], 0) // retryDelay must be zero for test timings
    expect(response.ok).toEqual(false)
    expect(response.status).toEqual(502)
  })
})
