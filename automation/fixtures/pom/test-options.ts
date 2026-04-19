import { test as base, mergeTests, request } from '@playwright/test';
import { test as pageObjectFixture } from './page-object-fixture';
import { test as apiRequestFixture } from '../api/api-request-fixture';

/**
 * Composite `test` used throughout the suite. Merges:
 *   - `pageObjectFixture`: provides POM instances (`bookingPage`, …)
 *   - `apiRequestFixture`: provides typed `apiRequest<T>` helper
 *
 * Import this file — never `@playwright/test` directly — from any spec so
 * fixtures are consistent across UI, functional, and API tests.
 */
const test = mergeTests(pageObjectFixture, apiRequestFixture);

const expect = base.expect;
export { test, expect, request };
