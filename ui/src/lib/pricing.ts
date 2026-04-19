import type { BookingState } from "./booking-state";
import { selectedSkipPrice } from "./booking-state";

export type PriceLine = {
  label: string;
  amount: number;
  testId: string;
};

export type PriceBreakdown = {
  lines: PriceLine[];
  subtotal: number;
  vatRate: number;
  vat: number;
  total: number;
};

const VAT_RATE = 0.2;
const HEAVY_WASTE_SURCHARGE = 25;
const PLASTERBOARD_COLLECTION_FEE = 35;

export function computePriceBreakdown(state: BookingState): PriceBreakdown | null {
  const skipPrice = selectedSkipPrice(state);
  if (skipPrice == null) return null;

  const lines: PriceLine[] = [
    {
      label: `Skip hire (${state.selectedSkipSize})`,
      amount: skipPrice,
      testId: "price-line-skip",
    },
  ];

  if (state.heavyWaste) {
    lines.push({
      label: "Heavy waste surcharge",
      amount: HEAVY_WASTE_SURCHARGE,
      testId: "price-line-heavy",
    });
  }

  if (state.plasterboard && state.plasterboardOption === "collection") {
    lines.push({
      label: "Plasterboard collection",
      amount: PLASTERBOARD_COLLECTION_FEE,
      testId: "price-line-plasterboard",
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  return { lines, subtotal, vatRate: VAT_RATE, vat, total };
}

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}
