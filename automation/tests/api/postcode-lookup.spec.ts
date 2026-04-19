import { expect, test } from '../../fixtures/pom/test-options';
import { bookingConfig } from '../../config/booking';
import {
    PostcodeLookupResponseSchema,
    type PostcodeLookupResponse,
} from '../../fixtures/api/schemas/booking/postcode';
import {
    APIErrorSchema,
    type APIError,
} from '../../fixtures/api/schemas/util/common';
import {
    invalidString,
    malformedPostcodes,
    unsupportedMethods,
} from '../../fixtures/api/invalid-types';
import { lookupPostcode } from '../../helpers/booking/booking';
import { resetRetryCounter } from '../../helpers/booking/test-reset';
import bookingData from '../../test-data/booking/booking.json';
import postcodeValidation from '../../test-data/booking/postcodeValidation.json';

const ENDPOINT = bookingConfig.api.POSTCODE_LOOKUP;

// ═══════════════════════════════════════════════════════════════
// POST /api/postcode/lookup - Happy path
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/postcode/lookup - Happy path', () => {
    test(
        'Verify POST /api/postcode/lookup returns 200 with the full SW1A 1AA address book',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const { status, body } = await lookupPostcode<PostcodeLookupResponse>(
                apiRequest,
                bookingData.postcodes.HAPPY,
            );

            expect(status).toBe(200);
            expect(PostcodeLookupResponseSchema.parse(body)).toBeTruthy();
            expect(body.postcode).toBe('SW1A 1AA');
            expect(body.addresses).toHaveLength(bookingData.addressCounts.SW1A);
            expect(body.addresses[0]).toEqual(bookingData.firstAddress.SW1A);
            expect(body.addresses.at(-1)).toEqual(bookingData.lastAddress.SW1A);
        },
    );

    test(
        'Verify POST /api/postcode/lookup returns 200 with an empty address list for EC1A 1BB',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const { status, body } = await lookupPostcode<PostcodeLookupResponse>(
                apiRequest,
                bookingData.postcodes.EMPTY,
            );

            expect(status).toBe(200);
            expect(PostcodeLookupResponseSchema.parse(body)).toBeTruthy();
            expect(body.postcode).toBe('EC1A 1BB');
            expect(body.addresses).toEqual([]);
        },
    );

    test(
        'Verify POST /api/postcode/lookup honours the M1 1AE fixture latency and returns Manchester addresses',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const startedAt = Date.now();
            const { status, body } = await lookupPostcode<PostcodeLookupResponse>(
                apiRequest,
                bookingData.postcodes.SLOW,
            );
            const elapsedMs = Date.now() - startedAt;

            expect(status).toBe(200);
            expect(PostcodeLookupResponseSchema.parse(body)).toBeTruthy();
            expect(elapsedMs).toBeGreaterThanOrEqual(1000);
            expect(body.addresses).toHaveLength(bookingData.addressCounts.M1);
            for (const address of body.addresses) {
                expect(address.city).toBe('Manchester');
            }
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// POST /api/postcode/lookup - Normalization
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/postcode/lookup - Normalization', () => {
    test(
        'Verify POST /api/postcode/lookup normalizes lowercase, no-space, and extra-space variants',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            for (const variant of postcodeValidation.normalizationVariants) {
                const { status, body } = await lookupPostcode<PostcodeLookupResponse>(
                    apiRequest,
                    variant,
                );
                expect(status, `Variant "${variant}" should return 200`).toBe(200);
                expect(PostcodeLookupResponseSchema.parse(body)).toBeTruthy();
                expect(body.postcode).toBe('SW1A 1AA');
                expect(body.addresses).toHaveLength(
                    bookingData.addressCounts.SW1A,
                );
            }
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// POST /api/postcode/lookup - Validation
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/postcode/lookup - Validation', () => {
    test(
        'Verify POST /api/postcode/lookup returns 400 MISSING_POSTCODE for empty, whitespace, or non-string inputs',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            for (const value of invalidString) {
                const { status, body } = await lookupPostcode<APIError>(
                    apiRequest,
                    value,
                );
                expect(
                    status,
                    `Input ${JSON.stringify(value)} should be 400`,
                ).toBe(400);
                expect(APIErrorSchema.parse(body)).toBeTruthy();
                expect(body.error).toBe('MISSING_POSTCODE');
            }
        },
    );

    test(
        'Verify POST /api/postcode/lookup returns 422 INVALID_POSTCODE for strings that fail the UK regex',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            for (const postcode of malformedPostcodes) {
                const { status, body } = await lookupPostcode<APIError>(
                    apiRequest,
                    postcode,
                );
                expect(status, `"${postcode}" should return 422`).toBe(422);
                expect(APIErrorSchema.parse(body)).toBeTruthy();
                expect(body.error).toBe('INVALID_POSTCODE');
            }
        },
    );

    test(
        'Verify POST /api/postcode/lookup returns 400 INVALID_JSON for a body that is not parseable JSON',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<APIError>({
                method: 'POST',
                url: ENDPOINT,
                baseUrl: bookingConfig.apiUrl,
                rawBody: Buffer.from('{not-json'),
            });

            expect(status).toBe(400);
            expect(APIErrorSchema.parse(body)).toBeTruthy();
            expect(body.error).toBe('INVALID_JSON');
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// POST /api/postcode/lookup - Retry fixture (BS1 4DJ)
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/postcode/lookup - Retry fixture', () => {
    test.beforeEach(async ({ apiRequest }) => {
        await resetRetryCounter(apiRequest, bookingData.postcodes.RETRY);
    });

    test(
        'Verify BS1 4DJ returns 500 UPSTREAM_ERROR on first call and 200 on retry',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            await test.step('First call fails with 500 UPSTREAM_ERROR', async () => {
                const { status, body } = await lookupPostcode<APIError>(
                    apiRequest,
                    bookingData.postcodes.RETRY,
                );
                expect(status).toBe(500);
                expect(APIErrorSchema.parse(body)).toBeTruthy();
                expect(body.error).toBe('UPSTREAM_ERROR');
                expect(body.message).toMatch(/retry/i);
            });

            await test.step('Retry succeeds with 200 and Bristol addresses', async () => {
                const { status, body } = await lookupPostcode<PostcodeLookupResponse>(
                    apiRequest,
                    bookingData.postcodes.RETRY,
                );
                expect(status).toBe(200);
                expect(PostcodeLookupResponseSchema.parse(body)).toBeTruthy();
                expect(body.postcode).toBe('BS1 4DJ');
                expect(body.addresses).toHaveLength(
                    bookingData.addressCounts.BS1,
                );
                expect(body.addresses[0].city).toBe('Bristol');
            });
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// POST /api/postcode/lookup - Method allow-list
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/postcode/lookup - Method allow-list', () => {
    test(
        'Verify POST /api/postcode/lookup rejects GET/PUT/PATCH/DELETE with 405',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            for (const method of [...unsupportedMethods, 'GET'] as const) {
                await test.step(`${method} ${ENDPOINT} → 405`, async () => {
                    const { status } = await apiRequest({
                        method: method as 'GET' | 'PUT' | 'PATCH' | 'DELETE',
                        url: ENDPOINT,
                        baseUrl: bookingConfig.apiUrl,
                    });
                    expect(status).toBe(405);
                });
            }
        },
    );
});
