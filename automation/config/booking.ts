/**
 * Central configuration for the booking-flow API/UI tests.
 *
 * `apiUrl` defaults to the Playwright `baseURL` (which is `http://localhost:3000`
 * via `BASE_URL` env) and can be overridden with `API_URL` if the API is hosted
 * separately from the UI in CI.
 */
export const bookingConfig = {
    apiUrl: process.env.API_URL ?? process.env.BASE_URL ?? 'http://localhost:3000',
    paths: {
        POSTCODE_LOOKUP: '/api/postcode/lookup',
        WASTE_TYPES: '/api/waste-types',
        SKIPS: '/api/skips',
        BOOKING_CONFIRM: '/api/booking/confirm',
        TEST_RESET: '/api/testkit/reset',
    },
} as const;
