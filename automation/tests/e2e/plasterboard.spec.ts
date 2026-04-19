import { expect, test } from '../../fixtures/pom/test-options';
import bookingData from '../../test-data/booking/booking.json';

const MS = {
    page: 15_000,
    toast: 10_000,
    button: 20_000,
    grid: 15_000,
} as const;

// ═══════════════════════════════════════════════════════════════
// E2E — Plasterboard branching flow
// ═══════════════════════════════════════════════════════════════

test.describe('E2E — Plasterboard branching flow', () => {
    test.setTimeout(300_000);

    test(
        'Plasterboard=Yes reveals 3 options and the collection fee reaches confirm',
        { tag: '@App-E2E' },
        async ({ page, bookingPage }) => {
            const chosenSkip = '5-yard' as const;
            const skipPrice = bookingData.skipPricesGBP[chosenSkip];
            const collectionFee = bookingData.plasterboardCollectionFeeGBP;

            await test.step(
                'GIVEN: User has selected a SW1A 1AA address and advanced to waste',
                async () => {
                    await bookingPage.open();
                    await bookingPage.verifyPageLoaded();
                    await bookingPage.enterPostcode(bookingData.postcodes.HAPPY);
                    await bookingPage.verifyAddressListPopulated(
                        bookingData.addressCounts.SW1A,
                    );
                    await bookingPage.selectAddress('addr_sw1a_04');
                    await bookingPage.clickContinueFromStep1();
                },
            );

            await test.step(
                'WHEN: User flags plasterboard=Yes without choosing a handling option',
                async () => {
                    await bookingPage.selectWasteTypes({
                        heavy: false,
                        plasterboard: true,
                    });
                },
            );

            await test.step(
                'THEN: 3 handling options are visible and Continue is disabled',
                async () => {
                    await expect(bookingPage.plasterboardOptions).toBeVisible({
                        timeout: MS.page,
                    });
                    for (const option of ['bagged', 'segregated', 'collection']) {
                        await expect(
                            page.getByTestId(`plasterboard-option-${option}`),
                        ).toBeVisible();
                    }
                    await expect(page.getByTestId('waste-next')).toBeDisabled({
                        timeout: MS.button,
                    });
                },
            );

            await test.step(
                'WHEN: User picks the dedicated-collection handling option',
                async () => {
                    await bookingPage.selectWasteTypes({
                        heavy: false,
                        plasterboard: true,
                        plasterboardOption: 'collection',
                    });
                    await expect(page.getByTestId('waste-next')).toBeEnabled({
                        timeout: MS.button,
                    });
                    await bookingPage.clickContinueFromStep2();
                },
            );

            await test.step(`AND: User picks the ${chosenSkip}`, async () => {
                await bookingPage.verifySkipsListed(bookingData.skipCatalogueSize);
                await bookingPage.selectSkip(chosenSkip);
                await bookingPage.clickContinueFromStep3();
            });

            await test.step(
                'THEN: Review summary shows plasterboard handling and the collection fee',
                async () => {
                    await bookingPage.verifyReviewSummary({
                        postcode: bookingData.postcodes.HAPPY,
                        addressContains: 'Horse Guards Road',
                        heavy: false,
                        plasterboard: true,
                        skipSize: chosenSkip,
                    });
                    await expect(
                        page.getByTestId('review-plasterboard-option'),
                    ).toContainText(/collection/i);
                    await expect(
                        page.getByTestId('price-line-plasterboard'),
                    ).toContainText(`£${collectionFee}`);
                    await expect(page.getByTestId('price-subtotal')).toContainText(
                        `£${skipPrice + collectionFee}`,
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
