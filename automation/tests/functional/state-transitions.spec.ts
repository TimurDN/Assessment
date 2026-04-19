import { expect, test } from '../../fixtures/pom/test-options';
import { ADDRESS_IDS, POSTCODES } from '../../test-data/booking/booking';

/**
 * Functional — Wizard state-transition rules.
 *
 * Covers the "change upstream, downstream must reset" invariants and the
 * guard rails around branching (plasterboard) and double-submit.
 */
test.describe('Functional — Wizard state transitions', () => {
    test(
        'Toggling plasterboard reveals 3 options, toggling back hides them and clears the option',
        { tag: '@Booking-Functional' },
        async ({ bookingPage }) => {
            await bookingPage.goto();
            await bookingPage.lookupPostcode(POSTCODES.HAPPY);
            await bookingPage.selectAddress(ADDRESS_IDS.SW1A_DOWNING_10);
            await bookingPage.goToStep2FromPostcode();

            await test.step('WHEN: Plasterboard = Yes', async () => {
                await bookingPage.setWasteTypes({ heavy: false, plasterboard: true });
            });

            await test.step(
                'THEN: 3 handling options are visible and Continue is disabled',
                async () => {
                    await expect(bookingPage.plasterboardOptions).toBeVisible();
                    await expect(bookingPage.wasteNextButton).toBeDisabled();
                },
            );

            await test.step(
                'WHEN: User picks a handling option, then flips plasterboard = No',
                async () => {
                    await bookingPage.setWasteTypes({
                        heavy: false,
                        plasterboard: true,
                        plasterboardOption: 'bagged',
                    });
                    await expect(bookingPage.wasteNextButton).toBeEnabled();
                    await bookingPage.setWasteTypes({ heavy: false, plasterboard: false });
                },
            );

            await test.step(
                'THEN: Options sub-form is hidden and Continue is enabled again',
                async () => {
                    await expect(bookingPage.plasterboardOptions).toBeHidden();
                    await expect(bookingPage.wasteNextButton).toBeEnabled();
                },
            );
        },
    );

    test(
        'Going back from step 3 preserves the waste selection',
        { tag: '@Booking-Functional' },
        async ({ bookingPage, page }) => {
            await bookingPage.goto();
            await bookingPage.lookupPostcode(POSTCODES.HAPPY);
            await bookingPage.selectAddress(ADDRESS_IDS.SW1A_DOWNING_10);
            await bookingPage.goToStep2FromPostcode();
            await bookingPage.setWasteTypes({ heavy: true, plasterboard: false });
            await bookingPage.goToStep3FromWaste();

            await test.step('WHEN: User clicks Back on step 3', async () => {
                await page
                    .getByTestId('step-skip')
                    .getByRole('button', { name: 'Back' })
                    .click();
            });

            await test.step(
                'THEN: Heavy-waste = Yes and Plasterboard = No are still selected',
                async () => {
                    await bookingPage.expectStep(2);
                    await expect(page.getByTestId('heavy-waste-yes')).toHaveAttribute(
                        'data-selected',
                        'true',
                    );
                    await expect(page.getByTestId('plasterboard-no')).toHaveAttribute(
                        'data-selected',
                        'true',
                    );
                },
            );
        },
    );

    test(
        'Clicking Confirm fires the API only once (idempotency)',
        { tag: '@Booking-Functional' },
        async ({ bookingPage, page }) => {
            await bookingPage.goto();
            await bookingPage.lookupPostcode(POSTCODES.HAPPY);
            await bookingPage.selectAddress(ADDRESS_IDS.SW1A_DOWNING_11);
            await bookingPage.goToStep2FromPostcode();
            await bookingPage.setWasteTypes({ heavy: false, plasterboard: false });
            await bookingPage.goToStep3FromWaste();
            await bookingPage.waitForSkipList();
            await bookingPage.selectSkip('4-yard');
            await bookingPage.goToStep4FromSkip();

            let confirmCalls = 0;
            await page.route('**/api/booking/confirm', (route) => {
                confirmCalls += 1;
                return route.continue();
            });

            await test.step(
                'WHEN: User confirms and the success view appears',
                async () => {
                    const id = await bookingPage.confirmBooking();
                    expect(id).toMatch(/^BK-\d{5}$/);
                },
            );

            await test.step(
                'THEN: Confirm button is no longer reachable (success view replaces the form)',
                async () => {
                    await expect(bookingPage.confirmBookingButton).toHaveCount(0);
                    expect(confirmCalls, 'Confirm should only fire once').toBe(1);
                },
            );
        },
    );
});
