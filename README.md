<!--
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
-->

[![Version](https://img.shields.io/npm/v/@adobe/aio-lib-core-networking.svg)](https://npmjs.org/package/@adobe/aio-lib-core-networking)
[![Downloads/week](https://img.shields.io/npm/dw/@adobe/aio-lib-core-networking.svg)](https://npmjs.org/package/@adobe/aio-lib-core-networking)
[![Build Status](https://travis-ci.com/adobe/aio-lib-core-networking.svg?branch=master)](https://travis-ci.com/adobe/aio-lib-core-networking)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) 
[![Greenkeeper badge](https://badges.greenkeeper.io/adobe/aio-lib-core-networking.svg)](https://greenkeeper.io/)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/adobe/aio-lib-core-networking/master.svg?style=flat-square)](https://codecov.io/gh/adobe/aio-lib-core-networking/)

# Adobe I/O Core Networking Lib

### Installing

```bash
$ npm install @adobe/aio-lib-core-networking
```

### Usage
1) Initialize the SDK

```javascript
const fetchRetry = require('@adobe/aio-lib-core-networking')

```

2) Call methods using the initialized SDK

```javascript

const fetchRetry = require('@adobe/aio-lib-core-networking')
async function sdkTest() {

  return new Promise((resolve, reject) => {
    fetchRetry.exponentialBackoff(url, requestOptions, retryOptions, retryOn, retryDelay)
    .then((response) => {
      if (!response.ok) {
        throw Error(reduceError(response))
      }
      resolve(response.json())
    })
    .catch(err => {
      reject(
        new codes.ERROR_GET_SOMETHING({ sdkDetails, messageValues: err }))
    })
  }) 
}

```

<a name="module_@adobe/aio-lib-core-networking"></a>

## @adobe/aio-lib-core-networking

* [@adobe/aio-lib-core-networking](#module_@adobe/aio-lib-core-networking)
    * [~HttpExponentialBackoff](#module_@adobe/aio-lib-core-networking..HttpExponentialBackoff)
        * [.exponentialBackoff(url, requestOptions, retryOptions, retryOn, retryDelay)](#module_@adobe/aio-lib-core-networking..HttpExponentialBackoff+exponentialBackoff) ⇒ <code>Promise.&lt;Response&gt;</code>

<a name="module_@adobe/aio-lib-core-networking..HttpExponentialBackoff"></a>

### Working of HttpExponentialBackoff

![image not available](docs/sequenceDiagram.jpeg?s=50)

### @adobe/aio-lib-core-networking~HttpExponentialBackoff
This class provides methods to implement fetch with retries.
The retries use exponential backoff strategy
with defaults set to max of 3 retries and initial Delay as 100ms

**Kind**: inner class of [<code>@adobe/aio-lib-core-networking</code>](#module_@adobe/aio-lib-core-networking)  
<a name="module_@adobe/aio-lib-core-networking..HttpExponentialBackoff+exponentialBackoff"></a>

#### httpExponentialBackoff.exponentialBackoff(url, requestOptions, retryOptions, retryOn, retryDelay) ⇒ <code>Promise.&lt;Response&gt;</code>
This function will retry connecting to a url end-point, with
exponential backoff. Returns a Promise.

**Kind**: instance method of [<code>HttpExponentialBackoff</code>](#module_@adobe/aio-lib-core-networking..HttpExponentialBackoff)  
**Returns**: <code>Promise.&lt;Response&gt;</code> - Promise object representing the http response  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | endpoint url |
| requestOptions | <code>object</code> | request options which includes the HTTP method, headers, timeout, etc. |
| retryOptions | <code>object</code> | retry options with options being maxRetries and initialDelayInMillis |
| retryOn | <code>function</code> \| <code>Array</code> | Optional Function or Array. If provided, will be used instead of the default |
| retryDelay | <code>function</code> \| <code>number</code> | Optional Function or number. If provided, will be used instead of the default |

### Debug Logs

```bash
LOG_LEVEL=debug <your_call_here>
```

Prepend the `LOG_LEVEL` environment variable and `debug` value to the call that invokes your function, on the command line. This should output a lot of debug data for your SDK calls.

### Contributing

Contributions are welcome! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

### Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
