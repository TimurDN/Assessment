import { expect, test } from '../../fixtures/pom/test-options';
import bookingData from '../../test-data/booking/booking.json';

const MS = {
    page: 15_000,
    toast: 10_000,
    button: 20_000,
    grid: 15_000,
} as const;

// ═══════════════════════════════════════════════════════════════
// E2E — Heavy waste branching flow
// ═══════════════════════════════════════════════════════════════

test.describe('E2E — Heavy waste booking flow', () => {
    test.setTimeout(300_000);

    test(
        'Heavy waste disables the 2- and 3-yard skips and surcharges the review',
        { tag: '@App-E2E' },
        async ({ page, bookingPage }) => {
            const chosenSkip = '6-yard' as const;
            const skipPrice = bookingData.skipPricesGBP[chosenSkip];
            const heavySurcharge = bookingData.heavyWasteSurchargeGBP;

            await test.step(
                'GIVEN: User has selected a SW1A 1AA address and advanced to waste',
                async () => {
                    await bookingPage.open();
                    await bookingPage.verifyPageLoaded();
                    await bookingPage.enterPostcode(bookingData.postcodes.HAPPY);
                    await bookingPage.verifyAddressListPopulated(
                        bookingData.addressCounts.SW1A,
                    );
                    await bookingPage.selectAddress('addr_sw1a_06');
                    await bookingPage.clickContinueFromStep1();
                },
            );

            await test.step(
                'WHEN: User flags heavy waste (no plasterboard)',
                async () => {
                    await bookingPage.selectWasteTypes({
                        heavy: true,
                        plasterboard: false,
                    });
                    await bookingPage.clickContinueFromStep2();
                },
            );

            await test.step(
                'THEN: 2-yard and 3-yard skips are disabled with the heavy-waste reason',
                async () => {
                    await bookingPage.verifySkipsListed(bookingData.skipCatalogueSize);
                    for (const size of bookingData.heavyDisabledSkips) {
                        await bookingPage.verifySkipDisabled(
                            size,
                            bookingData.disabledReasons.HEAVY_WASTE,
                        );
                    }
                },
            );

            await test.step(
                'AND: Area-disabled skips still carry their original reason',
                async () => {
                    for (const size of bookingData.defaultDisabledSkips) {
                        await bookingPage.verifySkipDisabled(
                            size,
                            bookingData.disabledReasons.NOT_IN_AREA,
                        );
                    }
                },
            );

            await test.step(
                'AND: Continue stays disabled until a non-disabled skip is chosen',
                async () => {
                    await expect(page.getByTestId('skip-next')).toBeDisabled({
                        timeout: MS.button,
                    });
                },
            );

            await test.step(`WHEN: User picks the ${chosenSkip}`, async () => {
                await bookingPage.selectSkip(chosenSkip);
                await bookingPage.clickContinueFromStep3();
            });

            await test.step(
                'THEN: Review summary and price breakdown include the heavy-waste surcharge',
                async () => {
                    await bookingPage.verifyReviewSummary({
                        postcode: bookingData.postcodes.HAPPY,
                        addressContains: 'Buckingham Palace',
                        heavy: true,
                        plasterboard: false,
                        skipSize: chosenSkip,
                    });
                    await expect(page.getByTestId('price-line-skip')).toContainText(
                        `£${skipPrice}`,
                    );
                    await expect(page.getByTestId('price-line-heavy')).toContainText(
                        `£${heavySurcharge}`,
                    );
                    await expect(page.getByTestId('price-subtotal')).toContainText(
                        `£${skipPrice + heavySurcharge}`,
                    );
                },
            );

            await test.step('WHEN: User confirms the booking', async () => {
                const bookingId = await bookingPage.confirmBooking();
                expect(bookingId).toMatch(/^BK-\d{5}$/);
            });

            await test.step(
                'THEN: Booking success screen renders',
                async () => {
                    await bookingPage.verifyBookingSuccess();
                },
            );
        },
    );
});
