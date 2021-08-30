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

const { urlToHttpOptions } = require('../src/utils')

test('exports', () => {
  expect(typeof urlToHttpOptions).toEqual('function')
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
