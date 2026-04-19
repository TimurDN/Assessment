import type { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Low-level API request helper. Wraps Playwright's `APIRequestContext` with:
 *   - JSON body + header defaults
 *   - `'form-urlencoded'` shortcut for form bodies
 *   - Bearer-token shortcut (pass the token string as `headers`)
 *   - Query-string serialization
 *   - Safe body parsing (JSON, text, problem+json; empty body → `null`)
 *
 * Kept framework-agnostic so it can be used directly from `beforeAll`
 * hooks or helper scripts without a Playwright fixture.
 *
 * @returns `{ status, body }` with `body` typed as `unknown` — the caller is
 *          expected to narrow it via a Zod schema.
 */
export async function apiRequest({
    request,
    method,
    url,
    baseUrl,
    body = null,
    rawBody,
    query,
    headers,
}: {
    request: APIRequestContext;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    baseUrl?: string;
    body?: Record<string, unknown> | null;
    rawBody?: Buffer;
    query?: Record<string, string | number | boolean | null | undefined>;
    headers?: string;
}): Promise<{ status: number; body: unknown }> {
    const options: {
        data?: Record<string, unknown> | Buffer | null;
        form?: Record<string, string>;
        headers?: Record<string, string>;
        params?: Record<string, string | number | boolean>;
    } = {};

    if (headers === 'form-urlencoded') {
        if (body) options.form = body as Record<string, string>;
        options.headers = {};
    } else if (headers) {
        if (body) options.data = body;
        options.headers = {
            Authorization: `Bearer ${headers}`,
            'Content-Type': 'application/json',
        };
    } else {
        if (body) options.data = body;
        options.headers = { 'Content-Type': 'application/json' };
    }

    // `rawBody` wins over `body` — it exists precisely for the case where
    // the caller needs byte-exact control (e.g. unparseable JSON).
    if (rawBody) {
        options.data = rawBody;
    }

    if (query) {
        const params: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(query)) {
            if (value === undefined || value === null) continue;
            params[key] = value;
        }
        if (Object.keys(params).length > 0) options.params = params;
    }

    const fullUrl = baseUrl ? `${baseUrl}${url}` : url;

    let response: APIResponse;
    switch (method.toUpperCase()) {
        case 'GET':
            response = await request.get(fullUrl, options);
            break;
        case 'POST':
            response = await request.post(fullUrl, options);
            break;
        case 'PUT':
            response = await request.put(fullUrl, options);
            break;
        case 'PATCH':
            response = await request.patch(fullUrl, options);
            break;
        case 'DELETE':
            response = await request.delete(fullUrl, options);
            break;
        default:
            throw new Error(`Unsupported HTTP method: ${method}`);
    }

    const status = response.status();
    const contentType = response.headers()['content-type'] ?? '';

    let parsed: unknown = null;
    try {
        if (
            contentType.includes('application/json') ||
            contentType.includes('application/problem+json')
        ) {
            parsed = await response.json();
        } else if (contentType.includes('text/')) {
            parsed = await response.text();
        }
    } catch {
        parsed = null;
    }

    return { status, body: parsed };
}
