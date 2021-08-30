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
     * @param retryOptions - retry options with keys being maxRetries and initialDelay in ms
     * @param [retryOn] - Optional Function or Array. If provided, will be used instead of the default
     * @param [retryDelay] - Optional Function or number. If provided, will be used instead of the default
     * @returns Promise object representing the http response
     */
    exponentialBackoff(url: string, requestOptions: any, retryOptions: any, retryOn?: ((...params: any[]) => any) | any[], retryDelay?: ((...params: any[]) => any) | number): Promise<Response>;
}

/**
 * Auth Options.
 * @property username - the username
 * @property password - the password
 * @property [domain] - (NTLM auth only) the Active Directory domain
 * @property [workstation] - (NTLM auth only) the workstation name
 */
declare type ProxyAuthOptions = {
    username: string;
    password: string;
    domain?: string;
    workstation?: string;
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
 * Gets the proxy options from the config.
 * @returns the proxy options
 */
declare function getProxyOptionsFromConfig(): any;

/**
 * Return the appropriate Fetch function depending on proxy settings.
 * @param [proxyOptions] - the options for the proxy
 * @param proxyOptions.proxyUrl - the url for the proxy
 * @param proxyOptions.username - the username for the proxy
 * @param proxyOptions.password - the password for the proxy
 * @returns the Fetch API function
 */
declare function createFetch(proxyOptions?: {
    proxyUrl: string;
    username: string;
    password: string;
}): (...params: any[]) => any;

declare module "@adobe/aio-lib-core-networking" { }

/**
 * Converts a URL to a suitable object for http request options.
 * @param aUrl - the url to parse
 * @returns an object to pass for http request options
 */
declare function urlToHttpOptions(aUrl: string): any;

