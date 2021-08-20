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

const fetch = jest.requireActual('node-fetch')
// const NtlmFetch = require('../src/NtlmFetch')
const queryString = require('query-string')
const HttpProxyAgent = require('proxy-agent')
const { createHttpProxy } = require('./server/http-proxy')
const { createApiServer } = require('./server/api-server')

describe('proxy (no auth)', () => {
  let proxyServer, proxyCleanup, proxyAgent

  beforeAll(async () => {
    [proxyServer, proxyCleanup] = await createHttpProxy()

    const proxyServerAddress = proxyServer.address()
    const proxyUrl = `http://${proxyServerAddress.address}:${proxyServerAddress.port}`
    proxyAgent = new HttpProxyAgent(proxyUrl)
  })

  afterAll(() => {
    proxyServer.close()
    proxyCleanup()
  })

  test('api server success', async () => {
    const apiServer = await createApiServer()
    const apiServerAddress = apiServer.address()
    const queryObject = { foo: 'bar' }

    const testUrl = `http://${apiServerAddress.address}:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`
    const response = await fetch(testUrl, { agent: proxyAgent })
    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
    apiServer.close()
  })

  test('api server failure', async () => {
    // api server is not instantiated
    const testUrl = 'http://localhost:3001/mirror/?foo=bar'
    const response = await fetch(testUrl, { agent: proxyAgent })
    expect(response.ok).toEqual(false)
    expect(response.status).toEqual(503)
  })
})

describe('proxy (basic auth)', () => {
  let proxyServer, proxyCleanup, proxyAgent
  let apiServer, apiServerAddress

  beforeAll(async () => {
    [proxyServer, proxyCleanup] = await createHttpProxy({ useBasicAuth: true }) // admin:secret

    const proxyServerAddress = proxyServer.address()
    const proxyUrl = `http://${proxyServerAddress.address}:${proxyServerAddress.port}`
    proxyAgent = new HttpProxyAgent(proxyUrl)

    apiServer = await createApiServer()
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
    const headers = {
      Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    }

    const testUrl = `http://${apiServerAddress.address}:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`
    const response = await fetch(testUrl, { headers, agent: proxyAgent })
    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
  })

  test('api server failure', async () => {
    const queryObject = { bar: 'foo' }

    const username = 'admin'
    const password = 'dont-know-the-password'
    const headers = {
      Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    }

    const testUrl = `http://${apiServerAddress.address}:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`
    const response = await fetch(testUrl, { headers, agent: proxyAgent })
    expect(response.ok).toEqual(false)
    expect(response.status).toEqual(401)
    expect(response.headers.get('www-authenticate')).toEqual('Basic')
  })
})

describe('proxy (ntlm auth)', () => {
  let proxyServer, proxyCleanup, proxyAgent
  let apiServer, apiServerAddress

  beforeAll(async () => {
    [proxyServer, proxyCleanup] = await createHttpProxy({ useNtlmAuth: true })

    const proxyServerAddress = proxyServer.address()
    const proxyUrl = `http://${proxyServerAddress.address}:${proxyServerAddress.port}`
    proxyAgent = new HttpProxyAgent(proxyUrl)

    apiServer = await createApiServer()
    apiServerAddress = apiServer.address()
  })

  afterAll(() => {
    proxyServer.close()
    proxyCleanup()
    apiServer.close()
  })

  // test('api server success', async () => {
  //   const queryObject = { foo: 'bar' }

  //   try {
  //     const ntlmFetch = new NtlmFetch({ username: 'admin', password: 'secret', domain: 'MYDOMAIN' })
  //     const testUrl = `http://${apiServerAddress.address}:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`
  //     const response = await ntlmFetch.fetch(testUrl, { agent: proxyAgent })
  //     const json = await response.json()
  //     expect(json).toStrictEqual(queryObject)
  //   } catch (e) {
  //     console.error(e)
  //   } finally {
  //     apiServer.close()
  //   }
  // })

  test('api server failure', async () => {
    const queryObject = { bar: 'foo' }

    const testUrl = `http://${apiServerAddress.address}:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`
    const response = await fetch(testUrl, { agent: proxyAgent })
    expect(response.ok).toEqual(false)
    expect(response.status).toEqual(401)
    expect(response.headers.get('www-authenticate')).toEqual('NTLM')
  })
})
