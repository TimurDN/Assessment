import { expect, test } from '../../fixtures/pom/test-options';
import { resetRetryCounter } from '../../helpers/booking/test-reset';
import { ADDRESS_COUNTS, POSTCODES } from '../../test-data/booking/booking';

/**
 * Functional — API failure + retry behaviour.
 *
 * The `BS1 4DJ` fixture returns 500 on the first call and 200 on retry.
 * Reset the server-side counter before each test so the sequence is
 * deterministic regardless of test execution order or parallelism.
 */
test.describe('Functional — API failure and retry', () => {
    test.beforeEach(async ({ apiRequest }) => {
        await resetRetryCounter(apiRequest, POSTCODES.RETRY);
    });

    test(
        'BS1 4DJ surfaces an error, Retry recovers on the second attempt',
        { tag: '@Booking-Functional' },
        async ({ bookingPage, page }) => {
            await bookingPage.goto();

            await test.step('WHEN: User looks up BS1 4DJ', async () => {
                await bookingPage.lookupPostcode(POSTCODES.RETRY);
            });

            await test.step('THEN: Error alert with Retry is shown', async () => {
                await bookingPage.expectLookupError();
            });

            await test.step('AND: Manual entry fallback is also offered', async () => {
                await expect(
                    bookingPage.postcodeError.getByRole('button', {
                        name: /Enter address manually/,
                    }),
                ).toBeVisible();
            });

            await test.step('WHEN: User clicks Retry', async () => {
                await bookingPage.retryPostcodeLookup();
            });

            await test.step('THEN: Addresses load successfully', async () => {
                await bookingPage.expectAddressResults(ADDRESS_COUNTS.BS1);
                await expect(bookingPage.postcodeError).toBeHidden();
                await expect(page.getByTestId('postcode-validation-error')).toBeHidden();
            });
        },
    );

    test(
        'Error state falls back to manual entry without retrying',
        { tag: '@Booking-Functional' },
        async ({ bookingPage, page }) => {
            await bookingPage.goto();
            await bookingPage.lookupPostcode(POSTCODES.RETRY);
            await bookingPage.expectLookupError();

            await test.step(
                'WHEN: User opens manual entry from the error alert',
                async () => {
                    await bookingPage.postcodeError
                        .getByRole('button', { name: 'Enter address manually' })
                        .click();
                },
            );

            await test.step(
                'THEN: Manual address form is visible and submittable',
                async () => {
                    await expect(page.getByTestId('manual-address')).toBeVisible();
                    await bookingPage.enterManualAddress('100 Temple Meads', 'Bristol');
                    await expect(bookingPage.postcodeNextButton).toBeEnabled();
                },
            );
        },
    );
});
