import { expect, test } from '../../fixtures/pom/test-options';
import { bookingConfig } from '../../config/booking';
import {
    WasteTypesResponseSchema,
    type WasteTypesResponse,
} from '../../fixtures/api/schemas/booking/waste-types';
import {
    APIErrorSchema,
    type APIError,
} from '../../fixtures/api/schemas/util/common';
import {
    invalidBooleanTypes,
    unsupportedMethods,
} from '../../fixtures/api/invalid-types';
import { submitWasteTypes } from '../../helpers/booking/booking';
import wasteTypesValidation from '../../test-data/booking/wasteTypesValidation.json';

const ENDPOINT = bookingConfig.api.WASTE_TYPES;

// ═══════════════════════════════════════════════════════════════
// POST /api/waste-types - Happy path
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/waste-types - Happy path', () => {
    test(
        'Verify POST /api/waste-types returns 200 { ok: true } for every documented combination',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            for (const combo of wasteTypesValidation.validCombinations) {
                const { status, body } = await submitWasteTypes<WasteTypesResponse>(
                    apiRequest,
                    combo as Record<string, unknown>,
                );
                expect(status, `Combo ${JSON.stringify(combo)} should be 200`).toBe(
                    200,
                );
                expect(WasteTypesResponseSchema.parse(body)).toBeTruthy();
                expect(body.ok).toBe(true);
            }
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// POST /api/waste-types - Type validation (400)
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/waste-types - Type validation', () => {
    test(
        'Verify POST /api/waste-types returns 400 INVALID_HEAVY_WASTE for non-boolean heavyWaste values',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            for (const value of invalidBooleanTypes) {
                const { status, body } = await submitWasteTypes<APIError>(
                    apiRequest,
                    {
                        heavyWaste: value,
                        plasterboard: false,
                        plasterboardOption: null,
                    },
                );
                expect(
                    status,
                    `heavyWaste=${JSON.stringify(value)} should be 400`,
                ).toBe(400);
                expect(APIErrorSchema.parse(body)).toBeTruthy();
                expect(body.error).toBe('INVALID_HEAVY_WASTE');
            }
        },
    );

    test(
        'Verify POST /api/waste-types returns 400 INVALID_PLASTERBOARD for non-boolean plasterboard values',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            for (const value of invalidBooleanTypes) {
                const { status, body } = await submitWasteTypes<APIError>(
                    apiRequest,
                    {
                        heavyWaste: false,
                        plasterboard: value,
                        plasterboardOption: null,
                    },
                );
                expect(
                    status,
                    `plasterboard=${JSON.stringify(value)} should be 400`,
                ).toBe(400);
                expect(APIErrorSchema.parse(body)).toBeTruthy();
                expect(body.error).toBe('INVALID_PLASTERBOARD');
            }
        },
    );

    test(
        'Verify POST /api/waste-types returns 400 INVALID_HEAVY_WASTE for an empty body (heavyWaste is the first validator)',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const { status, body } = await submitWasteTypes<APIError>(apiRequest, {});
            expect(status).toBe(400);
            expect(APIErrorSchema.parse(body)).toBeTruthy();
            expect(body.error).toBe('INVALID_HEAVY_WASTE');
        },
    );

    test(
        'Verify POST /api/waste-types returns 400 INVALID_JSON for a body that is not parseable JSON',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<APIError>({
                method: 'POST',
                url: ENDPOINT,
                baseUrl: bookingConfig.apiUrl,
                rawBody: Buffer.from('not json'),
            });
            expect(status).toBe(400);
            expect(APIErrorSchema.parse(body)).toBeTruthy();
            expect(body.error).toBe('INVALID_JSON');
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// POST /api/waste-types - Semantic validation (422)
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/waste-types - Semantic validation', () => {
    test(
        'Verify POST /api/waste-types returns 422 MISSING_PLASTERBOARD_OPTION when plasterboard=true and option is missing or invalid',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            for (const option of [
                ...wasteTypesValidation.invalidPlasterboardOptions,
                undefined,
            ]) {
                const { status, body } = await submitWasteTypes<APIError>(
                    apiRequest,
                    {
                        heavyWaste: false,
                        plasterboard: true,
                        plasterboardOption: option,
                    },
                );
                expect(
                    status,
                    `plasterboardOption=${JSON.stringify(option)} should be 422`,
                ).toBe(422);
                expect(APIErrorSchema.parse(body)).toBeTruthy();
                expect(body.error).toBe('MISSING_PLASTERBOARD_OPTION');
            }
        },
    );

    test(
        'Verify POST /api/waste-types returns 422 UNEXPECTED_PLASTERBOARD_OPTION when plasterboard=false but option is set',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const { status, body } = await submitWasteTypes<APIError>(apiRequest, {
                heavyWaste: false,
                plasterboard: false,
                plasterboardOption: 'bagged',
            });
            expect(status).toBe(422);
            expect(APIErrorSchema.parse(body)).toBeTruthy();
            expect(body.error).toBe('UNEXPECTED_PLASTERBOARD_OPTION');
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// POST /api/waste-types - Method allow-list
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/waste-types - Method allow-list', () => {
    test(
        'Verify POST /api/waste-types rejects GET/PUT/PATCH/DELETE with 405',
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
