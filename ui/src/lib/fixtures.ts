/**
 * Deterministic fixtures for the booking flow.
 *
 * Kept in a single module so every API route, test, and doc can reason about
 * the exact same data. No DB, no external calls — responses are 100% seeded.
 *
 * Fixture contract (mandated by the assessment):
 *   SW1A 1AA → 12+ addresses (happy path).
 *   EC1A 1BB → 0 addresses (empty state).
 *   M1 1AE   → simulated latency (~1200 ms) then 12 addresses.
 *   BS1 4DJ  → 500 on first call, success on retry.
 *   heavyWaste=true → disables ≥ 2 skip sizes.
 */

export type Address = {
  id: string;
  line1: string;
  city: string;
};

export type Skip = {
  size: string;          // e.g. "4-yard"
  price: number;         // GBP, integer
  disabled: boolean;
  disabledReason?: string;
};

export const POSTCODE_REGEX =
  /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/i;

/** Normalize a UK postcode to the canonical "AREA SECTOR" form, uppercased. */
export function normalizePostcode(input: string): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().toUpperCase().replace(/\s+/g, " ");
  const match = trimmed.replace(/\s+/g, "").match(POSTCODE_REGEX);
  if (!match) return null;
  return `${match[1]} ${match[2]}`;
}

/** Same postcode, but collapsed — "SW1A1AA" — used as a lookup key. */
export function keyPostcode(input: string): string | null {
  const n = normalizePostcode(input);
  return n ? n.replace(/\s+/g, "") : null;
}

const SW1A_ADDRESSES: Address[] = [
  { id: "addr_sw1a_01", line1: "10 Downing Street", city: "London" },
  { id: "addr_sw1a_02", line1: "11 Downing Street", city: "London" },
  { id: "addr_sw1a_03", line1: "12 Downing Street", city: "London" },
  { id: "addr_sw1a_04", line1: "1 Horse Guards Road", city: "London" },
  { id: "addr_sw1a_05", line1: "2 Horse Guards Road", city: "London" },
  { id: "addr_sw1a_06", line1: "Buckingham Palace", city: "London" },
  { id: "addr_sw1a_07", line1: "Westminster Abbey", city: "London" },
  { id: "addr_sw1a_08", line1: "Parliament Square", city: "London" },
  { id: "addr_sw1a_09", line1: "King Charles Street", city: "London" },
  { id: "addr_sw1a_10", line1: "Whitehall Court", city: "London" },
  { id: "addr_sw1a_11", line1: "Richmond Terrace", city: "London" },
  { id: "addr_sw1a_12", line1: "Great George Street", city: "London" },
  { id: "addr_sw1a_13", line1: "Birdcage Walk", city: "London" },
];

const M1_ADDRESSES: Address[] = [
  { id: "addr_m1_01", line1: "1 Piccadilly", city: "Manchester" },
  { id: "addr_m1_02", line1: "2 Piccadilly Gardens", city: "Manchester" },
  { id: "addr_m1_03", line1: "3 Oldham Street", city: "Manchester" },
  { id: "addr_m1_04", line1: "10 Newton Street", city: "Manchester" },
  { id: "addr_m1_05", line1: "22 Tib Street", city: "Manchester" },
  { id: "addr_m1_06", line1: "5 Stevenson Square", city: "Manchester" },
  { id: "addr_m1_07", line1: "8 Lever Street", city: "Manchester" },
  { id: "addr_m1_08", line1: "14 Dale Street", city: "Manchester" },
  { id: "addr_m1_09", line1: "18 Port Street", city: "Manchester" },
  { id: "addr_m1_10", line1: "27 Church Street", city: "Manchester" },
  { id: "addr_m1_11", line1: "33 Hilton Street", city: "Manchester" },
  { id: "addr_m1_12", line1: "41 High Street", city: "Manchester" },
];

const BS1_ADDRESSES: Address[] = [
  { id: "addr_bs1_01", line1: "Bristol Temple Meads", city: "Bristol" },
  { id: "addr_bs1_02", line1: "12 Victoria Street", city: "Bristol" },
  { id: "addr_bs1_03", line1: "9 Redcliff Street", city: "Bristol" },
  { id: "addr_bs1_04", line1: "1 Queen Square", city: "Bristol" },
  { id: "addr_bs1_05", line1: "22 Baldwin Street", city: "Bristol" },
  { id: "addr_bs1_06", line1: "14 Welsh Back", city: "Bristol" },
];

export const ADDRESS_BOOK: Record<string, Address[]> = {
  SW1A1AA: SW1A_ADDRESSES,
  EC1A1BB: [],
  M11AE: M1_ADDRESSES,
  BS14DJ: BS1_ADDRESSES,
};

/** Base skip catalogue — 8 sizes with mixed enabled/disabled default state. */
export const BASE_SKIPS: Skip[] = [
  { size: "2-yard", price: 90, disabled: false },
  { size: "3-yard", price: 110, disabled: false },
  { size: "4-yard", price: 140, disabled: false },
  { size: "5-yard", price: 170, disabled: false },
  { size: "6-yard", price: 200, disabled: false },
  { size: "8-yard", price: 240, disabled: false },
  { size: "10-yard", price: 290, disabled: true, disabledReason: "Not available in your area" },
  { size: "12-yard", price: 340, disabled: true, disabledReason: "Not available in your area" },
];

/**
 * Apply domain rules to the base skip catalogue.
 * Heavy waste disables the two smallest skips (they're not structurally rated
 * to hold dense loads like soil/rubble), which satisfies the "heavyWaste
 * disables ≥ 2 skip sizes" fixture requirement.
 */
export function applySkipRules(options: {
  heavyWaste: boolean;
  plasterboard: boolean;
}): Skip[] {
  const { heavyWaste, plasterboard } = options;
  return BASE_SKIPS.map((skip) => {
    if (heavyWaste && (skip.size === "2-yard" || skip.size === "3-yard")) {
      return {
        ...skip,
        disabled: true,
        disabledReason: "Not rated for heavy waste",
      };
    }
    if (plasterboard && skip.size === "2-yard") {
      return {
        ...skip,
        disabled: true,
        disabledReason: "Too small for segregated plasterboard",
      };
    }
    return skip;
  });
}

export const PLASTERBOARD_OPTIONS = [
  { id: "bagged", label: "Bagged separately (customer supplies bags)" },
  { id: "segregated", label: "Segregated inside the skip (we provide divider)" },
  { id: "collection", label: "Dedicated plasterboard collection (extra fee)" },
] as const;

export type PlasterboardOptionId = (typeof PLASTERBOARD_OPTIONS)[number]["id"];

/**
 * Retry-once counter for the BS1 4DJ fixture. Lives in module scope so
 * it survives across requests within a single server process, which is
 * enough for local demo + test purposes.
 */
const retryCounters = new Map<string, number>();

export function shouldFailFirstCall(postcodeKey: string): boolean {
  if (postcodeKey !== "BS14DJ") return false;
  const count = (retryCounters.get(postcodeKey) ?? 0) + 1;
  retryCounters.set(postcodeKey, count);
  return count === 1;
}

export function resetRetryCounter(postcodeKey: string) {
  retryCounters.delete(postcodeKey);
}

export const LATENCY_MS_FOR = (postcodeKey: string): number =>
  postcodeKey === "M11AE" ? 1200 : 0;

export function generateBookingId(): string {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `BK-${n}`;
}
