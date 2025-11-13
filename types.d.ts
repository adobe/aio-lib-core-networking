/**
 * Fetch Retry Options
 * @property maxRetries - the maximum number of retries to try (default:3)
 * @property initialDelayInMillis - the initial delay in milliseconds (default:100ms)
 * @property proxy - the (optional) proxy auth options
 */
declare type RetryOptions = {
    maxRetries: number;
    initialDelayInMillis: number;
    proxy: ProxyOptions;
};

/**
 * Creates an instance of HttpExponentialBackoff
 * @param [options] - configuration options
 * @param [options.logLevel] - the log level to use (default: process.env.LOG_LEVEL or 'info')
 */
declare class HttpExponentialBackoff {
    constructor(options?: {
        logLevel?: string;
    });
    /**
     * This function will retry connecting to a url end-point, with
     * exponential backoff. Returns a Promise.
     * @param url - endpoint url
     * @param requestOptions - request options
     * @param [retryOptions] - (optional) retry options
     * @param [retryOn] - (optional) Function or Array. If provided, will be used instead of the default
     * @param [retryDelay] - (optional) Function or number. If provided, will be used instead of the default
     * @returns Promise object representing the http response
     */
    exponentialBackoff(url: string, requestOptions: any | Request, retryOptions?: RetryOptions, retryOn?: ((...params: any[]) => any) | any[], retryDelay?: ((...params: any[]) => any) | number): Promise<Response>;
}

/**
 * Proxy Auth Options
 * @property proxyUrl - the proxy's url
 * @property [username] - the username for basic auth
 * @property [password] - the password for basic auth
 * @property rejectUnauthorized - set to false to not reject unauthorized server certs
 * @property [logLevel] - the log level to use (default: process.env.LOG_LEVEL or 'info')
 */
declare type ProxyOptions = {
    proxyUrl: string;
    username?: string;
    password?: string;
    rejectUnauthorized: boolean;
    logLevel?: string;
};

/**
 * Initialize this class with Proxy auth options
 * @param proxyOptions - the auth options to connect with
 */
declare class ProxyFetch {
    constructor(proxyOptions: ProxyOptions);
    /**
     * Fetch function, using the configured NTLM Auth options.
     * @param resource - the url or Request object to fetch from
     * @param options - the fetch options
     * @returns Promise object representing the http response
     */
    fetch(resource: string | Request, options: any): Promise<Response>;
}

/**
 * Return the appropriate Fetch function depending on proxy settings.
 * @param [proxyOptions] - the proxy options
 * @returns the Fetch API function
 */
declare function createFetch(proxyOptions?: ProxyOptions): (...params: any[]) => any;

/**
 * Parse the Retry-After header
 * Spec: {@link https://tools.ietf.org/html/rfc7231#section-7.1.3}
 * @param header - Retry-After header value
 * @returns Number of milliseconds to sleep until the next call to getEventsFromJournal
 */
declare function parseRetryAfterHeader(header: string): number;

