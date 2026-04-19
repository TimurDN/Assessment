/**
 * Thin per-endpoint wrappers around {@link ApiRequestFn}.
 *
 * Keeping request plumbing out of the specs lets each test read as a
 * sequence of *intentions* ("look up SW1A", "confirm this booking")
 * instead of HTTP boilerplate. Every wrapper returns the raw
 * `{ status, body }` — callers decide which Zod schema to parse with,
 * so error paths can still assert on {@link APIErrorSchema} without
 * any special casing here.
 *
 * Convention notes:
 * - URL suffixes live in `bookingConfig.api.*` (back-end) / `bookingConfig.paths.*`
 *   (front-end) to mirror the primelabs-automation split.
 * - Helpers never call `expect()` — specs own assertions.
 */
import type { ApiRequestFn, ApiRequestResponse } from '../../fixtures/api/api-types';
import { bookingConfig } from '../../config/booking';
import type { PlasterboardOption } from '../../fixtures/api/schemas/booking/waste-types';
import type { SkipSize } from '../../fixtures/api/schemas/booking/skips';
import bookingData from '../../test-data/booking/booking.json';

/** Canonical waste-types request body. */
export type WasteTypesBody = {
    heavyWaste: boolean;
    plasterboard: boolean;
    plasterboardOption: PlasterboardOption | null;
};

/** Canonical booking-confirm request body. */
export type BookingConfirmBody = WasteTypesBody & {
    postcode: string;
    addressId: string;
    skipSize: SkipSize;
    price: number;
};

/** Query parameters accepted by `GET /api/skips`. */
export type SkipsQuery = {
    postcode: string;
    heavyWaste?: boolean;
    plasterboard?: boolean;
};

export async function lookupPostcode<T = unknown>(
    apiRequest: ApiRequestFn,
    postcode: unknown,
): Promise<ApiRequestResponse<T>> {
    return apiRequest<T>({
        method: 'POST',
        url: bookingConfig.api.POSTCODE_LOOKUP,
        baseUrl: bookingConfig.apiUrl,
        body: { postcode } as Record<string, unknown>,
    });
}

export async function submitWasteTypes<T = unknown>(
    apiRequest: ApiRequestFn,
    body: Record<string, unknown>,
): Promise<ApiRequestResponse<T>> {
    return apiRequest<T>({
        method: 'POST',
        url: bookingConfig.api.WASTE_TYPES,
        baseUrl: bookingConfig.apiUrl,
        body,
    });
}

export async function getSkips<T = unknown>(
    apiRequest: ApiRequestFn,
    query: Record<string, string | number | boolean | null | undefined>,
): Promise<ApiRequestResponse<T>> {
    return apiRequest<T>({
        method: 'GET',
        url: bookingConfig.api.SKIPS,
        baseUrl: bookingConfig.apiUrl,
        query,
    });
}

export async function confirmBooking<T = unknown>(
    apiRequest: ApiRequestFn,
    body: Record<string, unknown>,
): Promise<ApiRequestResponse<T>> {
    return apiRequest<T>({
        method: 'POST',
        url: bookingConfig.api.BOOKING_CONFIRM,
        baseUrl: bookingConfig.apiUrl,
        body,
    });
}

/**
 * Build a valid booking payload against the default SW1A/4-yard happy path.
 * Every field is overrideable so specs can tweak exactly one thing to force
 * a specific error (e.g. `{ price: 999 }` for PRICE_MISMATCH).
 */
export function buildBookingPayload(
    overrides: Partial<BookingConfirmBody> = {},
): BookingConfirmBody {
    const base: BookingConfirmBody = {
        postcode: bookingData.postcodes.HAPPY,
        addressId: bookingData.addressIds.SW1A_DOWNING_10,
        heavyWaste: false,
        plasterboard: false,
        plasterboardOption: null,
        skipSize: '4-yard',
        price: bookingData.skipPricesGBP['4-yard'],
    };
    return { ...base, ...overrides };
}
