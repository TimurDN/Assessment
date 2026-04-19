import { test as base } from '@playwright/test';
import { apiRequest as apiRequestOriginal } from './plain-function';
import type {
    ApiRequestFn,
    ApiRequestMethods,
    ApiRequestParams,
    ApiRequestResponse,
} from './api-types';
import { bookingConfig } from '../../config/booking';

/**
 * Playwright fixture exposing a typed `apiRequest<T>` helper.
 *
 * - Defaults `baseUrl` to {@link bookingConfig.apiUrl} when not supplied.
 * - Returns a narrowed `{ status, body: T }` — callers are expected to pass
 *   a matching Zod schema to `parse()` the body.
 *
 * Usage in a test:
 *
 * ```ts
 * const { status, body } = await apiRequest<PostcodeLookupResponse>({
 *     method: 'POST',
 *     url: bookingConfig.paths.POSTCODE_LOOKUP,
 *     body: { postcode: 'SW1A 1AA' },
 * });
 * expect(status).toBe(200);
 * expect(PostcodeLookupResponseSchema.parse(body)).toBeTruthy();
 * ```
 */
export const test = base.extend<ApiRequestMethods>({
    apiRequest: async ({ request }, use) => {
        const apiRequestFn: ApiRequestFn = async <T = unknown>({
            method,
            url,
            baseUrl,
            body = null,
            rawBody,
            query,
            headers,
        }: ApiRequestParams): Promise<ApiRequestResponse<T>> => {
            const response = await apiRequestOriginal({
                request,
                method,
                url,
                baseUrl: baseUrl ?? bookingConfig.apiUrl,
                body,
                rawBody,
                query,
                headers,
            });

            return {
                status: response.status,
                body: response.body as T,
            };
        };

        await use(apiRequestFn);
    },
});
