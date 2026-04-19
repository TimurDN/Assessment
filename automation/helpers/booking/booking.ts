/**
 * Thin per-endpoint wrappers around {@link ApiRequestFn}.
 *
 * Keeping request plumbing out of the specs lets each test read as a
 * sequence of *intentions* ("look up SW1A", "confirm this booking") instead
 * of HTTP boilerplate. Every wrapper returns the raw `{ status, body }` —
 * callers decide which Zod schema to parse with, so error paths can still
 * assert on {@link ApiErrorSchema} without any special casing here.
 */
import type { ApiRequestFn, ApiRequestResponse } from '../../fixtures/api/api-types';
import { bookingConfig } from '../../config/booking';
import type { PlasterboardOption } from '../../fixtures/api/schemas/booking/waste-types';
import type { SkipSize } from '../../fixtures/api/schemas/booking/skips';
import {
    ADDRESS_IDS,
    POSTCODES,
    SKIP_PRICES_GBP,
} from '../../test-data/booking/booking';

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
        url: bookingConfig.paths.POSTCODE_LOOKUP,
        body: { postcode } as Record<string, unknown>,
    });
}

export async function submitWasteTypes<T = unknown>(
    apiRequest: ApiRequestFn,
    body: Record<string, unknown>,
): Promise<ApiRequestResponse<T>> {
    return apiRequest<T>({
        method: 'POST',
        url: bookingConfig.paths.WASTE_TYPES,
        body,
    });
}

export async function getSkips<T = unknown>(
    apiRequest: ApiRequestFn,
    query: Record<string, string | number | boolean | null | undefined>,
): Promise<ApiRequestResponse<T>> {
    return apiRequest<T>({
        method: 'GET',
        url: bookingConfig.paths.SKIPS,
        query,
    });
}

export async function confirmBooking<T = unknown>(
    apiRequest: ApiRequestFn,
    body: Record<string, unknown>,
): Promise<ApiRequestResponse<T>> {
    return apiRequest<T>({
        method: 'POST',
        url: bookingConfig.paths.BOOKING_CONFIRM,
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
        postcode: POSTCODES.HAPPY,
        addressId: ADDRESS_IDS.SW1A_DOWNING_10,
        heavyWaste: false,
        plasterboard: false,
        plasterboardOption: null,
        skipSize: '4-yard',
        price: SKIP_PRICES_GBP['4-yard'],
    };
    return { ...base, ...overrides };
}
