import { expect, test } from '../../fixtures/pom/test-options';
import { ADDRESS_COUNTS, POSTCODES } from '../../test-data/booking/booking';

/**
 * Functional — Step 1 postcode validation + empty states.
 *
 * Each test exercises one independent validation scenario; no state leaks
 * between tests (each reloads the wizard from scratch).
 */
test.describe('Functional — Postcode field validation', () => {
    test.beforeEach(async ({ bookingPage }) => {
        await bookingPage.goto();
    });

    test(
        'Empty postcode shows inline validation and does not call the API',
        { tag: '@Booking-Functional' },
        async ({ bookingPage, page }) => {
            let calls = 0;
            await page.route('**/api/postcode/lookup', (route) => {
                calls += 1;
                return route.continue();
            });

            await bookingPage.findAddressButton.click();

            await expect(bookingPage.postcodeValidationError).toContainText(
                'Please enter a postcode',
            );
            expect(calls, 'API must not be called for empty input').toBe(0);
        },
    );

    test(
        'Invalid postcode format is rejected with an inline error',
        { tag: '@Booking-Functional' },
        async ({ bookingPage }) => {
            await bookingPage.postcodeInput.fill('NOTAPOSTCODE');
            await bookingPage.findAddressButton.click();
            await expect(bookingPage.postcodeValidationError).toContainText(
                /not a valid|doesn/i,
            );
        },
    );

    test(
        'Lowercase postcode is normalised and looked up successfully',
        { tag: '@Booking-Functional' },
        async ({ bookingPage }) => {
            await bookingPage.lookupPostcode('sw1a 1aa');
            await bookingPage.expectAddressResults(ADDRESS_COUNTS.SW1A);
        },
    );

    test(
        'EC1A 1BB renders the empty state with a manual-entry fallback',
        { tag: '@Booking-Functional' },
        async ({ bookingPage }) => {
            await bookingPage.lookupPostcode(POSTCODES.EMPTY);
            await bookingPage.expectEmptyPostcodeState();

            await bookingPage.enterManualAddress('1 Queen Victoria Street', 'London');
            await expect(bookingPage.postcodeNextButton).toBeEnabled();
        },
    );
});
