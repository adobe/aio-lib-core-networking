/**
 * @module @adobe/aio-lib-core-networking
 */
declare module "@adobe/aio-lib-core-networking" {
    /**
     * This class provides methods to implement fetch with retries.
     * The retries use exponential backoff strategy
     * with defaults set to max of 3 retries and initial Delay as 100ms
     */
    class HttpExponentialBackoff {
        /**
         * This function will retry connecting to a url end-point, with
         * exponential backoff. Returns a Promise.
         *
         * @param {string} url endpoint url
         * @param {object} requestOptions request options
         * @param {object} retryOptions retry options with keys being maxRetries and initialDelay in ms
         * @param {Function|Array} [retryOn] Optional Function or Array. If provided, will be used instead of the default
         * @param {Function|number} [retryDelay] Optional Function or number. If provided, will be used instead of the default
         * @returns {Promise<Response>} Promise object representing the http response
         */
        exponentialBackoff(url: string, requestOptions: any, retryOptions: any, retryOn?: ((...params: any[]) => any) | any[], retryDelay?: ((...params: any[]) => any) | number): Promise<Response>;
    }
}

