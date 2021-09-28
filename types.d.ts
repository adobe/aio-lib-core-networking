/**
 * Fetch Retry Options
 * @property maxRetries - the maximum number of retries to try (default:3)
 * @property initialDelayInMillis - the initial delay in milliseconds (default:100ms)
 * @property proxy - the (optional) proxy auth options
 */
declare type RetryOptions = {
    maxRetries: number;
    initialDelayInMillis: number;
    proxy: ProxyAuthOptions;
};

/**
 * This class provides methods to implement fetch with retries.
 * The retries use exponential backoff strategy
 * with defaults set to max of 3 retries and initial Delay as 100ms
 */
declare class HttpExponentialBackoff {
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
 * @property rejectUnauthorized - set to false to not reject unauthorized server certs
 */
declare type ProxyAuthOptions = {
    proxyUrl: string;
    rejectUnauthorized: boolean;
};

/**
 * Initialize this class with Proxy auth options
 * @param authOptions - the auth options to connect with
 */
declare class ProxyFetch {
    constructor(authOptions: ProxyAuthOptions);
    /**
     * Returns the http.Agent used for this proxy
     * @returns a http.Agent for basic auth proxy
     */
    proxyAgent(): http.Agent;
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
 * @param [proxyAuthOptions] - the proxy auth options
 * @returns the Fetch API function
 */
declare function createFetch(proxyAuthOptions?: ProxyAuthOptions): (...params: any[]) => any;

