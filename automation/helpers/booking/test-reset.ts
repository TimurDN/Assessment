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
 * @param apiRequest  Playwright `apiRequest` fixture.
 * @param postcode    Postcode to reset. Defaults to `'BS1 4DJ'`.
 * @returns           Resolves with the validated response body.
 */
export async function resetRetryCounter(
    apiRequest: ApiRequestFn,
    postcode: string = 'BS1 4DJ',
): Promise<TestResetResponse> {
    const { status, body } = await apiRequest<TestResetResponse>({
        method: 'POST',
        url: bookingConfig.paths.TEST_RESET,
        body: { postcode },
    });

    expect(
        status,
        `Test-reset endpoint should respond 200 for ${postcode}, got ${status}`,
    ).toBe(200);
    return TestResetResponseSchema.parse(body);
}
