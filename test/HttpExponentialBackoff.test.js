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

const HttpExponentialBackoff = require('../src/HttpExponentialBackoff')
const fetchClient = new HttpExponentialBackoff()
const fetchMock = require('node-fetch')
jest.mock('node-fetch')

/**
 * Test Helper to be used to create a mock response for retryOn and track the number of times it was invoked
 *
 * @param {number} retries The number of retires retryOn should use
 * @param {number} low The lower bound in the range of status codes to be checked
 * @param {number} high The higher bound in the range of status codes to be checked
 * @returns {Function} Mocked function {Mock<any, Array<any>> | * | void | Promise<any>}
 * @private
 */
function __testRetryOnHelper (retries, low = 499, high = 600) {
  return jest.fn().mockImplementation(function (attempt, error, response) {
    if (attempt < retries && (error !== null || (response.status > low && response.status < high))) {
      return true
    }
    return false
  })
}

/**
 * Test Helper to be used to create a mock response for retryDelay and track the number of times it was invoked
 *
 * @param {number} initialDelay The multiplier factor for timer in each call
 * @returns {Function} Mocked function {Mock<any, Array<any>> | * | void | Promise<any>}
 * @private
 */
function __testRetryDelayHelper (initialDelay) {
  return jest.fn().mockImplementation(function (attempt, error, response) {
    return attempt * initialDelay// 1000, 2000, 4000
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.useRealTimers()
})

test('test exponential backoff with success in first attempt without mock retryOn', async () => {
  const result = await fetchClient.exponentialBackoff('https://abc.com/', { method: 'GET' })
  expect(result.status).toBe(200)
})

test('test exponentialBackoff with no retries on 4xx errors without mock retryOn', async () => {
  const retrySpy = jest.spyOn(fetchClient, '__getRetryOn')
  fetchMock.mockResponse('404 Not Found', {
    status: 404
  })
  const result = await fetchClient.exponentialBackoff('https://abc1.com/', { method: 'GET' })
  expect(result.status).toBe(404)
  expect(retrySpy).toHaveBeenCalledWith(3)
  retrySpy.mockRestore()
})

test('test exponentialBackoff with 3 retries on 5xx errors without mock retryOn', async () => {
  const retrySpy = jest.spyOn(fetchClient, '__getRetryOn')
  fetchMock.mockResponse('500 Internal Server Error', {
    status: 500
  })
  const result = await fetchClient.exponentialBackoff('https://abc1.com/', { method: 'GET' }, { initialDelayInMillis: 10 })
  expect(result.status).toBe(500)
  expect(retrySpy).toHaveBeenCalledWith(3)
  retrySpy.mockRestore()
})

test('test exponential backoff with success in first attempt', async () => {
  const mockDefaultFn = __testRetryOnHelper(3)
  const retrySpy = jest.spyOn(fetchClient, '__getRetryOn').mockImplementation((retries) => {
    return mockDefaultFn
  })
  fetchMock.mockResponse('200 OK', {
    status: 200
  })
  const result = await fetchClient.exponentialBackoff('https://abc.com/', { method: 'GET' })
  expect(result.status).toBe(200)
  expect(retrySpy).toHaveBeenCalledWith(3)
  expect(mockDefaultFn).toHaveBeenCalledTimes(1)
  retrySpy.mockRestore()
})

test('test exponentialBackoff with no retries on 4xx errors and default retry strategy', async () => {
  const mockDefaultFn = __testRetryOnHelper(3)
  const retrySpy = jest.spyOn(fetchClient, '__getRetryOn').mockImplementation((retries) => {
    return mockDefaultFn
  })
  fetchMock.mockResponse('404 Not Found', {
    status: 404
  })
  const result = await fetchClient.exponentialBackoff('https://abc1.com/', { method: 'GET' })
  expect(result.status).toBe(404)
  expect(retrySpy).toHaveBeenCalledWith(3)
  expect(mockDefaultFn).toHaveBeenCalledTimes(1)
  retrySpy.mockRestore()
})

test('test exponentialBackoff with 3 retries on 5xx errors and default retry strategy', async () => {
  const mockDefaultFn = __testRetryOnHelper(3)
  const retrySpy = jest.spyOn(fetchClient, '__getRetryOn').mockImplementation((retries) => {
    return mockDefaultFn
  })
  fetchMock.mockResponse('500 Internal Server Error', {
    status: 500
  })
  const result = await fetchClient.exponentialBackoff('https://abc1.com/', { method: 'GET' }, { initialDelayInMillis: 10 })
  expect(result.status).toBe(500)
  expect(retrySpy).toHaveBeenCalledWith(3)
  expect(mockDefaultFn).toHaveBeenCalledTimes(4)
  retrySpy.mockRestore()
})

test('test exponential backoff with success in first attempt and custom retryOptions', async () => {
  const mockDefaultFn = __testRetryOnHelper(2)
  const retrySpy = jest.spyOn(fetchClient, '__getRetryOn').mockImplementation((retries) => {
    return mockDefaultFn
  })
  fetchMock.mockResponse('200 OK', {
    status: 200
  })
  const result = await fetchClient.exponentialBackoff('https://abc.com/', { method: 'GET' }, { maxRetries: 2 })
  expect(result.status).toBe(200)
  expect(retrySpy).toHaveBeenCalledWith(2)
  expect(mockDefaultFn).toHaveBeenCalledTimes(1)
  retrySpy.mockRestore()
})

test('test exponentialBackoff with no retries on 4xx errors and custom retryOptions', async () => {
  const mockDefaultFn = __testRetryOnHelper(1)
  const retrySpy = jest.spyOn(fetchClient, '__getRetryOn').mockImplementation((retries) => {
    return mockDefaultFn
  })
  fetchMock.mockResponse('404 Not Found', {
    status: 404
  })
  const result = await fetchClient.exponentialBackoff('https://abc1.com/', { method: 'GET' }, { maxRetries: 1 })
  expect(result.status).toBe(404)
  expect(retrySpy).toHaveBeenCalledWith(1)
  expect(mockDefaultFn).toHaveBeenCalledTimes(1)
  retrySpy.mockRestore()
})

test('test exponentialBackoff with 3 retries on 5xx errors and custom retryOptions', async () => {
  const mockDefaultFn = __testRetryOnHelper(2)
  const retrySpy = jest.spyOn(fetchClient, '__getRetryOn').mockImplementation((retries) => {
    return mockDefaultFn
  })
  fetchMock.mockResponse('500 Internal Server Error', {
    status: 500
  })
  const result = await fetchClient.exponentialBackoff('https://abc1.com/', { method: 'GET' }, { maxRetries: 2, initialDelayInMillis: 10 })
  expect(result.status).toBe(500)
  expect(retrySpy).toHaveBeenCalledWith(2)
  expect(mockDefaultFn).toHaveBeenCalledTimes(3)
  retrySpy.mockRestore()
})

test('test exponential backoff with success in first attempt and custom retryOn', async () => {
  const mockDefaultFn = __testRetryOnHelper(2, 399, 500)
  fetchMock.mockResponse('200 OK', {
    status: 200
  })
  const result = await fetchClient.exponentialBackoff('https://abc.com/', { method: 'GET' }, { maxRetries: 2 }, mockDefaultFn)
  expect(result.status).toBe(200)
  expect(mockDefaultFn).toHaveBeenCalledTimes(1)
})

test('test exponentialBackoff with no retries on 4xx errors and custom retryOn', async () => {
  const mockDefaultFn = __testRetryOnHelper(2, 399, 500)
  fetchMock.mockResponse('404 Not Found', {
    status: 404
  })
  const result = await fetchClient.exponentialBackoff('https://abc1.com/', { method: 'GET' }, { maxRetries: 4 }, mockDefaultFn)
  expect(result.status).toBe(404)
  // custom retryOn is initialised with 2 retries
  expect(mockDefaultFn).toHaveBeenCalledTimes(3)
})

test('test exponentialBackoff with 3 retries on 5xx errors and custom retryOn', async () => {
  const mockDefaultFn = __testRetryOnHelper(2, 399, 500)
  const retrySpy = jest.spyOn(fetchClient, '__getRetryOn')
  fetchMock.mockResponse('500 Internal Server Error', {
    status: 500
  })
  const result = await fetchClient.exponentialBackoff('https://abc1.com/', { method: 'GET' }, { initialDelayInMillis: 10 }, mockDefaultFn)
  expect(result.status).toBe(500)
  // default retryOn is initialised with 3 retries
  expect(retrySpy).toHaveBeenCalledWith(3)
  // custom retryOn does not retry if status code >=500
  expect(mockDefaultFn).toHaveBeenCalledTimes(1)
  retrySpy.mockRestore()
})

test('test exponentialBackoff with default 3 retries on 5xx errors and custom retryOn as array', async () => {
  const mockDefaultFn = [429, 500, 503]
  fetchMock.mockResponse('429 Too Many Requests', {
    status: 429
  })
  const result = await fetchClient.exponentialBackoff('https://abc1.com/', { method: 'GET' }, { initialDelayInMillis: 10 }, mockDefaultFn)
  expect(result.status).toBe(429)
})

test('test exponentialBackoff with 3 retries on 5xx errors and custom retryDelay', async () => {
  const mockDefaultFn1 = __testRetryDelayHelper(100)
  fetchMock.mockResponse('503 Service Unavailable', {
    status: 503
  })
  const result = await fetchClient.exponentialBackoff('https://abc2.com/', { method: 'GET' }, { maxRetries: 2 }, undefined, mockDefaultFn1)
  expect(result.status).toBe(503)
  expect(mockDefaultFn1).toHaveBeenCalledTimes(2)
})

test('test exponentialBackoff with no retries on 4xx errors and custom retryDelay', async () => {
  const mockDefaultFn = __testRetryDelayHelper(100)
  fetchMock.mockResponse('404 Not Found', {
    status: 404
  })
  const result = await fetchClient.exponentialBackoff('https://abc1.com/', { method: 'GET' }, { maxRetries: 4, initialDelayInMillis: 1 }, undefined, mockDefaultFn)
  expect(result.status).toBe(404)
  expect(mockDefaultFn).toHaveBeenCalledTimes(0)
})
