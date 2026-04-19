import { test as base } from '@playwright/test';
import { BookingPage } from '../../pages/booking.page';

/**
 * Fixture shape providing instantiated Page Objects to specs.
 * Keep this type in lock-step with the bindings below.
 */
export type FrameworkFixtures = {
    bookingPage: BookingPage;
};

/**
 * POM fixture: wires up one `BookingPage` per test. Tests receive an already-
 * constructed object and can call navigation/interaction helpers directly.
 *
 * Usage:
 *
 * ```ts
 * test('happy path', async ({ bookingPage }) => {
 *     await bookingPage.goto();
 *     await bookingPage.lookupPostcode('SW1A 1AA');
 * });
 * ```
 */
export const test = base.extend<FrameworkFixtures>({
    bookingPage: async ({ page }, use) => {
        await use(new BookingPage(page));
    },
});
