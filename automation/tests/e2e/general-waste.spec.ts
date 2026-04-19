import { expect, test } from '../../fixtures/pom/test-options';
import {
    ADDRESS_COUNTS,
    ADDRESS_IDS,
    DEFAULT_DISABLED_SKIPS,
    DISABLED_REASONS,
    POSTCODES,
    SKIP_CATALOGUE_SIZE,
    SKIP_PRICES_GBP,
    VAT_RATE,
} from '../../test-data/booking/booking';

/**
 * E2E — General waste flow (happy path).
 *
 * Books a 4-yard skip for SW1A 1AA with no heavy waste and no plasterboard.
 * Asserts at every step: postcode → address list → waste → skip catalogue
 * → review summary → price breakdown → confirmation with a booking ID.
 */
test.describe('E2E — General waste flow', () => {
    test.setTimeout(60_000);

    test(
        'Books a 4-yard skip for SW1A 1AA end-to-end',
        { tag: '@Booking-E2E' },
        async ({ bookingPage, page }) => {
            await test.step('GIVEN: User is on the booking wizard', async () => {
                await bookingPage.goto();
                await bookingPage.expectStep(1);
            });

            await test.step('WHEN: User looks up a valid postcode', async () => {
                await bookingPage.lookupPostcode(POSTCODES.HAPPY);
            });

            await test.step('THEN: Address list shows 13 options for SW1A 1AA', async () => {
                await bookingPage.expectAddressResults(ADDRESS_COUNTS.SW1A);
            });

            await test.step('AND: Continue is disabled until an address is chosen', async () => {
                await expect(bookingPage.postcodeNextButton).toBeDisabled();
                await bookingPage.selectAddress(ADDRESS_IDS.SW1A_DOWNING_10);
                await expect(bookingPage.postcodeNextButton).toBeEnabled();
            });

            await test.step('WHEN: User advances to waste selection', async () => {
                await bookingPage.goToStep2FromPostcode();
            });

            await test.step('AND: User picks general waste only (no branching)', async () => {
                await bookingPage.setWasteTypes({ heavy: false, plasterboard: false });
                await bookingPage.goToStep3FromWaste();
            });

            await test.step(
                'THEN: 8 skips are listed, the two largest are disabled by area',
                async () => {
                    const list = await bookingPage.waitForSkipList();
                    await expect(list.locator('li')).toHaveCount(SKIP_CATALOGUE_SIZE);
                    for (const size of DEFAULT_DISABLED_SKIPS) {
                        await bookingPage.expectSkipDisabled(size, DISABLED_REASONS.NOT_IN_AREA);
                    }
                },
            );

            await test.step('WHEN: User picks a 4-yard skip', async () => {
                await bookingPage.selectSkip('4-yard');
                await bookingPage.goToStep4FromSkip();
            });

            await test.step('THEN: Review summary reflects the chosen options', async () => {
                await bookingPage.expectReviewSummary({
                    postcode: POSTCODES.HAPPY,
                    addressContains: '10 Downing Street',
                    heavy: false,
                    plasterboard: false,
                    skipSize: '4-yard',
                });
            });

            await test.step(
                'AND: Price breakdown shows skip + VAT with no surcharges',
                async () => {
                    const skipPrice = SKIP_PRICES_GBP['4-yard'];
                    const vat = Math.round(skipPrice * VAT_RATE);
                    const total = skipPrice + vat;

                    await expect(page.getByTestId('price-line-skip')).toContainText(
                        `£${skipPrice}`,
                    );
                    await expect(page.getByTestId('price-line-heavy')).toBeHidden();
                    await expect(page.getByTestId('price-line-plasterboard')).toBeHidden();
                    await expect(page.getByTestId('price-subtotal')).toContainText(
                        `£${skipPrice}`,
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
