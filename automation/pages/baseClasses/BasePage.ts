import { Page, Locator, expect } from '@playwright/test';

/**
 * Base class for Page Object Models in the booking-flow suite.
 *
 * Every page exposes an abstract `open()`, and the base provides
 * shared loading-state / toast / navigation utilities so child
 * pages don't have to reimplement them.
 *
 * Specs never instantiate this class directly — they use one of the
 * concrete Page Object fixtures (e.g. `bookingPage`) exposed through
 * `fixtures/pom/page-object-fixture.ts`.
 */
export abstract class BasePage {
    constructor(protected page: Page) {}

    /**
     * Navigate to the page's canonical URL and wait for it to finish
     * bootstrapping. Each concrete POM decides what "loaded" means.
     */
    abstract open(): Promise<void>;

    get loadingSpinner(): Locator {
        return this.page.getByTestId('loading-spinner');
    }

    get toastNotification(): Locator {
        return this.page.getByTestId('toast-notification');
    }

    /**
     * Wait for the global loading spinner to leave the DOM/viewport.
     * No-op if the spinner never renders for the current surface.
     */
    async waitForPageLoad(): Promise<void> {
        await this.loadingSpinner
            .waitFor({ state: 'hidden', timeout: 30_000 })
            .catch(() => undefined);
    }

    /**
     * Block until a response matching `urlPattern` and `method` is
     * observed on the network. Useful when a UI action fans out to
     * an API request whose completion gates the next step.
     */
    async waitForApiResponse(
        urlPattern: string | RegExp,
        method: string = 'GET',
    ): Promise<void> {
        await this.page.waitForResponse(
            (response) =>
                (typeof urlPattern === 'string'
                    ? response.url().includes(urlPattern)
                    : urlPattern.test(response.url())) &&
                response.request().method() === method,
        );
    }

    /**
     * Assert that a success toast appeared, optionally containing the
     * given text substring.
     */
    async verifySuccessToast(message?: string): Promise<void> {
        const toast = this.page.getByTestId('toast-success');
        await expect(toast).toBeVisible();
        if (message) {
            await expect(toast).toContainText(message);
        }
    }

    async getCurrentUrl(): Promise<string> {
        return this.page.url();
    }

    async getPageTitle(): Promise<string> {
        return this.page.title();
    }

    async refresh(): Promise<void> {
        await this.page.reload();
    }
}
