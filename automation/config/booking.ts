/**
 * Central configuration for the booking-flow automation suite.
 *
 * Shape mirrors `primelabs-automation/config/app.ts`:
 *   - `baseUrl` / `apiUrl`: resolved from env with sensible defaults.
 *   - `paths`: **front-end** route segments (used by POMs).
 *   - `api`:   **back-end** route suffixes (joined with `apiUrl` in helpers).
 *   - `timeouts`: shared UI/API waits consumed by POM `verify*` methods.
 */
export const bookingConfig = {
    baseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
    apiUrl:
        process.env.API_URL ?? process.env.BASE_URL ?? 'http://localhost:3000',
    paths: {
        HOME: '/',
        BOOKING: '/',
    },
    api: {
        POSTCODE_LOOKUP: '/api/postcode/lookup',
        WASTE_TYPES: '/api/waste-types',
        SKIPS: '/api/skips',
        BOOKING_CONFIRM: '/api/booking/confirm',
        TEST_RESET: '/api/testkit/reset',
    },
    timeouts: {
        navigation: 30_000,
        element: 10_000,
        api: 30_000,
    },
} as const;
