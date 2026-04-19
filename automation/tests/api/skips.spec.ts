/**
 * API contract & behaviour tests for `GET /api/skips`.
 *
 * The skip catalogue is 8 items (assessment requirement: "At least 8 skip
 * options with mixed enabled/disabled states"). These specs verify both the
 * static catalogue (sizes, prices, default-disabled 10/12-yard) and the
 * dynamic rules (heavyWaste disables the two smallest; plasterboard disables
 * the 2-yard as too small for segregation).
 */
import { expect, test } from '../../fixtures/pom/test-options';
import { bookingConfig } from '../../config/booking';
import {
    SkipsResponseSchema,
    type SkipsResponse,
    type SkipSize,
} from '../../fixtures/api/schemas/booking/skips';
import {
    ApiErrorSchema,
    type ApiError,
} from '../../fixtures/api/schemas/util/common';
import { getSkips } from '../../helpers/booking/booking';
import {
    DEFAULT_DISABLED_SKIPS,
    DISABLED_REASONS,
    HEAVY_DISABLED_SKIPS,
    POSTCODES,
    SKIP_CATALOGUE_SIZE,
    SKIP_PRICES_GBP,
} from '../../test-data/booking/booking';
import { unsupportedMethods } from '../../fixtures/api/invalid-types';

const ENDPOINT = bookingConfig.paths.SKIPS;

const CANONICAL_SIZES: readonly SkipSize[] = [
    '2-yard', '3-yard', '4-yard', '5-yard',
    '6-yard', '8-yard', '10-yard', '12-yard',
];

test.describe('GET /api/skips', () => {
    test.describe('Catalogue (no flags)', () => {
        test(
            'Returns all 8 skips with the canonical sizes, correct prices, and 10/12-yard disabled',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const { status, body } = await getSkips<SkipsResponse>(apiRequest, {
                    postcode: POSTCODES.HAPPY,
                });

                expect(status).toBe(200);
                const { skips } = SkipsResponseSchema.parse(body);

                await test.step('Catalogue has exactly 8 skips in canonical order', async () => {
                    expect(skips).toHaveLength(SKIP_CATALOGUE_SIZE);
                    expect(skips.map((s) => s.size)).toEqual(CANONICAL_SIZES);
                });

                await test.step('Prices match the documented price list', async () => {
                    for (const skip of skips) {
                        expect(
                            skip.price,
                            `Price for ${skip.size} must match catalogue`,
                        ).toBe(SKIP_PRICES_GBP[skip.size]);
                    }
                });

                await test.step('10- and 12-yard are disabled with "Not available in your area"', async () => {
                    for (const size of DEFAULT_DISABLED_SKIPS) {
                        const skip = skips.find((s) => s.size === size);
                        expect(skip?.disabled).toBe(true);
                        expect(skip?.disabledReason).toBe(DISABLED_REASONS.NOT_IN_AREA);
                    }
                });

                await test.step('All other skips are enabled with no disabledReason', async () => {
                    const enabled = skips.filter(
                        (s) => !DEFAULT_DISABLED_SKIPS.includes(s.size),
                    );
                    for (const skip of enabled) {
                        expect(skip.disabled).toBe(false);
                        expect(skip.disabledReason).toBeUndefined();
                    }
                });
            },
        );
    });

    test.describe('Business rules', () => {
        test(
            'heavyWaste=true disables the 2- and 3-yard on top of the default set',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const { status, body } = await getSkips<SkipsResponse>(apiRequest, {
                    postcode: POSTCODES.HAPPY,
                    heavyWaste: true,
                });

                expect(status).toBe(200);
                const { skips } = SkipsResponseSchema.parse(body);

                for (const size of HEAVY_DISABLED_SKIPS) {
                    const skip = skips.find((s) => s.size === size);
                    expect(skip?.disabled).toBe(true);
                    expect(skip?.disabledReason).toBe(DISABLED_REASONS.HEAVY_WASTE);
                }

                const disabledSizes = skips.filter((s) => s.disabled).map((s) => s.size).sort();
                expect(disabledSizes).toEqual(
                    [...HEAVY_DISABLED_SKIPS, ...DEFAULT_DISABLED_SKIPS].sort(),
                );
            },
        );

        test(
            'plasterboard=true disables the 2-yard with the segregation reason',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const { status, body } = await getSkips<SkipsResponse>(apiRequest, {
                    postcode: POSTCODES.HAPPY,
                    plasterboard: true,
                });

                expect(status).toBe(200);
                const { skips } = SkipsResponseSchema.parse(body);
                const twoYard = skips.find((s) => s.size === '2-yard');
                expect(twoYard?.disabled).toBe(true);
                expect(twoYard?.disabledReason).toBe(DISABLED_REASONS.PLASTERBOARD_TOO_SMALL);
            },
        );

        test(
            'heavyWaste + plasterboard: heavy-waste reason takes precedence on 2-yard',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const { status, body } = await getSkips<SkipsResponse>(apiRequest, {
                    postcode: POSTCODES.HAPPY,
                    heavyWaste: true,
                    plasterboard: true,
                });

                expect(status).toBe(200);
                const { skips } = SkipsResponseSchema.parse(body);
                const twoYard = skips.find((s) => s.size === '2-yard');
                expect(twoYard?.disabled).toBe(true);
                expect(twoYard?.disabledReason).toBe(DISABLED_REASONS.HEAVY_WASTE);
            },
        );

        test(
            'heavyWaste=1 is treated as truthy (boolean coercion)',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const { status, body } = await getSkips<SkipsResponse>(apiRequest, {
                    postcode: POSTCODES.HAPPY,
                    heavyWaste: 1,
                });
                expect(status).toBe(200);
                const { skips } = SkipsResponseSchema.parse(body);
                const twoYard = skips.find((s) => s.size === '2-yard');
                expect(twoYard?.disabled).toBe(true);
                expect(twoYard?.disabledReason).toBe(DISABLED_REASONS.HEAVY_WASTE);
            },
        );
    });

    test.describe('Validation', () => {
        test(
            'Missing postcode returns 400 MISSING_POSTCODE',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const { status, body } = await getSkips<ApiError>(apiRequest, {});
                expect(status).toBe(400);
                expect(ApiErrorSchema.parse(body).error).toBe('MISSING_POSTCODE');
            },
        );

        test(
            'Invalid postcode returns 422 INVALID_POSTCODE',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const { status, body } = await getSkips<ApiError>(apiRequest, {
                    postcode: 'NOTAPOSTCODE',
                });
                expect(status).toBe(422);
                expect(ApiErrorSchema.parse(body).error).toBe('INVALID_POSTCODE');
            },
        );
    });

    test.describe('Method allow-list', () => {
        test(
            'Rejects POST/PUT/PATCH/DELETE with 405',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                for (const method of [...unsupportedMethods, 'POST'] as const) {
                    const { status } = await apiRequest({
                        method: method as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
                        url: ENDPOINT,
                        query: { postcode: POSTCODES.HAPPY },
                    });
                    expect(status, `${method} should be 405`).toBe(405);
                }
            },
        );
    });
});
