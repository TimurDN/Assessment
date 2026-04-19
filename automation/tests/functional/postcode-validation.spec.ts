import { expect, test } from '../../fixtures/pom/test-options';
import bookingData from '../../test-data/booking/booking.json';
import postcodeValidation from '../../test-data/booking/postcodeValidation.json';

// ═══════════════════════════════════════════════════════════════
// Booking Wizard — Postcode Validation (functional)
// ═══════════════════════════════════════════════════════════════

test.describe('Booking Wizard — Postcode Validation', () => {
    test.beforeEach(async ({ bookingPage }) => {
        await test.step('GIVEN: User is on the booking homepage', async () => {
            await bookingPage.open();
            await bookingPage.verifyPageLoaded();
        });
    });

    test(
        'Verify empty postcode shows inline validation and does not call the API',
        { tag: '@App-regression' },
        async ({ page, bookingPage }) => {
            let apiCalls = 0;
            await page.route('**/api/postcode/lookup', (route) => {
                apiCalls += 1;
                return route.continue();
            });

            await bookingPage.findAddressButton.click();

            await bookingPage.verifyPostcodeClientError();
            expect(
                apiCalls,
                'API must not be called for an empty postcode input',
            ).toBe(0);
        },
    );

    for (const invalid of postcodeValidation.malformedPostcodes) {
        test(
            `Verify invalid postcode "${invalid}" surfaces a validation error`,
            { tag: '@App-regression' },
            async ({ bookingPage }) => {
                await bookingPage.enterPostcode(invalid);
                await bookingPage.verifyAnyPostcodeError();
            },
        );
    }

    test(
        'Verify postcode input accepts normalized variants of SW1A 1AA',
        { tag: '@App-regression' },
        async ({ bookingPage }) => {
            for (const variant of postcodeValidation.normalizationVariants) {
                await test.step(`Accepts "${variant}"`, async () => {
                    await bookingPage.clearPostcode();
                    await bookingPage.enterPostcode(variant);
                    await bookingPage.verifyAddressListPopulated(
                        bookingData.addressCounts.SW1A,
                    );
                });
            }
        },
    );

    test(
        'Verify EC1A 1BB renders the empty state with a manual-entry fallback',
        { tag: '@App-regression' },
        async ({ bookingPage, page }) => {
            await bookingPage.enterPostcode(bookingData.postcodes.EMPTY);
            await bookingPage.verifyEmptyPostcodeState();

            await bookingPage.enterManualAddress(
                '1 Queen Victoria Street',
                'London',
            );
            await expect(
                page.getByTestId('postcode-next'),
            ).toBeEnabled();
        },
    );
});
