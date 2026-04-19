import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './baseClasses/BasePage';
import { bookingConfig } from '../config/booking';
import type { SkipSize } from '../fixtures/api/schemas/booking/skips';
import type { PlasterboardOption } from '../fixtures/api/schemas/booking/waste-types';
import { BookingIdSchema } from '../fixtures/api/schemas/util/common';

/**
 * Wait-time budgets for UI assertions. Loose enough for the `M1 1AE`
 * simulated-latency fixture (~1200 ms) but tight enough to catch regressions.
 */
const UI_WAIT = {
    lookup: 5_000,
    skipList: 5_000,
    confirm: 5_000,
} as const;

export type WasteSelection = {
    heavy: boolean;
    plasterboard: boolean;
    plasterboardOption?: PlasterboardOption;
};

export type ReviewSummary = {
    postcode: string;
    addressContains?: string;
    heavy?: boolean;
    plasterboard?: boolean;
    skipSize?: SkipSize;
    totalGBP?: number;
};

/**
 * Page Object Model for the 4-step booking wizard.
 *
 * Extends {@link BasePage}: every page implements {@link open},
 * and shared loading / navigation utilities come from the base.
 *
 * Locator priority follows Playwright recommendations:
 *   1. `getByRole` / `getByLabel` / `getByText` for user-visible elements.
 *   2. `data-testid` only to disambiguate identical-role elements
 *      (address rows, skip cards, stepper circles, toggle buttons).
 *
 * Public methods are grouped by step and by concern:
 *   - Navigation           (`open`)
 *   - Step 1 · Postcode    (`enterPostcode`, `selectAddress`, …)
 *   - Step 2 · Waste       (`selectWasteTypes`, …)
 *   - Step 3 · Skip        (`selectSkip`, …)
 *   - Step 4 · Review      (`confirmBooking`, …)
 *   - Verification helpers (`verifyPageLoaded`, `verifyReviewSummary`, …)
 *
 * `verify*` methods embed `expect(...)` so spec bodies can describe
 * intent rather than wiring raw locators.
 */
