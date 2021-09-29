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

{{>main-index~}}
{{>all-docs~}}

### Debug Logs

```bash
LOG_LEVEL=debug <your_call_here>
```

Prepend the `LOG_LEVEL` environment variable and `debug` value to the call that invokes your function, on the command line. This should output a lot of debug data for your SDK calls.

### Contributing

Contributions are welcome! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

### Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
