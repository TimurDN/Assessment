import { expect, test } from '../../fixtures/pom/test-options';
import { bookingConfig } from '../../config/booking';
import {
    SkipsResponseSchema,
    type SkipsResponse,
} from '../../fixtures/api/schemas/booking/skips';
import {
    APIErrorSchema,
    type APIError,
} from '../../fixtures/api/schemas/util/common';
import { unsupportedMethods } from '../../fixtures/api/invalid-types';
import { getSkips } from '../../helpers/booking/booking';
import bookingData from '../../test-data/booking/booking.json';

const ENDPOINT = bookingConfig.api.SKIPS;

// ═══════════════════════════════════════════════════════════════
// GET /api/skips - Catalogue (no flags)
// ═══════════════════════════════════════════════════════════════

test.describe('GET /api/skips - Catalogue (no flags)', () => {
    test(
        'Verify GET /api/skips returns all 8 skips with canonical sizes, correct prices, and 10/12-yard disabled',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const { status, body } = await getSkips<SkipsResponse>(apiRequest, {
                postcode: bookingData.postcodes.HAPPY,
            });

            expect(status).toBe(200);
            expect(SkipsResponseSchema.parse(body)).toBeTruthy();

            await test.step('Catalogue has exactly 8 skips in canonical order', async () => {
                expect(body.skips).toHaveLength(bookingData.skipCatalogueSize);
                expect(body.skips.map((s) => s.size)).toEqual(
                    bookingData.canonicalSkipSizes,
                );
            });

            await test.step('Prices match the documented price list', async () => {
                for (const skip of body.skips) {
                    expect(
                        skip.price,
                        `Price for ${skip.size} must match catalogue`,
                    ).toBe(
                        bookingData.skipPricesGBP[
                            skip.size as keyof typeof bookingData.skipPricesGBP
                        ],
                    );
                }
            });

            await test.step('10- and 12-yard are disabled with the "Not available in your area" reason', async () => {
                for (const size of bookingData.defaultDisabledSkips) {
                    const skip = body.skips.find((s) => s.size === size);
                    expect(skip?.disabled).toBe(true);
                    expect(skip?.disabledReason).toBe(
                        bookingData.disabledReasons.NOT_IN_AREA,
                    );
                }
            });

            await test.step('Every other skip is enabled and carries no disabledReason', async () => {
                const enabled = body.skips.filter(
                    (s) => !bookingData.defaultDisabledSkips.includes(s.size),
                );
                for (const skip of enabled) {
                    expect(skip.disabled).toBe(false);
                    expect(skip.disabledReason).toBeUndefined();
                }
            });
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// GET /api/skips - Business rules
// ═══════════════════════════════════════════════════════════════

test.describe('GET /api/skips - Business rules', () => {
    test(
        'Verify GET /api/skips with heavyWaste=true additionally disables the 2- and 3-yard skips',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const { status, body } = await getSkips<SkipsResponse>(apiRequest, {
                postcode: bookingData.postcodes.HAPPY,
                heavyWaste: true,
            });

            expect(status).toBe(200);
            expect(SkipsResponseSchema.parse(body)).toBeTruthy();

            for (const size of bookingData.heavyDisabledSkips) {
                const skip = body.skips.find((s) => s.size === size);
                expect(skip?.disabled).toBe(true);
                expect(skip?.disabledReason).toBe(
                    bookingData.disabledReasons.HEAVY_WASTE,
                );
            }

            const disabledSizes = body.skips
                .filter((s) => s.disabled)
                .map((s) => s.size)
                .sort();
            expect(disabledSizes).toEqual(
                [
                    ...bookingData.heavyDisabledSkips,
                    ...bookingData.defaultDisabledSkips,
                ].sort(),
            );
        },
    );

    test(
        'Verify GET /api/skips with plasterboard=true disables the 2-yard with the segregation reason',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const { status, body } = await getSkips<SkipsResponse>(apiRequest, {
                postcode: bookingData.postcodes.HAPPY,
                plasterboard: true,
            });

            expect(status).toBe(200);
            expect(SkipsResponseSchema.parse(body)).toBeTruthy();

            const twoYard = body.skips.find((s) => s.size === '2-yard');
            expect(twoYard?.disabled).toBe(true);
            expect(twoYard?.disabledReason).toBe(
                bookingData.disabledReasons.PLASTERBOARD_TOO_SMALL,
            );
        },
    );

    test(
        'Verify GET /api/skips gives heavyWaste reason precedence over plasterboard on the 2-yard',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const { status, body } = await getSkips<SkipsResponse>(apiRequest, {
                postcode: bookingData.postcodes.HAPPY,
                heavyWaste: true,
                plasterboard: true,
            });

            expect(status).toBe(200);
            expect(SkipsResponseSchema.parse(body)).toBeTruthy();

            const twoYard = body.skips.find((s) => s.size === '2-yard');
            expect(twoYard?.disabled).toBe(true);
            expect(twoYard?.disabledReason).toBe(
                bookingData.disabledReasons.HEAVY_WASTE,
            );
        },
    );

    test(
        'Verify GET /api/skips treats heavyWaste=1 as truthy (boolean coercion)',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const { status, body } = await getSkips<SkipsResponse>(apiRequest, {
                postcode: bookingData.postcodes.HAPPY,
                heavyWaste: 1,
            });

            expect(status).toBe(200);
            expect(SkipsResponseSchema.parse(body)).toBeTruthy();
            const twoYard = body.skips.find((s) => s.size === '2-yard');
            expect(twoYard?.disabled).toBe(true);
            expect(twoYard?.disabledReason).toBe(
                bookingData.disabledReasons.HEAVY_WASTE,
            );
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// GET /api/skips - Validation
// ═══════════════════════════════════════════════════════════════

test.describe('GET /api/skips - Validation', () => {
    test(
        'Verify GET /api/skips returns 400 MISSING_POSTCODE when postcode is omitted',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const { status, body } = await getSkips<APIError>(apiRequest, {});
            expect(status).toBe(400);
            expect(APIErrorSchema.parse(body)).toBeTruthy();
            expect(body.error).toBe('MISSING_POSTCODE');
        },
    );

    test(
        'Verify GET /api/skips returns 422 INVALID_POSTCODE for a malformed postcode',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const { status, body } = await getSkips<APIError>(apiRequest, {
                postcode: 'NOTAPOSTCODE',
            });
            expect(status).toBe(422);
            expect(APIErrorSchema.parse(body)).toBeTruthy();
            expect(body.error).toBe('INVALID_POSTCODE');
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// GET /api/skips - Method allow-list
// ═══════════════════════════════════════════════════════════════

test.describe('GET /api/skips - Method allow-list', () => {
    test(
        'Verify GET /api/skips rejects POST/PUT/PATCH/DELETE with 405',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            for (const method of [...unsupportedMethods, 'POST'] as const) {
                await test.step(`${method} ${ENDPOINT} → 405`, async () => {
                    const { status } = await apiRequest({
                        method: method as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
                        url: ENDPOINT,
                        baseUrl: bookingConfig.apiUrl,
                        query: { postcode: bookingData.postcodes.HAPPY },
                    });
                    expect(status).toBe(405);
                });
            }
        },
    );
});
