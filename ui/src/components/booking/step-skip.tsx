"use client";

import * as React from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatGBP } from "@/lib/pricing";
import type { Skip } from "@/lib/fixtures";
import { useWizard } from "./wizard-provider";

type FetchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; skips: Skip[] }
  | { kind: "error"; message: string };

export function StepSkip() {
  const { state, dispatch } = useWizard();
  const [fetchState, setFetchState] = React.useState<FetchState>({ kind: "idle" });
  const triedOnce = React.useRef(false);

  const load = React.useCallback(async () => {
    if (!state.postcode || state.heavyWaste == null || state.plasterboard == null) {
      return;
    }
    setFetchState({ kind: "loading" });
    try {
      const params = new URLSearchParams({
        postcode: state.postcode,
        heavyWaste: String(state.heavyWaste),
        plasterboard: String(state.plasterboard),
      });
      const res = await fetch(`/api/skips?${params.toString()}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? `Failed to load skips (${res.status})`);
      }
      const data = (await res.json()) as { skips: Skip[] };
      setFetchState({ kind: "success", skips: data.skips });
      dispatch({ type: "set-skips", skips: data.skips });
    } catch (err) {
      setFetchState({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }, [dispatch, state.heavyWaste, state.plasterboard, state.postcode]);

  React.useEffect(() => {
    if (triedOnce.current) return;
    triedOnce.current = true;
    load();
  }, [load]);

  function onSelect(s: Skip) {
    if (s.disabled) return;
    dispatch({ type: "select-skip", size: s.size });
  }

  function onNext() {
    if (!state.selectedSkipSize) return;
    dispatch({ type: "set-step", step: 4 });
  }

  return (
    <section className="flex flex-col gap-6" data-testid="step-skip">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Choose your skip size</h2>
        <p className="text-sm text-muted-foreground">
          Disabled sizes aren&apos;t suitable for your waste type or area.
        </p>
      </div>

      {fetchState.kind === "loading" && (
        <div
          className="grid gap-3 sm:grid-cols-2"
          data-testid="skips-loading"
          aria-live="polite"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {fetchState.kind === "error" && (
        <Alert variant="destructive" data-testid="skips-error">
          <AlertCircle />
          <AlertTitle>Couldn&apos;t load skip options</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>{fetchState.message}</span>
            <div>
              <Button
                size="sm"
                variant="outline"
                data-testid="skips-retry"
                onClick={load}
              >
                <Loader2 className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {fetchState.kind === "success" && (
        <ul
          className="grid gap-3 sm:grid-cols-2"
          data-testid="skip-list"
          aria-label="Available skip sizes"
        >
          {fetchState.skips.map((s) => {
            const selected = state.selectedSkipSize === s.size;
            return (
              <li key={s.size}>
                <button
                  type="button"
                  data-testid={`skip-option-${s.size}`}
                  data-selected={selected}
                  data-disabled={s.disabled}
                  disabled={s.disabled}
                  aria-pressed={selected}
                  onClick={() => onSelect(s)}
                  className={cn(
                    "flex w-full flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors",
                    s.disabled
                      ? "cursor-not-allowed border-dashed bg-muted/30 opacity-60"
                      : "hover:bg-muted",
                    selected && !s.disabled && "border-primary bg-primary/5",
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-base font-semibold">{s.size}</span>
                    <span className="font-mono text-sm">{formatGBP(s.price)}</span>
                  </div>
                  {s.disabled && (
                    <Badge
                      variant="secondary"
                      data-testid={`skip-disabled-reason-${s.size}`}
                      className="mt-1"
                    >
                      {s.disabledReason ?? "Unavailable"}
                    </Badge>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          data-testid="skip-back"
          onClick={() => dispatch({ type: "set-step", step: 2 })}
        >
          Back
        </Button>
        <Button
          data-testid="skip-next"
          onClick={onNext}
          disabled={!state.selectedSkipSize}
        >
          Continue
        </Button>
      </div>
    </section>
  );
}
