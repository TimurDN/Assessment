/**
 * API contract & behaviour tests for `POST /api/waste-types`.
 *
 * This endpoint is a pure validator — no side effects, just accept/reject.
 * The specs therefore focus on the combinatorial contract:
 *   - every valid (heavyWaste, plasterboard, plasterboardOption) triple
 *   - every way a caller can violate the type contract (400s)
 *   - every way a caller can violate the semantic contract (422s)
 */
import { expect, test } from '../../fixtures/pom/test-options';
import { bookingConfig } from '../../config/booking';
import {
    WasteTypesResponseSchema,
    type WasteTypesResponse,
    type PlasterboardOption,
} from '../../fixtures/api/schemas/booking/waste-types';
import {
    ApiErrorSchema,
    type ApiError,
} from '../../fixtures/api/schemas/util/common';
import { submitWasteTypes } from '../../helpers/booking/booking';
import {
    invalidBooleanValues,
    unsupportedMethods,
} from '../../fixtures/api/invalid-types';

const ENDPOINT = bookingConfig.paths.WASTE_TYPES;

const VALID_COMBINATIONS: ReadonlyArray<{
    heavyWaste: boolean;
    plasterboard: boolean;
    plasterboardOption: PlasterboardOption | null;
}> = [
    { heavyWaste: false, plasterboard: false, plasterboardOption: null },
    { heavyWaste: true, plasterboard: false, plasterboardOption: null },
    { heavyWaste: false, plasterboard: true, plasterboardOption: 'bagged' },
    { heavyWaste: true, plasterboard: true, plasterboardOption: 'segregated' },
    { heavyWaste: true, plasterboard: true, plasterboardOption: 'collection' },
];

test.describe('POST /api/waste-types', () => {
    test.describe('Happy path', () => {
        test(
            'Every documented (heavyWaste, plasterboard, option) combination returns { ok: true }',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                for (const combo of VALID_COMBINATIONS) {
                    const { status, body } = await submitWasteTypes<WasteTypesResponse>(
                        apiRequest,
                        combo as unknown as Record<string, unknown>,
                    );
                    expect(status, `Combo ${JSON.stringify(combo)} should be 200`).toBe(200);
                    expect(WasteTypesResponseSchema.parse(body)).toEqual({ ok: true });
                }
            },
        );
    });

    test.describe('Type validation (400)', () => {
        test(
            'Rejects non-boolean heavyWaste values with 400 INVALID_HEAVY_WASTE',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                for (const value of invalidBooleanValues) {
                    const { status, body } = await submitWasteTypes<ApiError>(apiRequest, {
                        heavyWaste: value,
                        plasterboard: false,
                        plasterboardOption: null,
                    });
                    expect(status, `heavyWaste=${JSON.stringify(value)} should be 400`).toBe(400);
                    expect(ApiErrorSchema.parse(body).error).toBe('INVALID_HEAVY_WASTE');
                }
            },
        );

        test(
            'Rejects non-boolean plasterboard values with 400 INVALID_PLASTERBOARD',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                for (const value of invalidBooleanValues) {
                    const { status, body } = await submitWasteTypes<ApiError>(apiRequest, {
                        heavyWaste: false,
                        plasterboard: value,
                        plasterboardOption: null,
                    });
                    expect(status, `plasterboard=${JSON.stringify(value)} should be 400`).toBe(400);
                    expect(ApiErrorSchema.parse(body).error).toBe('INVALID_PLASTERBOARD');
                }
            },
        );

        test(
            'An empty body fails heavyWaste validation first',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const { status, body } = await submitWasteTypes<ApiError>(apiRequest, {});
                expect(status).toBe(400);
                expect(ApiErrorSchema.parse(body).error).toBe('INVALID_HEAVY_WASTE');
            },
        );

        test(
            'Returns 400 INVALID_JSON for a body that is not valid JSON',
            { tag: '@Booking-API' },
            async ({ request }) => {
                // Buffer keeps the raw bytes intact; a string would be
                // silently JSON-encoded by Playwright into valid JSON.
                const response = await request.post(`${bookingConfig.apiUrl}${ENDPOINT}`, {
                    data: Buffer.from('not json'),
                    headers: { 'Content-Type': 'application/json' },
                });
                expect(response.status()).toBe(400);
                expect(ApiErrorSchema.parse(await response.json()).error).toBe('INVALID_JSON');
            },
        );
    });

    test.describe('Semantic validation (422)', () => {
        test(
            'plasterboard=true without a valid option returns 422 MISSING_PLASTERBOARD_OPTION',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                for (const option of [null, undefined, '', 'invalid', 'other']) {
                    const { status, body } = await submitWasteTypes<ApiError>(apiRequest, {
                        heavyWaste: false,
                        plasterboard: true,
                        plasterboardOption: option,
                    });
                    expect(
                        status,
                        `plasterboardOption=${JSON.stringify(option)} should be 422`,
                    ).toBe(422);
                    expect(ApiErrorSchema.parse(body).error).toBe('MISSING_PLASTERBOARD_OPTION');
                }
            },
        );

        test(
            'plasterboard=false with a non-null option returns 422 UNEXPECTED_PLASTERBOARD_OPTION',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const { status, body } = await submitWasteTypes<ApiError>(apiRequest, {
                    heavyWaste: false,
                    plasterboard: false,
                    plasterboardOption: 'bagged',
                });
                expect(status).toBe(422);
                expect(ApiErrorSchema.parse(body).error).toBe('UNEXPECTED_PLASTERBOARD_OPTION');
            },
        );
    });

    test.describe('Method allow-list', () => {
        test(
            'Rejects GET/PUT/PATCH/DELETE with 405',
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
