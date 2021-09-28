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

const { urlToHttpOptions, createFetch } = require('../src/utils')
const { ProxyFetch } = require('../src/index')
const { getProxyForUrl } = require('proxy-from-env')

const fetchMock = require('node-fetch')

jest.mock('proxy-from-env')
jest.mock('node-fetch')

test('exports', () => {
  expect(typeof urlToHttpOptions).toEqual('function')
  expect(typeof createFetch).toEqual('function')
})

test('url test (undefined)', () => {
  const url = undefined
  expect(urlToHttpOptions(url)).toStrictEqual({})
})

test('url test (no basic auth)', () => {
  const url = 'http://example.com/mypath/?query=foo'
  expect(urlToHttpOptions(url)).toStrictEqual({
    hash: '',
    hostname: 'example.com',
    href: 'http://example.com/mypath/?query=foo',
    path: undefined,
    pathname: '/mypath/',
    port: '',
    protocol: 'http:',
    search: '?query=foo'
  })
})

test('url test (basic auth)', () => {
  const url = 'http://admin:secret@example.com/mypath/?query=foo'
  expect(urlToHttpOptions(url)).toStrictEqual({
    hash: '',
    hostname: 'example.com',
    href: 'http://admin:secret@example.com/mypath/?query=foo',
    path: undefined,
    pathname: '/mypath/',
    port: '',
    protocol: 'http:',
    search: '?query=foo',
    auth: 'admin:secret'
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

  test('default (no proxy)', async () => {
    const body = 'this is some body text'
    const status = 200
    fetchMock.mockResponse(body, { status })

    // this should use node-fetch
    const newFetch = createFetch()
    const response = await newFetch('http://some.server')
    expect(response.body.toString()).toEqual(body)
    expect(response.status).toEqual(status)

    // the fetch is node-fetch, it should have Request, Response, Headers classes
    expect(typeof newFetch.Request).toEqual('function')
    expect(typeof newFetch.Response).toEqual('function')
    expect(typeof newFetch.Headers).toEqual('function')
  })

  test('proxy set via environment variable(s)', async () => {
    const body = 'this is some proxyfetch text'
    const result = {
      body,
      status: 200
    }
    const testUrl = 'http://some.server'
    mockProxyFetchFetch.mockResolvedValue(result)

    const proxyUrl = 'http://foo.bar'
    getProxyForUrl.mockReturnValue(proxyUrl)

    // this should use ProxyFetch
    const newFetch = createFetch()
    const response = await newFetch(testUrl)
    expect(getProxyForUrl).toHaveBeenCalledWith(testUrl)
    expect(response.body.toString()).toEqual(body)
    expect(response.status).toEqual(result.status)
  })
})
