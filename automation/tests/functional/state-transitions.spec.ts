import { expect, test } from '../../fixtures/pom/test-options';
import bookingData from '../../test-data/booking/booking.json';

// ═══════════════════════════════════════════════════════════════
// Booking Wizard — State Transitions (functional)
// ═══════════════════════════════════════════════════════════════

test.describe('Booking Wizard — State Transitions', () => {
    test.beforeEach(async ({ bookingPage }) => {
        await test.step('GIVEN: User is on the booking homepage', async () => {
            await bookingPage.open();
            await bookingPage.verifyPageLoaded();
        });
    });

    test(
        'Verify plasterboard toggle shows three options when Yes and hides them when No',
        { tag: '@App-regression' },
        async ({ page, bookingPage }) => {
            await test.step(
                'GIVEN: User has selected a SW1A 1AA address and advanced to waste',
                async () => {
                    await bookingPage.enterPostcode(bookingData.postcodes.HAPPY);
                    await bookingPage.verifyAddressListPopulated(
                        bookingData.addressCounts.SW1A,
                    );
                    await bookingPage.selectAddress(
                        bookingData.addressIds.SW1A_DOWNING_10,
                    );
                    await bookingPage.clickContinueFromStep1();
                },
            );

            await test.step('WHEN: Plasterboard=Yes is toggled', async () => {
                await bookingPage.selectWasteTypes({
                    heavy: false,
                    plasterboard: true,
                });
            });

            await test.step(
                'THEN: The 3 handling options are visible and Continue stays disabled',
                async () => {
                    await expect(bookingPage.plasterboardOptions).toBeVisible();
                    await expect(page.getByTestId('waste-next')).toBeDisabled();
                },
            );

            await test.step(
                'WHEN: User picks a handling option and then flips plasterboard back to No',
                async () => {
                    await bookingPage.selectWasteTypes({
                        heavy: false,
                        plasterboard: true,
                        plasterboardOption: 'bagged',
                    });
                    await expect(page.getByTestId('waste-next')).toBeEnabled();
                    await bookingPage.selectWasteTypes({
                        heavy: false,
                        plasterboard: false,
                    });
                },
            );

            await test.step(
                'THEN: The options sub-form hides and Continue is enabled again',
                async () => {
                    await expect(bookingPage.plasterboardOptions).toBeHidden();
                    await expect(page.getByTestId('waste-next')).toBeEnabled();
                },
            );
        },
    );

    test(
        'Verify going Back from step 3 preserves the waste selection',
        { tag: '@App-regression' },
        async ({ page, bookingPage }) => {
            await test.step(
                'GIVEN: User has flagged heavy waste and advanced to skip selection',
                async () => {
                    await bookingPage.enterPostcode(bookingData.postcodes.HAPPY);
                    await bookingPage.verifyAddressListPopulated(
                        bookingData.addressCounts.SW1A,
                    );
                    await bookingPage.selectAddress(
                        bookingData.addressIds.SW1A_DOWNING_10,
                    );
                    await bookingPage.clickContinueFromStep1();
                    await bookingPage.selectWasteTypes({
                        heavy: true,
                        plasterboard: false,
                    });
                    await bookingPage.clickContinueFromStep2();
                },
            );

            await test.step('WHEN: User clicks Back on step 3', async () => {
                await page
                    .getByTestId('step-skip')
                    .getByRole('button', { name: 'Back' })
                    .click();
            });

            await test.step(
                'THEN: Wizard returns to step 2 with heavy=Yes / plasterboard=No still selected',
                async () => {
                    await bookingPage.verifyStep(2);
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
        'Verify clicking Confirm fires the API only once and the success view replaces the form',
        { tag: '@App-regression' },
        async ({ page, bookingPage }) => {
            await test.step(
                'GIVEN: User has completed the wizard up to the Review step',
                async () => {
                    await bookingPage.enterPostcode(bookingData.postcodes.HAPPY);
                    await bookingPage.verifyAddressListPopulated(
                        bookingData.addressCounts.SW1A,
                    );
                    await bookingPage.selectAddress(
                        bookingData.addressIds.SW1A_DOWNING_11,
                    );
                    await bookingPage.clickContinueFromStep1();
                    await bookingPage.selectWasteTypes({
                        heavy: false,
                        plasterboard: false,
                    });
                    await bookingPage.clickContinueFromStep2();
                    await bookingPage.selectSkip('4-yard');
                    await bookingPage.clickContinueFromStep3();
                },
            );

            let confirmCalls = 0;
            await page.route('**/api/booking/confirm', (route) => {
                confirmCalls += 1;
                return route.continue();
            });

            await test.step('WHEN: User confirms the booking', async () => {
                const id = await bookingPage.confirmBooking();
                expect(id).toMatch(/^BK-\d{5}$/);
            });

            await test.step(
                'THEN: Confirm button is gone and the API fired exactly once',
                async () => {
                    await expect(bookingPage.confirmBookingButton).toHaveCount(0);
                    expect(
                        confirmCalls,
                        'Confirm endpoint should fire exactly once',
                    ).toBe(1);
                },
            );
        },
    );
});
