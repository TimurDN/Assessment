import { expect, test } from '../../fixtures/pom/test-options';
import {
    PLASTERBOARD_COLLECTION_FEE_GBP,
    POSTCODES,
    SKIP_PRICES_GBP,
    VAT_RATE,
} from '../../test-data/booking/booking';

/**
 * E2E — Plasterboard branching flow.
 *
 * Exercises the branching Step 2 sub-form: when plasterboard = Yes, three
 * handling options appear and one must be chosen before Continue enables.
 * The `collection` option adds a dedicated-collection fee to the price
 * breakdown which must reconcile through review and confirm.
 */
test.describe('E2E — Plasterboard branching flow', () => {
    test.setTimeout(60_000);

    test(
        'Plasterboard=Yes reveals 3 options and the collection fee reaches confirm',
        { tag: '@Booking-E2E' },
        async ({ bookingPage, page }) => {
            const chosenSkip = '5-yard' as const;
            const skipPrice = SKIP_PRICES_GBP[chosenSkip];
            const subtotal = skipPrice + PLASTERBOARD_COLLECTION_FEE_GBP;
            const vat = Math.round(subtotal * VAT_RATE);
            const total = subtotal + vat;

            await test.step('GIVEN: User has selected a SW1A 1AA address', async () => {
                await bookingPage.goto();
                await bookingPage.lookupPostcode(POSTCODES.HAPPY);
                await bookingPage.selectAddress('addr_sw1a_04');
                await bookingPage.goToStep2FromPostcode();
            });

            await test.step(
                'WHEN: User flags plasterboard = Yes without choosing a handling option',
                async () => {
                    await bookingPage.setWasteTypes({ heavy: false, plasterboard: true });
                },
            );

            await test.step(
                'THEN: 3 handling options are visible and Continue is disabled',
                async () => {
                    await expect(bookingPage.plasterboardOptions).toBeVisible();
                    await expect(page.getByTestId('plasterboard-option-bagged')).toBeVisible();
                    await expect(page.getByTestId('plasterboard-option-segregated')).toBeVisible();
                    await expect(page.getByTestId('plasterboard-option-collection')).toBeVisible();
                    await expect(bookingPage.wasteNextButton).toBeDisabled();
                },
            );

            await test.step(
                'WHEN: User picks the dedicated-collection handling option',
                async () => {
                    await bookingPage.setWasteTypes({
                        heavy: false,
                        plasterboard: true,
                        plasterboardOption: 'collection',
                    });
                    await expect(bookingPage.wasteNextButton).toBeEnabled();
                    await bookingPage.goToStep3FromWaste();
                },
            );

            await test.step('AND: User picks a 5-yard skip', async () => {
                await bookingPage.waitForSkipList();
                await bookingPage.selectSkip(chosenSkip);
                await bookingPage.goToStep4FromSkip();
            });

            await test.step(
                'THEN: Review summary shows plasterboard handling and collection fee',
                async () => {
                    await bookingPage.expectReviewSummary({
                        postcode: POSTCODES.HAPPY,
                        addressContains: 'Horse Guards Road',
                        heavy: false,
                        plasterboard: true,
                        skipSize: chosenSkip,
                    });
                    await expect(page.getByTestId('review-plasterboard-option')).toContainText(
                        /collection/i,
                    );
                    await expect(page.getByTestId('price-line-plasterboard')).toContainText(
                        `£${PLASTERBOARD_COLLECTION_FEE_GBP}`,
                    );
                    await expect(page.getByTestId('price-subtotal')).toContainText(
                        `£${subtotal}`,
                    );
                    await expect(page.getByTestId('price-vat')).toContainText(`£${vat}`);
                    await bookingPage.expectPriceTotal(total);
                },
            );

            await test.step('WHEN: User confirms the booking', async () => {
                const bookingId = await bookingPage.confirmBooking();
                expect(bookingId).toMatch(/^BK-\d{5}$/);
            });
        },
    );
});
