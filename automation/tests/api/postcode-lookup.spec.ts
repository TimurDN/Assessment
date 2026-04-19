/**
 * API contract & behaviour tests for `POST /api/postcode/lookup`.
 *
 * Each `describe` block covers one concern (happy path, normalization,
 * validation, error handling, method allow-list) so failures surface a
 * specific contract violation rather than a generic "postcode lookup broken".
 */
import { expect, test } from '../../fixtures/pom/test-options';
import { bookingConfig } from '../../config/booking';
import {
    PostcodeLookupResponseSchema,
    type PostcodeLookupResponse,
} from '../../fixtures/api/schemas/booking/postcode';
import {
    ApiErrorSchema,
    type ApiError,
} from '../../fixtures/api/schemas/util/common';
import { resetRetryCounter } from '../../helpers/booking/test-reset';
import { lookupPostcode } from '../../helpers/booking/booking';
import { ADDRESS_COUNTS, POSTCODES } from '../../test-data/booking/booking';
import {
    invalidStringValues,
    malformedPostcodes,
    unsupportedMethods,
} from '../../fixtures/api/invalid-types';

const ENDPOINT = bookingConfig.paths.POSTCODE_LOOKUP;

test.describe('POST /api/postcode/lookup', () => {
    test.describe('Happy path', () => {
        test(
            'SW1A 1AA returns the full 13-entry address book with correct shape',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const { status, body } = await lookupPostcode<PostcodeLookupResponse>(
                    apiRequest,
                    POSTCODES.HAPPY,
                );

                expect(status).toBe(200);
                const parsed = PostcodeLookupResponseSchema.parse(body);

                await test.step('Echoes back the normalized postcode', async () => {
                    expect(parsed.postcode).toBe('SW1A 1AA');
                });

                await test.step('Returns the canonical address list', async () => {
                    expect(parsed.addresses).toHaveLength(ADDRESS_COUNTS.SW1A);
                    expect(parsed.addresses[0]).toEqual({
                        id: 'addr_sw1a_01',
                        line1: '10 Downing Street',
                        city: 'London',
                    });
                    expect(parsed.addresses.at(-1)).toEqual({
                        id: 'addr_sw1a_13',
                        line1: 'Birdcage Walk',
                        city: 'London',
                    });
                });

                await test.step('Every address has populated fields', async () => {
                    for (const address of parsed.addresses) {
                        expect(address.id).toMatch(/^addr_sw1a_\d{2}$/);
                        expect(address.line1.length).toBeGreaterThan(0);
                        expect(address.city).toBe('London');
                    }
                });
            },
        );

        test(
            'EC1A 1BB returns 200 with an empty address list (empty-state fixture)',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const { status, body } = await lookupPostcode<PostcodeLookupResponse>(
                    apiRequest,
                    POSTCODES.EMPTY,
                );

                expect(status).toBe(200);
                const parsed = PostcodeLookupResponseSchema.parse(body);
                expect(parsed.postcode).toBe('EC1A 1BB');
                expect(parsed.addresses).toEqual([]);
            },
        );

        test(
            'M1 1AE returns 200 after the fixture latency (~1.2s) with Manchester addresses',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const startedAt = Date.now();
                const { status, body } = await lookupPostcode<PostcodeLookupResponse>(
                    apiRequest,
                    POSTCODES.SLOW,
                );
                const elapsed = Date.now() - startedAt;

                expect(status).toBe(200);
                expect(elapsed, 'Fixture latency must be observable').toBeGreaterThanOrEqual(1000);

                const parsed = PostcodeLookupResponseSchema.parse(body);
                expect(parsed.addresses).toHaveLength(ADDRESS_COUNTS.M1);
                for (const address of parsed.addresses) {
                    expect(address.city).toBe('Manchester');
                }
            },
        );
    });

    test.describe('Normalization', () => {
        test(
            'Accepts lowercase, no-space, and extra-space variants and normalizes to canonical form',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                for (const variant of ['sw1a 1aa', 'SW1A1AA', '  SW1A   1AA  ']) {
                    const { status, body } = await lookupPostcode<PostcodeLookupResponse>(
                        apiRequest,
                        variant,
                    );
                    expect(status, `Variant "${variant}" should succeed`).toBe(200);
                    const parsed = PostcodeLookupResponseSchema.parse(body);
                    expect(parsed.postcode).toBe('SW1A 1AA');
                    expect(parsed.addresses).toHaveLength(ADDRESS_COUNTS.SW1A);
                }
            },
        );
    });

    test.describe('Validation', () => {
        test(
            'Returns 400 MISSING_POSTCODE for empty, whitespace, or non-string inputs',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const invalid: ReadonlyArray<unknown> = ['', '   ', ...invalidStringValues];

                for (const value of invalid) {
                    const { status, body } = await lookupPostcode<ApiError>(apiRequest, value);
                    expect(status, `Input ${JSON.stringify(value)} should be 400`).toBe(400);
                    const parsed = ApiErrorSchema.parse(body);
                    expect(parsed.error).toBe('MISSING_POSTCODE');
                    expect(parsed.message).toMatch(/postcode/i);
                }
            },
        );

        test(
            'Returns 422 INVALID_POSTCODE for strings that fail the UK format regex',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                for (const postcode of malformedPostcodes) {
                    const { status, body } = await lookupPostcode<ApiError>(apiRequest, postcode);
                    expect(status, `"${postcode}" should be 422`).toBe(422);
                    expect(ApiErrorSchema.parse(body).error).toBe('INVALID_POSTCODE');
                }
            },
        );

        test(
            'Returns 400 INVALID_JSON when the request body is not parseable JSON',
            { tag: '@Booking-API' },
            async ({ request }) => {
                // Buffer keeps the raw bytes intact; passing a string would
                // cause Playwright to JSON-encode it into a valid JSON string.
                const response = await request.post(`${bookingConfig.apiUrl}${ENDPOINT}`, {
                    data: Buffer.from('{not-json'),
                    headers: { 'Content-Type': 'application/json' },
                });

                expect(response.status()).toBe(400);
                const parsed = ApiErrorSchema.parse(await response.json());
                expect(parsed.error).toBe('INVALID_JSON');
            },
        );
    });

    test.describe('Retry fixture', () => {
        test.beforeEach(async ({ apiRequest }) => {
            await resetRetryCounter(apiRequest, POSTCODES.RETRY);
        });

        test(
            'BS1 4DJ fails once with 500 UPSTREAM_ERROR then succeeds on retry',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                await test.step('First call returns 500 UPSTREAM_ERROR', async () => {
                    const first = await lookupPostcode<ApiError>(apiRequest, POSTCODES.RETRY);
                    expect(first.status).toBe(500);
                    const parsed = ApiErrorSchema.parse(first.body);
                    expect(parsed.error).toBe('UPSTREAM_ERROR');
                    expect(parsed.message).toMatch(/retry/i);
                });

                await test.step('Retry returns 200 with Bristol addresses', async () => {
                    const second = await lookupPostcode<PostcodeLookupResponse>(
                        apiRequest,
                        POSTCODES.RETRY,
                    );
                    expect(second.status).toBe(200);
                    const parsed = PostcodeLookupResponseSchema.parse(second.body);
                    expect(parsed.postcode).toBe('BS1 4DJ');
                    expect(parsed.addresses).toHaveLength(ADDRESS_COUNTS.BS1);
                    expect(parsed.addresses[0].city).toBe('Bristol');
                });
            },
        );
    });

    test.describe('Method allow-list', () => {
        test(
            'Rejects GET/PUT/PATCH/DELETE with 405 (Next.js default for undeclared methods)',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                for (const method of [...unsupportedMethods, 'GET'] as const) {
                    const { status } = await apiRequest({
                        method: method as 'GET' | 'PUT' | 'PATCH' | 'DELETE',
                        url: ENDPOINT,
                    });
                    expect(status, `${method} should be 405`).toBe(405);
                }
            },
        );
    });
});
