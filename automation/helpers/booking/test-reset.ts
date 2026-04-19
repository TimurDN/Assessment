import { expect } from '@playwright/test';
import type { ApiRequestFn } from '../../fixtures/api/api-types';
import { bookingConfig } from '../../config/booking';
import {
    TestResetResponseSchema,
    type TestResetResponse,
} from '../../fixtures/api/schemas/booking/test-reset';

/**
 * Reset the server-side retry counter for a given postcode via the
 * test-only `POST /api/testkit/reset` endpoint.
 *
 * Called from `beforeEach` in specs that exercise the `BS1 4DJ`
 * "500 on first call, 200 on retry" fixture so every test starts
 * from a known counter state regardless of execution order.
 *
 * Also clears the booking-confirm idempotency cache. By default only
 * entries matching `postcode` are cleared so parallel workers do not
 * wipe each other's fresh writes. Pass `allBookings: true` from a
 * file that runs `test.describe.configure({ mode: 'serial' })` to
 * blanket-clear the cache (useful when the spec asserts on the
 * absence of cached entries across runs).
 *
 * @param apiRequest  Playwright `apiRequest` fixture.
 * @param postcode    Postcode to reset. Defaults to `'BS1 4DJ'`.
 * @param options     `{ allBookings }` – when true, the server clears the
 *                    entire booking cache instead of just `postcode`'s entries.
 * @returns           Resolves with the validated response body.
 */
export async function resetRetryCounter(
    apiRequest: ApiRequestFn,
    postcode: string = 'BS1 4DJ',
    options: { allBookings?: boolean } = {},
): Promise<TestResetResponse> {
    const { status, body } = await apiRequest<TestResetResponse>({
        method: 'POST',
        url: bookingConfig.api.TEST_RESET,
        baseUrl: bookingConfig.apiUrl,
        body: options.allBookings
            ? { postcode, scope: 'all' }
            : { postcode },
    });

    expect(
        status,
        `Test-reset endpoint should respond 200 for ${postcode}, got ${status}`,
    ).toBe(200);
    return TestResetResponseSchema.parse(body);
}
