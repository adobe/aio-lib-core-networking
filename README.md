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
// this will get the proxy settings from the the HTTP_PROXY or HTTPS_PROXY environment variables, if set
proxyFetch = createFetch()

// this will use the passed in proxy settings. Embed basic auth in the url, if required
proxyFetch = createFetch({ proxyUrl: 'http://my.proxy:8080' })

// if the proxy settings are not passed in, and not available in the HTTP_PROXY or HTTPS_PROXY environment variables, it falls back to a simple fetch
const simpleFetch = createFetch()
```

## Classes

<dl>
<dt><a href="#HttpExponentialBackoff">HttpExponentialBackoff</a></dt>
<dd><p>This class provides methods to implement fetch with retries.
The retries use exponential backoff strategy
with defaults set to max of 3 retries and initial Delay as 100ms</p>
</dd>
<dt><a href="#ProxyFetch">ProxyFetch</a></dt>
<dd><p>This provides a wrapper for fetch that facilitates proxy auth authorization.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#createFetch">createFetch([proxyAuthOptions])</a> ⇒ <code>function</code></dt>
<dd><p>Return the appropriate Fetch function depending on proxy settings.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#RetryOptions">RetryOptions</a> : <code>object</code></dt>
<dd><p>Fetch Retry Options</p>
</dd>
<dt><a href="#ProxyAuthOptions">ProxyAuthOptions</a> : <code>object</code></dt>
<dd><p>Proxy Auth Options</p>
</dd>
</dl>

<a name="HttpExponentialBackoff"></a>

## HttpExponentialBackoff
This class provides methods to implement fetch with retries.
The retries use exponential backoff strategy
with defaults set to max of 3 retries and initial Delay as 100ms

**Kind**: global class  
<a name="HttpExponentialBackoff+exponentialBackoff"></a>

### httpExponentialBackoff.exponentialBackoff(url, requestOptions, [retryOptions], [retryOn], [retryDelay]) ⇒ <code>Promise.&lt;Response&gt;</code>
This function will retry connecting to a url end-point, with
exponential backoff. Returns a Promise.

**Kind**: instance method of [<code>HttpExponentialBackoff</code>](#HttpExponentialBackoff)  
**Returns**: <code>Promise.&lt;Response&gt;</code> - Promise object representing the http response  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | endpoint url |
| requestOptions | <code>object</code> \| <code>Request</code> | request options |
| [retryOptions] | [<code>RetryOptions</code>](#RetryOptions) | (optional) retry options |
| [retryOn] | <code>function</code> \| <code>Array</code> | (optional) Function or Array. If provided, will be used instead of the default |
| [retryDelay] | <code>function</code> \| <code>number</code> | (optional) Function or number. If provided, will be used instead of the default |

<a name="ProxyFetch"></a>

## ProxyFetch
This provides a wrapper for fetch that facilitates proxy auth authorization.

**Kind**: global class  

* [ProxyFetch](#ProxyFetch)
    * [new ProxyFetch(authOptions)](#new_ProxyFetch_new)
    * [.proxyAgent()](#ProxyFetch+proxyAgent) ⇒ <code>http.Agent</code>
    * [.fetch(resource, options)](#ProxyFetch+fetch) ⇒ <code>Promise.&lt;Response&gt;</code>

<a name="new_ProxyFetch_new"></a>

### new ProxyFetch(authOptions)
Initialize this class with Proxy auth options


| Param | Type | Description |
| --- | --- | --- |
| authOptions | [<code>ProxyAuthOptions</code>](#ProxyAuthOptions) | the auth options to connect with |

<a name="ProxyFetch+proxyAgent"></a>

### proxyFetch.proxyAgent() ⇒ <code>http.Agent</code>
Returns the http.Agent used for this proxy

**Kind**: instance method of [<code>ProxyFetch</code>](#ProxyFetch)  
**Returns**: <code>http.Agent</code> - a http.Agent for basic auth proxy  
<a name="ProxyFetch+fetch"></a>

### proxyFetch.fetch(resource, options) ⇒ <code>Promise.&lt;Response&gt;</code>
Fetch function, using the configured NTLM Auth options.

**Kind**: instance method of [<code>ProxyFetch</code>](#ProxyFetch)  
**Returns**: <code>Promise.&lt;Response&gt;</code> - Promise object representing the http response  

| Param | Type | Description |
| --- | --- | --- |
| resource | <code>string</code> \| <code>Request</code> | the url or Request object to fetch from |
| options | <code>object</code> | the fetch options |

<a name="createFetch"></a>

## createFetch([proxyAuthOptions]) ⇒ <code>function</code>
Return the appropriate Fetch function depending on proxy settings.

**Kind**: global function  
**Returns**: <code>function</code> - the Fetch API function  

| Param | Type | Description |
| --- | --- | --- |
| [proxyAuthOptions] | [<code>ProxyAuthOptions</code>](#ProxyAuthOptions) | the proxy auth options |

<a name="RetryOptions"></a>

## RetryOptions : <code>object</code>
Fetch Retry Options

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| maxRetries | <code>number</code> | the maximum number of retries to try (default:3) |
| initialDelayInMillis | <code>number</code> | the initial delay in milliseconds (default:100ms) |
| proxy | [<code>ProxyAuthOptions</code>](#ProxyAuthOptions) | the (optional) proxy auth options |

<a name="ProxyAuthOptions"></a>

## ProxyAuthOptions : <code>object</code>
Proxy Auth Options

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| proxyUrl | <code>string</code> | the proxy's url |
| rejectUnauthorized | <code>boolean</code> | set to false to not reject unauthorized server certs |

### Debug Logs

```bash
LOG_LEVEL=debug <your_call_here>
```

Prepend the `LOG_LEVEL` environment variable and `debug` value to the call that invokes your function, on the command line. This should output a lot of debug data for your SDK calls.

### Contributing

Contributions are welcome! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

### Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
