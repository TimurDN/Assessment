import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
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

/**
 * Page Object Model for the 4-step booking wizard.
 *
 * Locator priority follows Playwright recommendations:
 *   1. `getByRole` / `getByLabel` / `getByText` for user-visible elements.
 *   2. `data-testid` only to disambiguate identical-role elements
 *      (address rows, skip cards, stepper circles, toggle buttons).
 *
 * Every public action method asserts its own outcome to remove the need
 * for callers to sprinkle `expect(...).toBeVisible()` between steps.
 */
export class BookingPage {
    constructor(private page: Page) {}

    // ─── Locators ─────────────────────────────────────────────────────

    get rootHeading(): Locator {
        return this.page.getByRole('heading', { name: 'Book a skip in four steps' });
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
    get postcodeError(): Locator {
        return this.page.getByTestId('postcode-error');
    }
    get postcodeRetryButton(): Locator {
        return this.postcodeError.getByRole('button', { name: 'Retry' });
    }
    get postcodeManualEntryButton(): Locator {
        return this.page.getByRole('button', { name: 'Enter address manually' });
    }
    get postcodeValidationError(): Locator {
        return this.page.getByTestId('postcode-validation-error');
    }
    get postcodeNextButton(): Locator {
        return this.page.getByTestId('postcode-next');
    }
    get wasteNextButton(): Locator {
        return this.page.getByTestId('waste-next');
    }
    get plasterboardOptions(): Locator {
        return this.page.getByTestId('plasterboard-options');
    }
    get skipList(): Locator {
        return this.page.getByTestId('skip-list');
    }
    get confirmBookingButton(): Locator {
        return this.page.getByRole('button', { name: 'Confirm booking' });
    }
    get bookingSuccess(): Locator {
        return this.page.getByTestId('booking-success');
    }
    get bookingId(): Locator {
        return this.page.getByTestId('booking-id');
    }

    // ─── Navigation ───────────────────────────────────────────────────

    /**
     * Navigate to the booking wizard and assert the root container rendered.
     * @returns Promise<void>
     */
    async goto(): Promise<void> {
        await this.page.goto('/');
        await expect(this.rootHeading).toBeVisible();
        await expect(this.wizard).toBeVisible();
    }

    /**
     * Assert the wizard is currently on a given step (1–4) — validates both
     * the visible step container and the stepper indicator state.
     * @param step Step index (1–4).
     * @returns Promise<void>
     */
    async expectStep(step: 1 | 2 | 3 | 4): Promise<void> {
        await expect(this.page.getByTestId(`wizard-step-${step}`)).toBeVisible();
        await expect(
            this.page.getByTestId(`stepper-step-${step}`),
        ).toHaveAttribute('data-state', 'current');
    }

    // ─── Step 1 · Postcode ────────────────────────────────────────────

    /**
     * Fill the postcode field and click Find address. Does not assert the
     * outcome — chain {@link expectAddressResults}, {@link expectEmptyPostcodeState},
     * or {@link expectLookupError}.
     * @param postcode UK postcode in any spacing/casing.
     * @returns Promise<void>
     */
    async lookupPostcode(postcode: string): Promise<void> {
        await this.postcodeInput.fill(postcode);
        await this.findAddressButton.click();
    }

    /**
     * Assert the address list rendered with the expected option count.
     * @param expectedCount Number of address rows expected.
     * @returns Promise<void>
     */
    async expectAddressResults(expectedCount: number): Promise<void> {
        await expect(this.addressList).toBeVisible({ timeout: UI_WAIT.lookup });
        await expect(this.addressList.locator('label')).toHaveCount(expectedCount);
    }

    /**
     * Assert the "no addresses found" empty state for an unknown postcode.
     * @returns Promise<void>
     */
    async expectEmptyPostcodeState(): Promise<void> {
        await expect(this.postcodeEmptyState).toBeVisible({ timeout: UI_WAIT.lookup });
        await expect(
            this.page.getByRole('heading', { name: /No addresses found/ }),
        ).toBeVisible();
    }

    /**
     * Assert the postcode lookup surfaced an error with a Retry button.
     * @returns Promise<void>
     */
    async expectLookupError(): Promise<void> {
        await expect(this.postcodeError).toBeVisible({ timeout: UI_WAIT.lookup });
        await expect(this.postcodeRetryButton).toBeVisible();
    }

    /**
     * Click Retry inside the postcode lookup error alert.
     * @returns Promise<void>
     */
    async retryPostcodeLookup(): Promise<void> {
        await this.postcodeRetryButton.click();
    }

    /**
     * Select an address by its fixture id (e.g. `addr_sw1a_01`) and assert the
     * radio row ends up selected.
     * @param addressId Fixture address id.
     * @returns Promise<void>
     */
    async selectAddress(addressId: string): Promise<void> {
        const row = this.page.getByTestId(`address-option-${addressId}`);
        await expect(row).toBeVisible();
        await row.click();
        await expect(row).toHaveAttribute('data-selected', 'true');
    }

    /**
     * Open the manual-address form, fill it, and submit. Asserts the saved
     * confirmation row is displayed afterwards.
     * @param line1 Address line 1.
     * @param city  City / town.
     * @returns Promise<void>
     */
    async enterManualAddress(line1: string, city: string): Promise<void> {
        await this.postcodeManualEntryButton.click();
        await expect(this.page.getByTestId('manual-address')).toBeVisible();
        await this.page.getByLabel('Address line 1').fill(line1);
        await this.page.getByLabel('City / Town').fill(city);
        await this.page.getByRole('button', { name: 'Use this address' }).click();
        await expect(this.page.getByTestId('manual-saved')).toContainText(line1);
    }

    /**
     * Click Continue on step 1 and assert the wizard advanced to step 2.
     * @returns Promise<void>
     */
    async goToStep2FromPostcode(): Promise<void> {
        await this.page
            .getByTestId('step-postcode')
            .getByRole('button', { name: 'Continue' })
            .click();
        await this.expectStep(2);
    }

    // ─── Step 2 · Waste types ─────────────────────────────────────────

    /**
     * Set heavy-waste + plasterboard toggles. When `plasterboard` is true the
     * branching UI is asserted visible; when false it must be hidden.
     * @param selection Heavy/plasterboard flags plus optional plasterboard handling.
     * @returns Promise<void>
     */
    async setWasteTypes(selection: WasteSelection): Promise<void> {
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

    /**
     * Click Continue on step 2 and assert the wizard advanced to step 3.
     * @returns Promise<void>
     */
    async goToStep3FromWaste(): Promise<void> {
        await this.page
            .getByTestId('step-waste')
            .getByRole('button', { name: 'Continue' })
            .click();
        await this.expectStep(3);
    }

    // ─── Step 3 · Skip selection ──────────────────────────────────────

    /**
     * Wait for the skip list to render and return its locator for further
     * assertions (count, visibility, etc.).
     * @returns Locator for the skip list.
     */
    async waitForSkipList(): Promise<Locator> {
        await expect(this.skipList).toBeVisible({ timeout: UI_WAIT.skipList });
        return this.skipList;
    }

    /**
     * Assert a given skip size is rendered disabled with the expected reason.
     * @param size   Skip size label.
     * @param reason Exact disabled-reason text.
     * @returns Promise<void>
     */
    async expectSkipDisabled(size: SkipSize, reason: string): Promise<void> {
        const option = this.page.getByTestId(`skip-option-${size}`);
        await expect(option).toHaveAttribute('data-disabled', 'true');
        await expect(option).toBeDisabled();
        await expect(
            this.page.getByTestId(`skip-disabled-reason-${size}`),
        ).toHaveText(reason);
    }

    /**
     * Select a (non-disabled) skip and assert it becomes the active choice.
     * @param size Skip size label.
     * @returns Promise<void>
     */
    async selectSkip(size: SkipSize): Promise<void> {
        const option = this.page.getByTestId(`skip-option-${size}`);
        await expect(option).toBeVisible();
        await expect(option).toBeEnabled();
        await option.click();
        await expect(option).toHaveAttribute('data-selected', 'true');
    }

    /**
     * Click Continue on step 3 and assert the wizard advanced to step 4.
     * @returns Promise<void>
     */
    async goToStep4FromSkip(): Promise<void> {
        await this.page
            .getByTestId('step-skip')
            .getByRole('button', { name: 'Continue' })
            .click();
        await this.expectStep(4);
    }

    // ─── Step 4 · Review + confirm ────────────────────────────────────

    /**
     * Assert the review summary matches the expected booking snapshot.
     * @param expected Expected field values on the review page.
     * @returns Promise<void>
     */
    async expectReviewSummary(expected: {
        postcode: string;
        addressContains: string;
        heavy: boolean;
        plasterboard: boolean;
        skipSize: SkipSize;
    }): Promise<void> {
        await expect(this.page.getByTestId('review-postcode')).toContainText(
            expected.postcode,
        );
        await expect(this.page.getByTestId('review-address')).toContainText(
            expected.addressContains,
        );
        await expect(this.page.getByTestId('review-heavy')).toContainText(
            expected.heavy ? 'Yes' : 'No',
        );
        await expect(this.page.getByTestId('review-plasterboard')).toContainText(
            expected.plasterboard ? 'Yes' : 'No',
        );
        await expect(this.page.getByTestId('review-skip')).toContainText(
            expected.skipSize,
        );
    }

    /**
     * Assert the price breakdown total equals the expected GBP integer.
     * @param expected Expected total (GBP integer).
     * @returns Promise<void>
     */
    async expectPriceTotal(expected: number): Promise<void> {
        await expect(this.page.getByTestId('price-breakdown')).toBeVisible();
        await expect(this.page.getByTestId('price-total')).toContainText(
            `£${expected}`,
        );
    }

    /**
     * Click Confirm booking, wait for the success view, and return the parsed
     * booking ID (validated against {@link BookingIdSchema}).
     * @returns Booking reference (`BK-xxxxx`).
     */
    async confirmBooking(): Promise<string> {
        await this.confirmBookingButton.click();
        await expect(this.bookingSuccess).toBeVisible({ timeout: UI_WAIT.confirm });
        const raw = (await this.bookingId.innerText()).trim();
        return BookingIdSchema.parse(raw);
    }
}
