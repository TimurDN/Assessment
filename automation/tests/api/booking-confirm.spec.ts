/**
 * API contract & behaviour tests for `POST /api/booking/confirm`.
 *
 * Confirm is the most validation-heavy endpoint: it cross-references the
 * postcode, address, skip catalogue and price before minting a booking ID.
 * The specs here walk every validation gate in order and prove the
 * 30-second idempotency window does the right thing for both repeat and
 * mutated submissions.
 */
import { expect, test } from '../../fixtures/pom/test-options';
import { bookingConfig } from '../../config/booking';
import {
    BookingConfirmResponseSchema,
    type BookingConfirmResponse,
} from '../../fixtures/api/schemas/booking/booking';
import {
    ApiErrorSchema,
    type ApiError,
} from '../../fixtures/api/schemas/util/common';
import {
    buildBookingPayload,
    confirmBooking,
} from '../../helpers/booking/booking';
import {
    ADDRESS_IDS,
    POSTCODES,
    SKIP_PRICES_GBP,
} from '../../test-data/booking/booking';
import { unsupportedMethods } from '../../fixtures/api/invalid-types';

const ENDPOINT = bookingConfig.paths.BOOKING_CONFIRM;

test.describe('POST /api/booking/confirm', () => {
    test.describe('Happy path', () => {
        test(
            'Valid payload returns 200 with status=success and a BK-##### bookingId',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const payload = buildBookingPayload({
                    addressId: ADDRESS_IDS.SW1A_DOWNING_11,
                    skipSize: '6-yard',
                    price: SKIP_PRICES_GBP['6-yard'],
                });

                const { status, body } = await confirmBooking<BookingConfirmResponse>(
                    apiRequest,
                    payload as unknown as Record<string, unknown>,
                );

                expect(status).toBe(200);
                const parsed = BookingConfirmResponseSchema.parse(body);
                expect(parsed.status).toBe('success');
                expect(parsed.bookingId).toMatch(/^BK-\d{5}$/);
                expect(parsed.idempotent).toBeUndefined();
            },
        );

        test(
            'Accepts a manual address (prefix "manual:")',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const payload = buildBookingPayload({
                    addressId: 'manual:42 Some Street, SW1A 1AA',
                });
                const { status, body } = await confirmBooking<BookingConfirmResponse>(
                    apiRequest,
                    payload as unknown as Record<string, unknown>,
                );
                expect(status).toBe(200);
                expect(BookingConfirmResponseSchema.parse(body).status).toBe('success');
            },
        );
    });

    test.describe('Idempotency window', () => {
        test(
            'Repeated identical submissions return the same bookingId with idempotent=true',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const payload = buildBookingPayload({
                    addressId: ADDRESS_IDS.SW1A_DOWNING_12,
                    skipSize: '5-yard',
                    price: SKIP_PRICES_GBP['5-yard'],
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
                const firstParsed = BookingConfirmResponseSchema.parse(first.body);
                const secondParsed = BookingConfirmResponseSchema.parse(second.body);

                expect(firstParsed.idempotent).toBeUndefined();
                expect(secondParsed.idempotent).toBe(true);
                expect(secondParsed.bookingId).toBe(firstParsed.bookingId);
            },
        );

        test(
            'Changing any payload field mints a fresh bookingId (no cross-contamination)',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const base = buildBookingPayload({
                    addressId: 'manual:1 Idempotency Road, SW1A 1AA',
                    skipSize: '4-yard',
                    price: SKIP_PRICES_GBP['4-yard'],
                });
                const mutated = {
                    ...base,
                    skipSize: '6-yard' as const,
                    price: SKIP_PRICES_GBP['6-yard'],
                };

                const a = await confirmBooking<BookingConfirmResponse>(
                    apiRequest,
                    base as unknown as Record<string, unknown>,
                );
                const b = await confirmBooking<BookingConfirmResponse>(
                    apiRequest,
                    mutated as unknown as Record<string, unknown>,
                );

                const aParsed = BookingConfirmResponseSchema.parse(a.body);
                const bParsed = BookingConfirmResponseSchema.parse(b.body);
                expect(bParsed.idempotent).toBeUndefined();
                expect(bParsed.bookingId).not.toBe(aParsed.bookingId);
            },
        );
    });

    test.describe('Business-rule errors', () => {
        test(
            'Booking a disabled skip returns 409 SKIP_DISABLED',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const payload = buildBookingPayload({
                    heavyWaste: true,
                    skipSize: '2-yard',
                    price: SKIP_PRICES_GBP['2-yard'],
                });
                const { status, body } = await confirmBooking<ApiError>(
                    apiRequest,
                    payload as unknown as Record<string, unknown>,
                );
                expect(status).toBe(409);
                const parsed = ApiErrorSchema.parse(body);
                expect(parsed.error).toBe('SKIP_DISABLED');
                expect(parsed.message).toMatch(/2-yard/);
            },
        );

        test(
            'Wrong price returns 409 PRICE_MISMATCH with expected and got values',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const payload = buildBookingPayload({
                    skipSize: '4-yard',
                    price: 1,
                });
                const { status, body } = await confirmBooking<ApiError>(
                    apiRequest,
                    payload as unknown as Record<string, unknown>,
                );
                expect(status).toBe(409);
                const parsed = ApiErrorSchema.parse(body);
                expect(parsed.error).toBe('PRICE_MISMATCH');
                expect(parsed.message).toContain(String(SKIP_PRICES_GBP['4-yard']));
            },
        );
    });

    test.describe('Validation errors', () => {
        test(
            'Unknown addressId (not "manual:" prefixed) returns 422 ADDRESS_NOT_FOUND',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const payload = buildBookingPayload({ addressId: 'addr_nonexistent' });
                const { status, body } = await confirmBooking<ApiError>(
                    apiRequest,
                    payload as unknown as Record<string, unknown>,
                );
                expect(status).toBe(422);
                expect(ApiErrorSchema.parse(body).error).toBe('ADDRESS_NOT_FOUND');
            },
        );

        test(
            'Unknown skipSize returns 422 SKIP_NOT_FOUND',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const payload = {
                    ...buildBookingPayload(),
                    skipSize: '7-yard',
                };
                const { status, body } = await confirmBooking<ApiError>(
                    apiRequest,
                    payload as unknown as Record<string, unknown>,
                );
                expect(status).toBe(422);
                expect(ApiErrorSchema.parse(body).error).toBe('SKIP_NOT_FOUND');
            },
        );

        test(
            'Invalid postcode returns 422 INVALID_POSTCODE',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const payload = buildBookingPayload({ postcode: 'NOTAPOSTCODE' });
                const { status, body } = await confirmBooking<ApiError>(
                    apiRequest,
                    payload as unknown as Record<string, unknown>,
                );
                expect(status).toBe(422);
                expect(ApiErrorSchema.parse(body).error).toBe('INVALID_POSTCODE');
            },
        );

        test(
            'Each required field missing produces the matching 400 error code',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const cases: ReadonlyArray<{
                    field: string;
                    expected: string;
                    mutate: (p: Record<string, unknown>) => void;
                }> = [
                    {
                        field: 'postcode',
                        expected: 'INVALID_POSTCODE',
                        mutate: (p) => { delete p.postcode; },
                    },
                    {
                        field: 'addressId',
                        expected: 'INVALID_ADDRESS',
                        mutate: (p) => { delete p.addressId; },
                    },
                    {
                        field: 'heavyWaste',
                        expected: 'INVALID_WASTE_FLAGS',
                        mutate: (p) => { p.heavyWaste = 'no'; },
                    },
                    {
                        field: 'skipSize',
                        expected: 'INVALID_SKIP',
                        mutate: (p) => { delete p.skipSize; },
                    },
                ];

                for (const { field, expected, mutate } of cases) {
                    const payload = buildBookingPayload() as unknown as Record<string, unknown>;
                    mutate(payload);
                    const { status, body } = await confirmBooking<ApiError>(apiRequest, payload);
                    expect(status, `Missing ${field} should be 400`).toBe(400);
                    expect(ApiErrorSchema.parse(body).error).toBe(expected);
                }
            },
        );

        test(
            'Returns 400 INVALID_JSON for a body that is not valid JSON',
            { tag: '@Booking-API' },
            async ({ request }) => {
                // Buffer keeps the raw bytes intact; a string would be
                // silently JSON-encoded by Playwright into valid JSON.
                const response = await request.post(`${bookingConfig.apiUrl}${ENDPOINT}`, {
                    data: Buffer.from('not-json'),
                    headers: { 'Content-Type': 'application/json' },
                });
                expect(response.status()).toBe(400);
                expect(ApiErrorSchema.parse(await response.json()).error).toBe('INVALID_JSON');
            },
        );
    });

    test.describe('End-to-end chain', () => {
        test(
            'lookup → skips → confirm: values returned by upstream endpoints are accepted downstream',
            { tag: '@Booking-API' },
            async ({ apiRequest }) => {
                const { body: lookupBody } = await apiRequest<{
                    postcode: string;
                    addresses: { id: string }[];
                }>({
                    method: 'POST',
                    url: bookingConfig.paths.POSTCODE_LOOKUP,
                    body: { postcode: POSTCODES.HAPPY },
                });
                const addressId = lookupBody.addresses[0].id;

                const { body: skipsBody } = await apiRequest<{
                    skips: { size: string; price: number; disabled: boolean }[];
                }>({
                    method: 'GET',
                    url: bookingConfig.paths.SKIPS,
                    query: { postcode: POSTCODES.HAPPY },
                });
                const enabled = skipsBody.skips.find((s) => !s.disabled)!;

                const { status, body } = await confirmBooking<BookingConfirmResponse>(
                    apiRequest,
                    buildBookingPayload({
                        addressId,
                        skipSize: enabled.size as 'SkipSize' as never,
                        price: enabled.price,
                    }) as unknown as Record<string, unknown>,
                );
                expect(status).toBe(200);
                expect(BookingConfirmResponseSchema.parse(body).status).toBe('success');
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
