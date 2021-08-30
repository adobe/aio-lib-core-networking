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

const { HttpExponentialBackoff, ProxyFetch, createFetch, getProxyOptionsFromConfig } = require('../src/index')
const configMock = require('@adobe/aio-lib-core-config')
const fetchMock = require('node-fetch')

jest.mock('node-fetch')
jest.mock('@adobe/aio-lib-core-config')

test('exports', () => {
  expect(typeof HttpExponentialBackoff).toEqual('function')
  expect(typeof new HttpExponentialBackoff()).toEqual('object')

  expect(typeof ProxyFetch).toEqual('function')
  expect(typeof new ProxyFetch({ proxyUrl: 'http://my-proxy.server' })).toEqual('object')

  expect(typeof createFetch).toEqual('function')
  expect(typeof createFetch()).toEqual('function')

  expect(typeof getProxyOptionsFromConfig).toEqual('function')
  expect(typeof getProxyOptionsFromConfig()).toEqual('object')
})

describe('getProxyOptionsFromConfig', () => {
  afterEach(() => {
    configMock.get.mockImplementation(() => undefined)
  })

  test('no config set', () => {
    const result = getProxyOptionsFromConfig()
    expect(result).toEqual(null)
  })

  test('proxy url set (no username, no password)', () => {
    const proxyUrl = 'http://foo.bar'
    configMock.get.mockReturnValueOnce(proxyUrl)

    const result = getProxyOptionsFromConfig()
    expect(result).toEqual({ proxyUrl })
  })

  test('proxy url set, username set, no password', () => {
    const proxyUrl = 'http://foo.bar'
    configMock.get
      .mockReturnValueOnce(proxyUrl)
      .mockReturnValueOnce('myuser')
      .mockReturnValueOnce(undefined)

    const result = getProxyOptionsFromConfig()
    expect(result).toEqual({ proxyUrl })
  })

  test('proxy url set, no username set, password set', () => {
    const proxyUrl = 'http://foo.bar'
    configMock.get
      .mockReturnValueOnce(proxyUrl)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce('mypassword')

    const result = getProxyOptionsFromConfig()
    expect(result).toEqual({ proxyUrl })
  })

  test('proxy url set, username set, password set', () => {
    const proxyUrl = 'http://foo.bar'
    const username = 'myuser'
    const password = 'mypassword'

    configMock.get
      .mockReturnValueOnce(proxyUrl)
      .mockReturnValueOnce(username)
      .mockReturnValueOnce(password)

    const result = getProxyOptionsFromConfig()
    expect(result).toEqual({ proxyUrl, username, password })
  })
})

describe('createFetch', () => {
  const mockProxyFetchFetch = jest.fn()

  beforeEach(() => {
    jest.spyOn(ProxyFetch.prototype, 'fetch').mockImplementation(mockProxyFetchFetch)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('default', async () => {
    const body = 'this is some body text'
    const status = 200
    fetchMock.mockResponse(body, { status })

    // this should use node-fetch
    const newFetch = createFetch()
    const response = await newFetch('http://some.server')
    expect(response.body.toString()).toEqual(body)
    expect(response.status).toEqual(status)
  })

  test('proxy set via constructor', async () => {
    const body = 'this is some proxyfetch text'
    const result = {
      body,
      status: 200
    }
    mockProxyFetchFetch.mockResolvedValue(result)

    // this should use ProxyFetch (set proxy options as the constructor parameter)
    const newFetch = createFetch({ proxyUrl: 'http://some.proxy' })
    const response = await newFetch('http://some.server')
    expect(response.body.toString()).toEqual(body)
    expect(response.status).toEqual(result.status)
  })

  test('proxy set via config', async () => {
    const body = 'this is some proxyfetch text'
    const result = {
      body,
      status: 200
    }
    mockProxyFetchFetch.mockResolvedValue(result)

    const proxyUrl = 'http://foo.bar'
    const username = 'myuser'
    const password = 'mypassword'

    configMock.get
      .mockReturnValueOnce(proxyUrl)
      .mockReturnValueOnce(username)
      .mockReturnValueOnce(password)

    // this should use ProxyFetch (no proxy options as the constructor parameter)
    const newFetch = createFetch()
    const response = await newFetch('http://some.server')
    expect(response.body.toString()).toEqual(body)
    expect(response.status).toEqual(result.status)
  })
})
