<!--
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
-->

<!--
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
DO NOT update README.md, it is generated.
Modify 'docs/readme_template.md', then run `npm run generate-docs`.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-->

[![Version](https://img.shields.io/npm/v/@adobe/aio-lib-core-networking.svg)](https://npmjs.org/package/@adobe/aio-lib-core-networking)
[![Downloads/week](https://img.shields.io/npm/dw/@adobe/aio-lib-core-networking.svg)](https://npmjs.org/package/@adobe/aio-lib-core-networking)
[![Node.js CI](https://github.com/adobe/aio-lib-core-networking/actions/workflows/node.js.yml/badge.svg)](https://github.com/adobe/aio-lib-core-networking/actions/workflows/node.js.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) 
[![Codecov Coverage](https://img.shields.io/codecov/c/github/adobe/aio-lib-core-networking/master.svg?style=flat-square)](https://codecov.io/gh/adobe/aio-lib-core-networking/)


# Adobe I/O Core Networking Lib

### Installing

```bash
$ npm install @adobe/aio-lib-core-networking
```

### Usage
1) Initialize the SDK

```javascript
const { HttpExponentialBackoff, createFetch } = require('@adobe/aio-lib-core-networking')
const fetchRetry = new HttpExponentialBackoff()
const proxyFetch = createFetch()
```

2) Call methods using the initialized SDK

```javascript

const { HttpExponentialBackoff, createFetch } = require('@adobe/aio-lib-core-networking')
const fetchRetry = new HttpExponentialBackoff()
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

let proxyFetch 
// this will get the proxy settings from the config, if available (proxy.url, proxy.username, proxy.password)
proxyFetch = createFetch()

// this will use the passed in proxy settings. only proxyUrl is required
proxyFetch = createFetch({ proxyUrl: 'http://my.proxy:8080', username: 'admin', password: 'secret' })

// if the proxy settings are not passed in, and not available in the config, it falls back to a simple fetch
const simpleFetch = createFetch()
```

## Modules

<dl>
<dt><a href="#module_@adobe/aio-lib-core-networking">@adobe/aio-lib-core-networking</a></dt>
<dd></dd>
</dl>

## Classes

<dl>
<dt><a href="#HttpExponentialBackoff">HttpExponentialBackoff</a></dt>
<dd><p>This class provides methods to implement fetch with retries.
The retries use exponential backoff strategy
with defaults set to max of 3 retries and initial Delay as 100ms</p>
</dd>
<dt><a href="#NtlmFetch">NtlmFetch</a></dt>
<dd><p>This provides a wrapper for fetch that facilitates NTLM Auth negotiation and authorization.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#NtlmAuthOptions">NtlmAuthOptions</a> : <code>object</code></dt>
<dd><p>NTLM Auth Options.</p>
</dd>
</dl>

<a name="module_@adobe/aio-lib-core-networking"></a>

## @adobe/aio-lib-core-networking
<a name="HttpExponentialBackoff"></a>

## HttpExponentialBackoff
This class provides methods to implement fetch with retries.
The retries use exponential backoff strategy
with defaults set to max of 3 retries and initial Delay as 100ms

**Kind**: global class  
<a name="HttpExponentialBackoff+exponentialBackoff"></a>

### httpExponentialBackoff.exponentialBackoff(url, requestOptions, retryOptions, [retryOn], [retryDelay]) ⇒ <code>Promise.&lt;Response&gt;</code>
This function will retry connecting to a url end-point, with
exponential backoff. Returns a Promise.

**Kind**: instance method of [<code>HttpExponentialBackoff</code>](#HttpExponentialBackoff)  
**Returns**: <code>Promise.&lt;Response&gt;</code> - Promise object representing the http response  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | endpoint url |
| requestOptions | <code>object</code> | request options |
| retryOptions | <code>object</code> | retry options with keys being maxRetries and initialDelay in ms |
| [retryOn] | <code>function</code> \| <code>Array</code> | Optional Function or Array. If provided, will be used instead of the default |
| [retryDelay] | <code>function</code> \| <code>number</code> | Optional Function or number. If provided, will be used instead of the default |

<a name="NtlmFetch"></a>

## NtlmFetch
This provides a wrapper for fetch that facilitates NTLM Auth negotiation and authorization.

**Kind**: global class  

* [NtlmFetch](#NtlmFetch)
    * [new NtlmFetch(authOptions)](#new_NtlmFetch_new)
    * [.fetch(url, options)](#NtlmFetch+fetch) ⇒ <code>Response</code>

<a name="new_NtlmFetch_new"></a>

### new NtlmFetch(authOptions)
Constructor.


| Param | Type | Description |
| --- | --- | --- |
| authOptions | [<code>NtlmAuthOptions</code>](#NtlmAuthOptions) | the auth options to connect with |

<a name="NtlmFetch+fetch"></a>

### ntlmFetch.fetch(url, options) ⇒ <code>Response</code>
Fetch function, using the configured NTLM Auth options.

**Kind**: instance method of [<code>NtlmFetch</code>](#NtlmFetch)  
**Returns**: <code>Response</code> - a fetch Response object  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | the url to fetch from |
| options | <code>object</code> | the fetch options |

<a name="NtlmAuthOptions"></a>

## NtlmAuthOptions : <code>object</code>
NTLM Auth Options.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| username | <code>string</code> | the Active Directory username |
| password | <code>string</code> | the Active Directory password |
| domain | <code>string</code> | the Active Directory domain |
| [workstation] | <code>string</code> | the workstation name |

### Debug Logs

```bash
LOG_LEVEL=debug <your_call_here>
```

Prepend the `LOG_LEVEL` environment variable and `debug` value to the call that invokes your function, on the command line. This should output a lot of debug data for your SDK calls.

### Contributing

Contributions are welcome! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

### Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
