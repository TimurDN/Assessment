/**
 * Parameters for making an API request through the `apiRequest` fixture.
 * @property method   HTTP method.
 * @property url      Endpoint path (prepended with `baseUrl` if provided).
 * @property baseUrl  Optional base URL; defaults to Playwright's `baseURL`.
 * @property body     JSON request body (ignored for GET/DELETE).
 * @property rawBody  Raw request body bytes — use for negative tests that
 *                    must send unparseable JSON. Bypasses JSON serialization
 *                    so the exact byte sequence reaches the server. Ignored
 *                    if `body` is also set.
 * @property query    Query-string parameters (URL-encoded automatically).
 * @property headers  Shorthand token/form toggle: pass a bearer token string,
 *                    `'form-urlencoded'`, or leave undefined for JSON.
 */
export type ApiRequestParams = {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    baseUrl?: string;
    body?: Record<string, unknown> | null;
    rawBody?: Buffer;
    query?: Record<string, string | number | boolean | null | undefined>;
    headers?: string;
};

/**
 * Response returned by the `apiRequest` fixture.
 * @template T Expected shape of the parsed JSON body.
 */
export type ApiRequestResponse<T = unknown> = {
    status: number;
    body: T;
};

export type ApiRequestFn = <T = unknown>(
    params: ApiRequestParams,
) => Promise<ApiRequestResponse<T>>;

export type ApiRequestMethods = {
    apiRequest: ApiRequestFn;
};
