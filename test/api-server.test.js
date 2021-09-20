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

const https = require('https')
const fetch = require('node-fetch')
const queryString = require('query-string')
const { createApiServer } = require('./server/api-server')

// unmock node-fetch
jest.mock('node-fetch', () =>
  jest.requireActual('node-fetch')
)

describe('http', () => {
  const protocol = 'http'
  let apiServer, apiServerAddress

  beforeAll(async () => {
    apiServer = await createApiServer()
    apiServerAddress = apiServer.address()
  })

  afterAll(() => {
    apiServer.close()
  })

  test('mirror success', async () => {
    // query strings values are always strings (when parsed, and in this case mirrored)
    const queryObject = {
      foo: 'bar',
      abc: '123'
    }

    const testUrl = `${protocol}://${apiServerAddress.address}:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`
    const response = await fetch(testUrl)
    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
  })

  test('post success', async () => {
    const body = { some: 'data' }
    const testUrl = `${protocol}://${apiServerAddress.address}:${apiServerAddress.port}/post`
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const json = await response.json()
    expect(json).toStrictEqual(body)
  })
})

describe('https', () => {
  const protocol = 'https'
  let apiServer, apiServerAddress

  beforeAll(async () => {
    apiServer = await createApiServer({ useSsl: true })
    apiServerAddress = apiServer.address()
  })

  afterAll(() => {
    apiServer.close()
  })

  test('mirror success', async () => {
    // query strings values are always strings (when parsed, and in this case mirrored)
    const queryObject = {
      foo: 'bar',
      abc: '123'
    }

    const testUrl = `${protocol}://${apiServerAddress.address}:${apiServerAddress.port}/mirror?${queryString.stringify(queryObject)}`
    const response = await fetch(testUrl, {
      agent: new https.Agent({
        rejectUnauthorized: false
      })
    })
    const json = await response.json()
    expect(json).toStrictEqual(queryObject)
  })

  test('post success', async () => {
    const body = { some: 'data' }
    const testUrl = `${protocol}://${apiServerAddress.address}:${apiServerAddress.port}/post`
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      agent: new https.Agent({
        rejectUnauthorized: false
      })
    })
    const json = await response.json()
    expect(json).toStrictEqual(body)
  })
})
