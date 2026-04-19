import { expect, test } from '../../fixtures/pom/test-options';
import {
    DEFAULT_DISABLED_SKIPS,
    DISABLED_REASONS,
    HEAVY_DISABLED_SKIPS,
    HEAVY_WASTE_SURCHARGE_GBP,
    POSTCODES,
    SKIP_PRICES_GBP,
    VAT_RATE,
} from '../../test-data/booking/booking';

/**
 * E2E — Heavy waste flow (branching skip-disabled logic + surcharge).
 *
 * Verifies the domain rule "heavy waste disables the two smallest skips"
 * and that the heavy-waste surcharge appears in the review price breakdown
 * before confirmation succeeds.
 */
test.describe('E2E — Heavy waste flow', () => {
    test.setTimeout(60_000);

    test(
        'Heavy waste disables 2-yard and 3-yard skips, surcharge applied on confirm',
        { tag: '@Booking-E2E' },
        async ({ bookingPage, page }) => {
            const chosenSkip = '6-yard' as const;
            const skipPrice = SKIP_PRICES_GBP[chosenSkip];
            const subtotal = skipPrice + HEAVY_WASTE_SURCHARGE_GBP;
            const vat = Math.round(subtotal * VAT_RATE);
            const total = subtotal + vat;

            await test.step('GIVEN: User has selected a SW1A 1AA address', async () => {
                await bookingPage.goto();
                await bookingPage.lookupPostcode(POSTCODES.HAPPY);
                await bookingPage.selectAddress('addr_sw1a_06');
                await bookingPage.goToStep2FromPostcode();
            });

            await test.step('WHEN: User flags heavy waste (no plasterboard)', async () => {
                await bookingPage.setWasteTypes({ heavy: true, plasterboard: false });
                await bookingPage.goToStep3FromWaste();
            });

            await test.step(
                "THEN: 2-yard and 3-yard skips are disabled with 'Not rated for heavy waste'",
                async () => {
                    await bookingPage.waitForSkipList();
                    for (const size of HEAVY_DISABLED_SKIPS) {
                        await bookingPage.expectSkipDisabled(size, DISABLED_REASONS.HEAVY_WASTE);
                    }
                },
            );

            await test.step(
                'AND: Area-disabled skips are still disabled with their original reason',
                async () => {
                    for (const size of DEFAULT_DISABLED_SKIPS) {
                        await bookingPage.expectSkipDisabled(size, DISABLED_REASONS.NOT_IN_AREA);
                    }
                },
            );

            await test.step(
                'AND: Continue is disabled until a non-disabled skip is chosen',
                async () => {
                    await expect(page.getByTestId('skip-next')).toBeDisabled();
                },
            );

            await test.step('WHEN: User selects a 6-yard skip', async () => {
                await bookingPage.selectSkip(chosenSkip);
                await bookingPage.goToStep4FromSkip();
            });

            await test.step(
                'THEN: Review summary and price breakdown include the heavy-waste surcharge',
                async () => {
                    await bookingPage.expectReviewSummary({
                        postcode: POSTCODES.HAPPY,
                        addressContains: 'Buckingham Palace',
                        heavy: true,
                        plasterboard: false,
                        skipSize: chosenSkip,
                    });
                    await expect(page.getByTestId('price-line-skip')).toContainText(
                        `£${skipPrice}`,
                    );
                    await expect(page.getByTestId('price-line-heavy')).toContainText(
                        `£${HEAVY_WASTE_SURCHARGE_GBP}`,
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
