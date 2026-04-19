import { expect, test } from '../../fixtures/pom/test-options';
import bookingData from '../../test-data/booking/booking.json';

const MS = {
    page: 15_000,
    toast: 10_000,
    button: 20_000,
    grid: 15_000,
} as const;

// ═══════════════════════════════════════════════════════════════
// E2E — General waste booking flow (happy path)
// ═══════════════════════════════════════════════════════════════

test.describe('E2E — General waste booking flow', () => {
    test.setTimeout(300_000);

    test(
        'Book a 6-yard skip for general waste end-to-end',
        { tag: '@App-E2E' },
        async ({ page, bookingPage }) => {
            const chosenSkip = '6-yard' as const;
            const skipPrice = bookingData.skipPricesGBP[chosenSkip];

            await test.step('GIVEN: User is on the booking homepage', async () => {
                await bookingPage.open();
                await bookingPage.verifyPageLoaded();
                await bookingPage.verifyStep(1);
            });

            await test.step(
                `WHEN: User looks up postcode ${bookingData.postcodes.HAPPY} and selects 10 Downing Street`,
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

            await test.step(
                'AND: User selects general waste (no heavy, no plasterboard)',
                async () => {
                    await bookingPage.selectWasteTypes({
                        heavy: false,
                        plasterboard: false,
                    });
                    await bookingPage.clickContinueFromStep2();
                },
            );

            await test.step(
                `THEN: The skip catalogue renders with the two largest disabled`,
                async () => {
                    await bookingPage.verifySkipsListed(bookingData.skipCatalogueSize);
                    for (const size of bookingData.defaultDisabledSkips) {
                        await bookingPage.verifySkipDisabled(
                            size,
                            bookingData.disabledReasons.NOT_IN_AREA,
                        );
                    }
                },
            );

            await test.step(`WHEN: User picks the ${chosenSkip}`, async () => {
                await bookingPage.selectSkip(chosenSkip);
                await bookingPage.clickContinueFromStep3();
            });

            await test.step(
                'THEN: Review summary reflects the chosen options',
                async () => {
                    await bookingPage.verifyReviewSummary({
                        postcode: bookingData.postcodes.HAPPY,
                        addressContains: '10 Downing Street',
                        heavy: false,
                        plasterboard: false,
                        skipSize: chosenSkip,
                    });
                },
            );

            await test.step(
                'AND: Price breakdown shows the skip price with no surcharges',
                async () => {
                    await expect(page.getByTestId('price-line-skip')).toContainText(
                        `£${skipPrice}`,
                        { timeout: MS.page },
                    );
                    await expect(page.getByTestId('price-line-heavy')).toBeHidden();
                    await expect(
                        page.getByTestId('price-line-plasterboard'),
                    ).toBeHidden();
                    await expect(page.getByTestId('price-subtotal')).toContainText(
                        `£${skipPrice}`,
                    );
                },
            );

            await test.step('WHEN: User confirms the booking', async () => {
                const bookingId = await bookingPage.confirmBooking();
                expect(bookingId).toMatch(/^BK-\d{5}$/);
            });

            await test.step(
                'THEN: Booking success screen renders with a BK-##### id',
                async () => {
                    await bookingPage.verifyBookingSuccess();
                },
            );
        },
    );
});
