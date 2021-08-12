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
 * NTLM Auth Options.
 * @property username - the Active Directory username
 * @property password - the Active Directory password
 * @property domain - the Active Directory domain
 * @property [workstation] - the workstation name
 */
declare type NtlmAuthOptions = {
    username: string;
    password: string;
    domain: string;
    workstation?: string;
};

/**
 * Constructor.
 * @param authOptions - the auth options to connect with
 */
declare class NtlmFetch {
    constructor(authOptions: NtlmAuthOptions);
    /**
     * Fetch function, using the configured NTLM Auth options.
     * @param url - the url to fetch from
     * @param options - the fetch options
     * @returns a fetch Response object
     */
    fetch(url: string, options: any): Response;
}

declare module "@adobe/aio-lib-core-networking" { }

