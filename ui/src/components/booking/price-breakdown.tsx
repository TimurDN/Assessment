"use client";

import { Receipt } from "lucide-react";

import { computePriceBreakdown, formatGBP } from "@/lib/pricing";
import type { BookingState } from "@/lib/booking-state";

export function PriceBreakdown({ state }: { state: BookingState }) {
  const breakdown = computePriceBreakdown(state);
  if (!breakdown) return null;

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm"
      data-testid="price-breakdown"
    >
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="text-sm font-semibold tracking-tight">Price breakdown</h3>
      </div>
      <dl className="flex flex-col gap-1.5 text-sm">
        {breakdown.lines.map((line) => (
          <div
            key={line.testId}
            className="flex items-center justify-between"
            data-testid={line.testId}
          >
            <dt className="text-muted-foreground">{line.label}</dt>
            <dd className="font-mono tabular-nums">{formatGBP(line.amount)}</dd>
          </div>
        ))}
        <div
          className="mt-1 flex items-center justify-between border-t pt-2"
          data-testid="price-subtotal"
        >
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-mono tabular-nums text-muted-foreground">
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
          <dd className="font-mono tabular-nums text-muted-foreground">
            {formatGBP(breakdown.vat)}
          </dd>
        </div>
        <div
          className="mt-2 flex items-center justify-between rounded-lg bg-primary/8 px-3 py-2.5 text-base font-semibold ring-1 ring-primary/20"
          data-testid="price-total"
        >
          <dt>Total</dt>
          <dd className="font-mono tabular-nums">{formatGBP(breakdown.total)}</dd>
        </div>
      </dl>
    </div>
  );
}
