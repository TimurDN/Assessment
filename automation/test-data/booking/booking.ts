/**
 * Deterministic test-data mirroring the UI fixture contract in
 * `ui/src/lib/fixtures.ts`. Keep the two files in lock-step — when the app
 * fixtures change, update this file too so specs stay aligned with reality.
 */

import type { SkipSize } from '../../fixtures/api/schemas/booking/skips';

export const POSTCODES = {
    HAPPY: 'SW1A 1AA',
    EMPTY: 'EC1A 1BB',
    SLOW: 'M1 1AE',
    RETRY: 'BS1 4DJ',
} as const;

export const ADDRESS_COUNTS = {
    SW1A: 13,
    EC1A: 0,
    M1: 12,
    BS1: 6,
} as const;

export const ADDRESS_IDS = {
    SW1A_DOWNING_10: 'addr_sw1a_01',
    SW1A_DOWNING_11: 'addr_sw1a_02',
    SW1A_DOWNING_12: 'addr_sw1a_03',
} as const;

export const SKIP_CATALOGUE_SIZE = 8;

export const DEFAULT_DISABLED_SKIPS: readonly SkipSize[] = ['10-yard', '12-yard'];
export const HEAVY_DISABLED_SKIPS: readonly SkipSize[] = ['2-yard', '3-yard'];

export const SKIP_PRICES_GBP: Record<SkipSize, number> = {
    '2-yard': 90,
    '3-yard': 110,
    '4-yard': 140,
    '5-yard': 170,
    '6-yard': 200,
    '8-yard': 240,
    '10-yard': 290,
    '12-yard': 340,
};

export const DISABLED_REASONS = {
    NOT_IN_AREA: 'Not available in your area',
    HEAVY_WASTE: 'Not rated for heavy waste',
    PLASTERBOARD_TOO_SMALL: 'Too small for segregated plasterboard',
} as const;

export const VAT_RATE = 0.2;
export const HEAVY_WASTE_SURCHARGE_GBP = 25;
export const PLASTERBOARD_COLLECTION_FEE_GBP = 35;
