"use client";

import { computePriceBreakdown, formatGBP } from "@/lib/pricing";
import type { BookingState } from "@/lib/booking-state";

export function PriceBreakdown({ state }: { state: BookingState }) {
  const breakdown = computePriceBreakdown(state);
  if (!breakdown) return null;

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4"
      data-testid="price-breakdown"
    >
      <h3 className="text-sm font-semibold">Price breakdown</h3>
      <dl className="flex flex-col gap-1 text-sm">
        {breakdown.lines.map((line) => (
          <div
            key={line.testId}
            className="flex items-center justify-between"
            data-testid={line.testId}
          >
            <dt>{line.label}</dt>
            <dd className="font-mono">{formatGBP(line.amount)}</dd>
          </div>
        ))}
        <div
          className="flex items-center justify-between border-t pt-1"
          data-testid="price-subtotal"
        >
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-mono text-muted-foreground">
            {formatGBP(breakdown.subtotal)}
          </dd>
        </div>
        <div
          className="flex items-center justify-between"
          data-testid="price-vat"
        >
          <dt className="text-muted-foreground">
            VAT ({Math.round(breakdown.vatRate * 100)}%)
          </dt>
          <dd className="font-mono text-muted-foreground">
            {formatGBP(breakdown.vat)}
          </dd>
        </div>
        <div
          className="mt-1 flex items-center justify-between border-t pt-2 text-base font-semibold"
          data-testid="price-total"
        >
          <dt>Total</dt>
          <dd className="font-mono">{formatGBP(breakdown.total)}</dd>
        </div>
      </dl>
    </div>
  );
}
