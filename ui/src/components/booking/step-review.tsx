"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { PLASTERBOARD_OPTIONS } from "@/lib/fixtures";
import { selectedAddressLabel, selectedSkipPrice } from "@/lib/booking-state";
import { computePriceBreakdown } from "@/lib/pricing";
import { useWizard } from "./wizard-provider";
import { PriceBreakdown } from "./price-breakdown";

type ConfirmState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success"; bookingId: string };

export function StepReview() {
  const { state, dispatch } = useWizard();
  const [confirm, setConfirm] = React.useState<ConfirmState>(
    state.bookingId ? { kind: "success", bookingId: state.bookingId } : { kind: "idle" },
  );

  const addressLabel = selectedAddressLabel(state);
  const skipPrice = selectedSkipPrice(state);
  const breakdown = computePriceBreakdown(state);
  const plasterLabel = state.plasterboardOption
    ? PLASTERBOARD_OPTIONS.find((o) => o.id === state.plasterboardOption)?.label
    : null;

  async function onConfirm() {
    if (confirm.kind === "submitting" || confirm.kind === "success") return;
    if (!state.postcode || !state.selectedAddressId || skipPrice == null) return;

    setConfirm({ kind: "submitting" });
    try {
      const res = await fetch("/api/booking/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postcode: state.postcode,
          addressId: state.selectedAddressId,
          heavyWaste: state.heavyWaste,
          plasterboard: state.plasterboard,
          plasterboardOption: state.plasterboardOption,
          skipSize: state.selectedSkipSize,
          price: skipPrice,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? `Booking failed (${res.status})`);
      }
      const data = (await res.json()) as { bookingId: string };
      setConfirm({ kind: "success", bookingId: data.bookingId });
      dispatch({ type: "set-booking-id", bookingId: data.bookingId });
    } catch (err) {
      setConfirm({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  if (confirm.kind === "success") {
    return (
      <section
        className="flex flex-col items-center gap-4 py-6 text-center"
        data-testid="booking-success"
      >
        <CheckCircle2 className="h-12 w-12 text-primary" />
        <h2 className="text-2xl font-semibold">Booking confirmed</h2>
        <p className="text-sm text-muted-foreground">
          Your booking reference is{" "}
          <span className="font-mono font-semibold" data-testid="booking-id">
            {confirm.bookingId}
          </span>
          . We&apos;ve sent a confirmation to your inbox.
        </p>
        <Button
          variant="outline"
          data-testid="booking-start-over"
          onClick={() => dispatch({ type: "reset" })}
        >
          Start a new booking
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6" data-testid="step-review">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Review your booking</h2>
        <p className="text-sm text-muted-foreground">
          Double-check everything before confirming. You can go back to edit.
        </p>
      </div>

      <dl className="grid gap-3 rounded-lg border p-4 text-sm" data-testid="review-summary">
        <Row label="Postcode" value={state.postcode} testId="review-postcode" />
        <Row label="Address" value={addressLabel} testId="review-address" />
        <Separator />
        <Row
          label="Heavy waste"
          value={state.heavyWaste ? "Yes" : "No"}
          testId="review-heavy"
        />
        <Row
          label="Plasterboard"
          value={state.plasterboard ? "Yes" : "No"}
          testId="review-plasterboard"
        />
        {plasterLabel && (
          <Row
            label="Handling"
            value={plasterLabel}
            testId="review-plasterboard-option"
          />
        )}
        <Separator />
        <Row label="Skip size" value={state.selectedSkipSize} testId="review-skip" />
      </dl>

      {breakdown && <PriceBreakdown state={state} />}

      {confirm.kind === "error" && (
        <Alert variant="destructive" data-testid="confirm-error">
          <AlertCircle />
          <AlertTitle>We couldn&apos;t confirm your booking</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>{confirm.message}</span>
            <div>
              <Button
                size="sm"
                variant="outline"
                data-testid="confirm-retry"
                onClick={onConfirm}
              >
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          data-testid="review-back"
          onClick={() => dispatch({ type: "set-step", step: 3 })}
          disabled={confirm.kind === "submitting"}
        >
          Back
        </Button>
        <Button
          data-testid="confirm-booking"
          onClick={onConfirm}
          disabled={confirm.kind === "submitting"}
        >
          {confirm.kind === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirming…
            </>
          ) : (
            "Confirm booking"
          )}
        </Button>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  testId,
}: {
  label: string;
  value: string | null | undefined;
  testId: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4" data-testid={testId}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value ?? "—"}</dd>
    </div>
  );
}
