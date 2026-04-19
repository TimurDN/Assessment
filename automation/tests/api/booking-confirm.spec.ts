import { expect, test } from '../../fixtures/pom/test-options';
import { bookingConfig } from '../../config/booking';
import {
    BookingConfirmResponseSchema,
    type BookingConfirmResponse,
} from '../../fixtures/api/schemas/booking/booking';
import {
    APIErrorSchema,
    type APIError,
} from '../../fixtures/api/schemas/util/common';
import { unsupportedMethods } from '../../fixtures/api/invalid-types';
import {
    buildBookingPayload,
    confirmBooking,
    getSkips,
    lookupPostcode,
} from '../../helpers/booking/booking';
import bookingData from '../../test-data/booking/booking.json';
import bookingConfirmValidation from '../../test-data/booking/bookingConfirmValidation.json';

const ENDPOINT = bookingConfig.api.BOOKING_CONFIRM;

// ═══════════════════════════════════════════════════════════════
// POST /api/booking/confirm - Happy path
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/booking/confirm - Happy path', () => {
    test(
        'Verify POST /api/booking/confirm returns 200 with status=success and a BK-##### bookingId',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const payload = buildBookingPayload({
                addressId: bookingData.addressIds.SW1A_DOWNING_11,
                skipSize: '6-yard',
                price: bookingData.skipPricesGBP['6-yard'],
            });

            const { status, body } = await confirmBooking<BookingConfirmResponse>(
                apiRequest,
                payload as unknown as Record<string, unknown>,
            );

            expect(status).toBe(200);
            expect(BookingConfirmResponseSchema.parse(body)).toBeTruthy();
            expect(body.status).toBe('success');
            expect(body.bookingId).toMatch(/^BK-\d{5}$/);
            expect(body.idempotent).toBeUndefined();
        },
    );

    test(
        'Verify POST /api/booking/confirm accepts a manual address (prefix "manual:")',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const payload = buildBookingPayload({
                addressId: bookingConfirmValidation.manualAddressExamples[0],
            });
            const { status, body } = await confirmBooking<BookingConfirmResponse>(
                apiRequest,
                payload as unknown as Record<string, unknown>,
            );
            expect(status).toBe(200);
            expect(BookingConfirmResponseSchema.parse(body)).toBeTruthy();
            expect(body.status).toBe('success');
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// POST /api/booking/confirm - Idempotency window
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/booking/confirm - Idempotency', () => {
    test(
        'Verify POST /api/booking/confirm returns the same bookingId for identical payloads with idempotent=true',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const payload = buildBookingPayload({
                addressId: bookingData.addressIds.SW1A_DOWNING_12,
                skipSize: '5-yard',
                price: bookingData.skipPricesGBP['5-yard'],
            });

            const first = await confirmBooking<BookingConfirmResponse>(
                apiRequest,
                payload as unknown as Record<string, unknown>,
            );
            const second = await confirmBooking<BookingConfirmResponse>(
                apiRequest,
                payload as unknown as Record<string, unknown>,
            );

            expect(first.status).toBe(200);
            expect(second.status).toBe(200);
            expect(BookingConfirmResponseSchema.parse(first.body)).toBeTruthy();
            expect(BookingConfirmResponseSchema.parse(second.body)).toBeTruthy();

            expect(first.body.idempotent).toBeUndefined();
            expect(second.body.idempotent).toBe(true);
            expect(second.body.bookingId).toBe(first.body.bookingId);
        },
    );

    test(
        'Verify POST /api/booking/confirm mints a fresh bookingId when any payload field changes',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const base = buildBookingPayload({
                addressId: bookingConfirmValidation.manualAddressExamples[1],
                skipSize: '4-yard',
                price: bookingData.skipPricesGBP['4-yard'],
            });
            const mutated = {
                ...base,
                skipSize: '6-yard' as const,
                price: bookingData.skipPricesGBP['6-yard'],
            };

            const a = await confirmBooking<BookingConfirmResponse>(
                apiRequest,
                base as unknown as Record<string, unknown>,
            );
            const b = await confirmBooking<BookingConfirmResponse>(
                apiRequest,
                mutated as unknown as Record<string, unknown>,
            );

            expect(BookingConfirmResponseSchema.parse(a.body)).toBeTruthy();
            expect(BookingConfirmResponseSchema.parse(b.body)).toBeTruthy();
            expect(b.body.idempotent).toBeUndefined();
            expect(b.body.bookingId).not.toBe(a.body.bookingId);
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// POST /api/booking/confirm - Business-rule errors
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/booking/confirm - Business rules', () => {
    test(
        'Verify POST /api/booking/confirm returns 409 SKIP_DISABLED when booking a disabled skip',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const payload = buildBookingPayload({
                heavyWaste: true,
                skipSize: '2-yard',
                price: bookingData.skipPricesGBP['2-yard'],
            });
            const { status, body } = await confirmBooking<APIError>(
                apiRequest,
                payload as unknown as Record<string, unknown>,
            );
            expect(status).toBe(409);
            expect(APIErrorSchema.parse(body)).toBeTruthy();
            expect(body.error).toBe('SKIP_DISABLED');
            expect(body.message).toMatch(/2-yard/);
        },
    );

    test(
        'Verify POST /api/booking/confirm returns 409 PRICE_MISMATCH when the submitted price is wrong',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const payload = buildBookingPayload({
                skipSize: '4-yard',
                price: 1,
            });
            const { status, body } = await confirmBooking<APIError>(
                apiRequest,
                payload as unknown as Record<string, unknown>,
            );
            expect(status).toBe(409);
            expect(APIErrorSchema.parse(body)).toBeTruthy();
            expect(body.error).toBe('PRICE_MISMATCH');
            expect(body.message).toContain(
                String(bookingData.skipPricesGBP['4-yard']),
            );
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// POST /api/booking/confirm - Validation errors
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/booking/confirm - Validation', () => {
    test(
        'Verify POST /api/booking/confirm returns 422 ADDRESS_NOT_FOUND for addresses that do not belong to the postcode',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            for (const invalidId of bookingConfirmValidation.invalidAddressIds) {
                const payload = buildBookingPayload({ addressId: invalidId });
                const { status, body } = await confirmBooking<APIError>(
                    apiRequest,
                    payload as unknown as Record<string, unknown>,
                );
                expect(
                    status,
                    `addressId=${invalidId} should be 422`,
                ).toBe(422);
                expect(APIErrorSchema.parse(body)).toBeTruthy();
                expect(body.error).toBe('ADDRESS_NOT_FOUND');
            }
        },
    );

    test(
        'Verify POST /api/booking/confirm returns 422 SKIP_NOT_FOUND for unknown skip sizes',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            for (const size of bookingConfirmValidation.invalidSkipSizes) {
                const payload = { ...buildBookingPayload(), skipSize: size };
                const { status, body } = await confirmBooking<APIError>(
                    apiRequest,
                    payload as unknown as Record<string, unknown>,
                );
                expect(status, `skipSize=${size} should be 422`).toBe(422);
                expect(APIErrorSchema.parse(body)).toBeTruthy();
                expect(body.error).toBe('SKIP_NOT_FOUND');
            }
        },
    );

    test(
        'Verify POST /api/booking/confirm returns 422 INVALID_POSTCODE for a malformed postcode',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const payload = buildBookingPayload({ postcode: 'NOTAPOSTCODE' });
            const { status, body } = await confirmBooking<APIError>(
                apiRequest,
                payload as unknown as Record<string, unknown>,
            );
            expect(status).toBe(422);
            expect(APIErrorSchema.parse(body)).toBeTruthy();
            expect(body.error).toBe('INVALID_POSTCODE');
        },
    );

    test(
        'Verify POST /api/booking/confirm returns the matching 400 error code when a required field is missing or wrong-typed',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            for (const tc of bookingConfirmValidation.missingFieldCases) {
                const payload = buildBookingPayload() as unknown as Record<
                    string,
                    unknown
                >;
                if (tc.action === 'delete') delete payload[tc.field];
                else payload[tc.field] = tc.value;

                const { status, body } = await confirmBooking<APIError>(
                    apiRequest,
                    payload,
                );
                expect(status, `Missing ${tc.field} should be 400`).toBe(400);
                expect(APIErrorSchema.parse(body)).toBeTruthy();
                expect(body.error).toBe(tc.expected);
            }
        },
    );

    test(
        'Verify POST /api/booking/confirm returns 400 INVALID_JSON for a body that is not parseable JSON',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<APIError>({
                method: 'POST',
                url: ENDPOINT,
                baseUrl: bookingConfig.apiUrl,
                rawBody: Buffer.from('not-json'),
            });
            expect(status).toBe(400);
            expect(APIErrorSchema.parse(body)).toBeTruthy();
            expect(body.error).toBe('INVALID_JSON');
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// POST /api/booking/confirm - End-to-end chain
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/booking/confirm - End-to-end chain', () => {
    test(
        'Verify lookup → skips → confirm: values returned by upstream endpoints compose into a valid booking',
        { tag: '@App-API' },
        async ({ apiRequest }) => {
            let addressId = '';
            let skipSize: string = '';
            let price = 0;

            await test.step('GET addresses for SW1A 1AA and pick the first', async () => {
                const { body } = await lookupPostcode<{
                    addresses: { id: string }[];
                }>(apiRequest, bookingData.postcodes.HAPPY);
                addressId = body.addresses[0].id;
                expect(addressId).toMatch(/^addr_/);
            });

            await test.step('GET /skips and pick the first enabled entry', async () => {
                const { body } = await getSkips<{
                    skips: { size: string; price: number; disabled: boolean }[];
                }>(apiRequest, { postcode: bookingData.postcodes.HAPPY });
                const enabled = body.skips.find((s) => !s.disabled);
                expect(enabled).toBeDefined();
                skipSize = enabled!.size;
                price = enabled!.price;
            });

            await test.step('POST /booking/confirm with the composed payload', async () => {
                const { status, body } = await confirmBooking<BookingConfirmResponse>(
                    apiRequest,
                    buildBookingPayload({
                        addressId,
                        skipSize: skipSize as never,
                        price,
                    }) as unknown as Record<string, unknown>,
                );
                expect(status).toBe(200);
                expect(BookingConfirmResponseSchema.parse(body)).toBeTruthy();
                expect(body.status).toBe('success');
            });
        },
    );
});

// ═══════════════════════════════════════════════════════════════
// POST /api/booking/confirm - Method allow-list
// ═══════════════════════════════════════════════════════════════

test.describe('POST /api/booking/confirm - Method allow-list', () => {
    test(
        'Verify POST /api/booking/confirm rejects GET/PUT/PATCH/DELETE with 405',
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