export class BookingPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // ───────────────────────────────────────────────────────────────
    // Locators
    // ───────────────────────────────────────────────────────────────

    get rootHeading(): Locator {
        return this.page.getByRole('heading', {
            name: 'Book a skip in four easy steps',
        });
    }
    get wizard(): Locator {
        return this.page.getByTestId('wizard');
    }
    get postcodeInput(): Locator {
        return this.page.getByLabel('Postcode');
    }
    get findAddressButton(): Locator {
        return this.page.getByRole('button', { name: 'Find address' });
    }
    get addressList(): Locator {
        return this.page.getByTestId('address-list');
    }
    get postcodeEmptyState(): Locator {
        return this.page.getByTestId('postcode-empty');
    }
    get postcodeServerError(): Locator {
        return this.page.getByTestId('postcode-error');
    }
    get postcodeClientError(): Locator {
        return this.page.getByTestId('postcode-validation-error');
    }
    get postcodeRetryButton(): Locator {
        return this.postcodeServerError.getByRole('button', { name: 'Retry' });
    }
    get postcodeManualEntryButton(): Locator {
        return this.page.getByRole('button', { name: 'Enter address manually' });
    }
    get plasterboardOptions(): Locator {
        return this.page.getByTestId('plasterboard-options');
    }
    get skipList(): Locator {
        return this.page.getByTestId('skip-list');
    }
    get priceBreakdown(): Locator {
        return this.page.getByTestId('price-breakdown');
    }
    get confirmBookingButton(): Locator {
        return this.page.getByRole('button', { name: 'Confirm booking' });
    }
    get bookingSuccess(): Locator {
        return this.page.getByTestId('booking-success');
    }
    get bookingIdLocator(): Locator {
        return this.page.getByTestId('booking-id');
    }

    /** Parameterised locator for a single address radio row by fixture id. */
    addressOption(addressId: string): Locator {
        return this.page.getByTestId(`address-option-${addressId}`);
    }

    /** Parameterised locator for a skip card by size label. */
    skipCard(size: SkipSize): Locator {
        return this.page.getByTestId(`skip-option-${size}`);
    }

    /** Parameterised locator for a single stepper circle. */
    stepperStep(step: 1 | 2 | 3 | 4): Locator {
        return this.page.getByTestId(`stepper-step-${step}`);
    }

    // ───────────────────────────────────────────────────────────────
    // Navigation
    // ───────────────────────────────────────────────────────────────

    /**
     * Navigate to the booking flow home page and wait for the wizard
     * card to finish rendering.
     */
    async open(): Promise<void> {
        await this.page.goto(bookingConfig.paths.HOME);
        await expect(this.rootHeading).toBeVisible();
        await expect(this.wizard).toBeVisible();
    }

    // ───────────────────────────────────────────────────────────────
    // Step 1 · Postcode
    // ───────────────────────────────────────────────────────────────

    /**
     * Fill the postcode input and click *Find address*. Does not assert
     * the outcome — follow up with a `verify*` method.
     *
     * @param postcode UK postcode in any spacing/casing.
     */
    async enterPostcode(postcode: string): Promise<void> {
        await this.postcodeInput.fill(postcode);
        await this.findAddressButton.click();
    }

    /** Clear the postcode input without triggering a lookup. */
    async clearPostcode(): Promise<void> {
        await this.postcodeInput.fill('');
    }

    /**
     * Select an address by its fixture id and assert the radio row ends
     * up selected.
     *
     * @param addressId Fixture address id (e.g. `addr_sw1a_01`).
     */
    async selectAddress(addressId: string): Promise<void> {
        const row = this.addressOption(addressId);
        await expect(row).toBeVisible();
        await row.click();
        await expect(row).toHaveAttribute('data-selected', 'true');
    }

    /** Select the first address in the list (whatever its id is). */
    async selectFirstAddress(): Promise<void> {
        const first = this.addressList.locator('label').first();
        await expect(first).toBeVisible();
        await first.click();
    }

    /**
     * Open the manual-address form, fill it, and submit. Asserts the saved
     * confirmation row is displayed afterwards.
     */
    async enterManualAddress(line1: string, city: string): Promise<void> {
        await this.postcodeManualEntryButton.click();
        await expect(this.page.getByTestId('manual-address')).toBeVisible();
        await this.page.getByLabel('Address line 1').fill(line1);
        await this.page.getByLabel('City / Town').fill(city);
        await this.page.getByRole('button', { name: 'Use this address' }).click();
        await expect(this.page.getByTestId('manual-saved')).toContainText(line1);
    }

    /** Click the *Retry* button inside the postcode lookup error alert. */
    async retryPostcodeLookup(): Promise<void> {
        await this.postcodeRetryButton.click();
    }

    /** Click Continue on step 1 and assert the wizard advanced to step 2. */
    async clickContinueFromStep1(): Promise<void> {
        await this.page
            .getByTestId('step-postcode')
            .getByRole('button', { name: 'Continue' })
            .click();
        await this.verifyStep(2);
    }

    // ───────────────────────────────────────────────────────────────
    // Step 2 · Waste types
    // ───────────────────────────────────────────────────────────────

    /**
     * Set the heavy-waste and plasterboard toggles. When `plasterboard`
     * is true, the branching options container is asserted visible;
     * when false it must be hidden.
     */
    async selectWasteTypes(selection: WasteSelection): Promise<void> {
        await this.page
            .getByTestId(selection.heavy ? 'heavy-waste-yes' : 'heavy-waste-no')
            .click();
        await this.page
            .getByTestId(
                selection.plasterboard ? 'plasterboard-yes' : 'plasterboard-no',
            )
            .click();

        if (selection.plasterboard) {
            await expect(this.plasterboardOptions).toBeVisible();
            if (selection.plasterboardOption) {
                const option = this.page.getByTestId(
                    `plasterboard-option-${selection.plasterboardOption}`,
                );
                await option.click();
                await expect(option).toHaveAttribute('data-selected', 'true');
            }
        } else {
            await expect(this.plasterboardOptions).toBeHidden();
        }
    }

    /** Click Continue on step 2 and assert the wizard advanced to step 3. */
    async clickContinueFromStep2(): Promise<void> {
        await this.page
            .getByTestId('step-waste')
            .getByRole('button', { name: 'Continue' })
            .click();
        await this.verifyStep(3);
    }

    // ───────────────────────────────────────────────────────────────
    // Step 3 · Skip selection
    // ───────────────────────────────────────────────────────────────

    /**
     * Select a (non-disabled) skip and assert it becomes the active choice.
     */
    async selectSkip(size: SkipSize): Promise<void> {
        const option = this.skipCard(size);
        await expect(option).toBeVisible();
        await expect(option).toBeEnabled();
        await option.click();
        await expect(option).toHaveAttribute('data-selected', 'true');
    }

    /** Click Continue on step 3 and assert the wizard advanced to step 4. */
    async clickContinueFromStep3(): Promise<void> {
        await this.page
            .getByTestId('step-skip')
            .getByRole('button', { name: 'Continue' })
            .click();
        await this.verifyStep(4);
    }

    // ───────────────────────────────────────────────────────────────
    // Step 4 · Review + confirm
    // ───────────────────────────────────────────────────────────────

    /**
     * Click Confirm booking and wait for the success view. Returns the
     * parsed booking ID (validated against {@link BookingIdSchema}).
     */
    async confirmBooking(): Promise<string> {
        await this.confirmBookingButton.click();
        await expect(this.bookingSuccess).toBeVisible({
            timeout: UI_WAIT.confirm,
        });
        const raw = (await this.bookingIdLocator.innerText()).trim();
        return BookingIdSchema.parse(raw);
    }

    // ───────────────────────────────────────────────────────────────
    // Verification helpers
    // ───────────────────────────────────────────────────────────────

    /** Assert the booking homepage has finished rendering. */
    async verifyPageLoaded(): Promise<void> {
        await expect(this.rootHeading).toBeVisible();
        await expect(this.wizard).toBeVisible();
        await this.waitForPageLoad();
    }

    /**
     * Assert the wizard is on the given step — validates both the step
     * container and the stepper indicator state.
     */
    async verifyStep(step: 1 | 2 | 3 | 4): Promise<void> {
        await expect(this.page.getByTestId(`wizard-step-${step}`)).toBeVisible();
        await expect(this.stepperStep(step)).toHaveAttribute(
            'data-state',
            'current',
        );
    }

    /**
     * Assert the address list rendered. When `expectedCount` is given,
     * asserts the exact row count.
     */
    async verifyAddressListPopulated(expectedCount?: number): Promise<void> {
        await expect(this.addressList).toBeVisible({ timeout: UI_WAIT.lookup });
        if (expectedCount !== undefined) {
            await expect(this.addressList.locator('label')).toHaveCount(
                expectedCount,
            );
        }
    }

    /** Assert the "no addresses found" empty-state block is visible. */
    async verifyEmptyPostcodeState(): Promise<void> {
        await expect(this.postcodeEmptyState).toBeVisible({
            timeout: UI_WAIT.lookup,
        });
        await expect(
            this.page.getByRole('heading', { name: /No addresses found/ }),
        ).toBeVisible();
    }

    /**
     * Assert an inline client-side postcode validation error is shown.
     * (Use {@link verifyPostcodeServerError} for the API-surfaced alert.)
     */
    async verifyPostcodeClientError(): Promise<void> {
        await expect(this.postcodeClientError).toBeVisible({
            timeout: UI_WAIT.lookup,
        });
    }

    /**
     * Assert the postcode lookup surfaced a server-side error alert with a
     * Retry button (used for the BS1 4DJ fixture and for 500 responses).
     */
    async verifyPostcodeServerError(): Promise<void> {
        await expect(this.postcodeServerError).toBeVisible({
            timeout: UI_WAIT.lookup,
        });
        await expect(this.postcodeRetryButton).toBeVisible();
    }

    /**
     * Assert *any* postcode error surfaced — client-side or server-side.
     * Useful for functional tests that only care that the input was
     * rejected, not which layer rejected it.
     */
    async verifyAnyPostcodeError(): Promise<void> {
        const clientError = this.postcodeClientError;
        const serverError = this.postcodeServerError;
        await expect(clientError.or(serverError)).toBeVisible({
            timeout: UI_WAIT.lookup,
        });
    }

    /**
     * Assert a given skip size is rendered disabled and carries the
     * expected reason text.
     */
    async verifySkipDisabled(size: SkipSize, reason: string): Promise<void> {
        const option = this.skipCard(size);
        await expect(option).toHaveAttribute('data-disabled', 'true');
        await expect(option).toBeDisabled();
        await expect(
            this.page.getByTestId(`skip-disabled-reason-${size}`),
        ).toHaveText(reason);
    }

    /** Assert the skip list rendered with the expected number of cards. */
    async verifySkipsListed(expectedCount: number): Promise<void> {
        await expect(this.skipList).toBeVisible({ timeout: UI_WAIT.skipList });
        await expect(
            this.skipList.getByRole('button'),
        ).toHaveCount(expectedCount);
    }

    /**
     * Assert the review summary matches the expected booking snapshot.
     * Any field left `undefined` is skipped.
     */
    async verifyReviewSummary(expected: ReviewSummary): Promise<void> {
        if (expected.postcode) {
            await expect(this.page.getByTestId('review-postcode')).toContainText(
                expected.postcode,
            );
        }
        if (expected.addressContains) {
            await expect(this.page.getByTestId('review-address')).toContainText(
                expected.addressContains,
            );
        }
        if (expected.heavy !== undefined) {
            await expect(this.page.getByTestId('review-heavy')).toContainText(
                expected.heavy ? 'Yes' : 'No',
            );
        }
        if (expected.plasterboard !== undefined) {
            await expect(
                this.page.getByTestId('review-plasterboard'),
            ).toContainText(expected.plasterboard ? 'Yes' : 'No');
        }
        if (expected.skipSize) {
            await expect(this.page.getByTestId('review-skip')).toContainText(
                expected.skipSize,
            );
        }
        if (expected.totalGBP !== undefined) {
            await this.verifyPriceTotal(expected.totalGBP);
        }
    }

    /** Assert the price breakdown total equals the expected GBP integer. */
    async verifyPriceTotal(expectedGBP: number): Promise<void> {
        await expect(this.priceBreakdown).toBeVisible();
        await expect(this.page.getByTestId('price-total')).toContainText(
            `£${expectedGBP}`,
        );
    }

    /**
     * Assert the booking success view rendered and the booking reference
     * has the canonical `BK-#####` shape.
     */
    async verifyBookingSuccess(): Promise<string> {
        await expect(this.bookingSuccess).toBeVisible({
            timeout: UI_WAIT.confirm,
        });
        const raw = (await this.bookingIdLocator.innerText()).trim();
        return BookingIdSchema.parse(raw);
    }
}
