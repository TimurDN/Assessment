import { expect, test } from '../../fixtures/pom/test-options';
import { resetRetryCounter } from '../../helpers/booking/test-reset';
import bookingData from '../../test-data/booking/booking.json';

// ═══════════════════════════════════════════════════════════════
// Booking Wizard — API Failure & Retry (functional)
// ═══════════════════════════════════════════════════════════════

test.describe('Booking Wizard — API Failure & Retry', () => {
    test.beforeEach(async ({ apiRequest, bookingPage }) => {
        await test.step(
            'GIVEN: Server-side retry counter is reset and user is on the homepage',
            async () => {
                await resetRetryCounter(apiRequest, bookingData.postcodes.RETRY);
                await bookingPage.open();
                await bookingPage.verifyPageLoaded();
            },
        );
    });

    test(
        'Verify BS1 4DJ surfaces an error alert and recovers on retry',
        { tag: '@App-regression' },
        async ({ bookingPage, page }) => {
            await test.step('WHEN: User looks up BS1 4DJ', async () => {
                await bookingPage.enterPostcode(bookingData.postcodes.RETRY);
            });

            await test.step(
                'THEN: Error alert with a Retry action is shown',
                async () => {
                    await bookingPage.verifyPostcodeServerError();
                },
            );

            await test.step(
                'AND: A manual-entry fallback button is offered inside the alert',
                async () => {
                    await expect(
                        bookingPage.postcodeServerError.getByRole('button', {
                            name: /Enter address manually/,
                        }),
                    ).toBeVisible();
                },
            );

            await test.step('WHEN: User clicks Retry', async () => {
                await bookingPage.retryPostcodeLookup();
            });

            await test.step(
                'THEN: Addresses load successfully and the error clears',
                async () => {
                    await bookingPage.verifyAddressListPopulated(
                        bookingData.addressCounts.BS1,
                    );
                    await expect(bookingPage.postcodeServerError).toBeHidden();
                    await expect(
                        page.getByTestId('postcode-validation-error'),
                    ).toBeHidden();
                },
            );
        },
    );

    test(
        'Verify the error alert falls back to manual entry without retrying',
        { tag: '@App-regression' },
        async ({ bookingPage, page }) => {
            await test.step('WHEN: User looks up BS1 4DJ', async () => {
                await bookingPage.enterPostcode(bookingData.postcodes.RETRY);
                await bookingPage.verifyPostcodeServerError();
            });

            await test.step(
                'AND: User opens manual entry directly from the error alert',
                async () => {
                    await bookingPage.postcodeServerError
                        .getByRole('button', { name: 'Enter address manually' })
                        .click();
                },
            );

            await test.step(
                'THEN: Manual address form accepts a submission and Continue enables',
                async () => {
                    await expect(page.getByTestId('manual-address')).toBeVisible();
                    await bookingPage.enterManualAddress(
                        '100 Temple Meads',
                        'Bristol',
                    );
                    await expect(page.getByTestId('postcode-next')).toBeEnabled();
                },
            );
        },
    );
});
