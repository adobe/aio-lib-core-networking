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

const { urlToHttpOptions, createFetch, parseRetryAfterHeader } = require('../src/utils')
const { ProxyFetch } = require('../src/index')
const { getProxyForUrl } = require('proxy-from-env')

const fetchMock = require('node-fetch')

jest.mock('proxy-from-env')
jest.mock('node-fetch')

test('exports', () => {
  expect(typeof urlToHttpOptions).toEqual('function')
  expect(typeof createFetch).toEqual('function')
  expect(typeof parseRetryAfterHeader).toEqual('function')
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

/*
  Proxy username and password: special character support
  Ensure that the special character (here: encoded backslash in the username) is decoded in the 'auth' property.
  See curl (e.g., with verbose output) for reference
*/
test('url test (basic auth) with special character in username', () => {
  const url = 'http://domain%5Cadmin:secret@example.com/mypath/?query=foo'
  expect(urlToHttpOptions(url)).toStrictEqual({
    hash: '',
    hostname: 'example.com',
    href: 'http://domain%5Cadmin:secret@example.com/mypath/?query=foo',
    path: undefined,
    pathname: '/mypath/',
    port: '',
    protocol: 'http:',
    search: '?query=foo',
    auth: 'domain\\admin:secret'
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

describe('parseRetryAfterHeader', () => {
  test('null retry after', () => {
    const header = 'null'
    expect(parseRetryAfterHeader(header)).toEqual(NaN)
  })
  test('positive integer retry-after header', () => {
    const header = '23'
    expect(parseRetryAfterHeader(header)).toEqual(23000)
  })
  test('negative integer retry-after header', () => {
    const header = '-23'
    expect(parseRetryAfterHeader(header)).toEqual(NaN)
  })
  test('retry-after header is 0', () => {
    const header = '0'
    expect(parseRetryAfterHeader(header)).toEqual(NaN)
  })
  test('date retry-after header', () => {
    const spy = jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('Mon, 13 Feb 2023 23:59:59 GMT'))
    const header = 'Tue, 14 Feb 2023 00:00:00 GMT'
    expect(parseRetryAfterHeader(header)).toEqual(1000)
    expect(spy).toHaveBeenCalled()
  })
  test('date retry-after header older than now', () => {
    const spy = jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('Tue, 14 Feb 2023 00:00:00 GMT'))
    const header = 'Mon, 13 Feb 2023 23:59:59 GMT'
    expect(parseRetryAfterHeader(header)).toEqual(NaN)
    expect(spy).toHaveBeenCalled()
  })
  test('invalid retry-after header', () => {
    const header = 'not::a::date'
    expect(parseRetryAfterHeader(header)).toEqual(NaN)
  })
})
