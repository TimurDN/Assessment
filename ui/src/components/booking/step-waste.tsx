"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PLASTERBOARD_OPTIONS, type PlasterboardOptionId } from "@/lib/fixtures";
import { cn } from "@/lib/utils";
import { useWizard } from "./wizard-provider";

export function StepWaste() {
  const { state, dispatch } = useWizard();
  const [heavy, setHeavy] = React.useState<boolean | null>(state.heavyWaste);
  const [plaster, setPlaster] = React.useState<boolean | null>(state.plasterboard);
  const [plasterOption, setPlasterOption] = React.useState<PlasterboardOptionId | null>(
    state.plasterboardOption,
  );
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const plasterboardIncomplete = plaster === true && plasterOption == null;
  const canContinue = heavy != null && plaster != null && !plasterboardIncomplete;

  async function onNext() {
    if (!canContinue) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/waste-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heavyWaste: heavy,
          plasterboard: plaster,
          plasterboardOption: plaster ? plasterOption : null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? `Save failed (${res.status})`);
      }
      dispatch({
        type: "set-waste",
        heavyWaste: heavy!,
        plasterboard: plaster!,
        plasterboardOption: plaster ? plasterOption : null,
      });
      dispatch({ type: "set-step", step: 3 });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col gap-6" data-testid="step-waste">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">What are you throwing away?</h2>
        <p className="text-sm text-muted-foreground">
          This helps us recommend the right skip size and pricing.
        </p>
      </div>

      <ToggleGroup
        testId="heavy-waste"
        label="Does your load include heavy waste (soil, rubble, concrete)?"
        value={heavy}
        onChange={setHeavy}
      />

      <ToggleGroup
        testId="plasterboard"
        label="Does your load include plasterboard?"
        value={plaster}
        onChange={(v) => {
          setPlaster(v);
          if (!v) setPlasterOption(null);
        }}
      />

      {plaster === true && (
        <fieldset
          className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4"
          data-testid="plasterboard-options"
        >
          <legend className="px-1 text-sm font-medium">
            Plasterboard handling (required)
          </legend>
          <p className="text-sm text-muted-foreground">
            Plasterboard has to be handled separately under UK landfill regulations.
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {PLASTERBOARD_OPTIONS.map((opt) => {
              const checked = plasterOption === opt.id;
              return (
                <label
                  key={opt.id}
                  data-testid={`plasterboard-option-${opt.id}`}
                  data-selected={checked}
                  className="flex cursor-pointer items-center gap-3 rounded-md border bg-background px-3 py-2 hover:bg-muted/60 data-[selected=true]:border-primary data-[selected=true]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="plasterboard-option"
                    value={opt.id}
                    checked={checked}
                    onChange={() => setPlasterOption(opt.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {submitError && (
        <Alert variant="destructive" data-testid="waste-error">
          <AlertCircle />
          <AlertTitle>Couldn&apos;t save your selection</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          data-testid="waste-back"
          onClick={() => dispatch({ type: "set-step", step: 1 })}
        >
          Back
        </Button>
        <Button
          data-testid="waste-next"
          onClick={onNext}
          disabled={!canContinue || submitting}
        >
          {submitting ? "Saving…" : "Continue"}
        </Button>
      </div>
    </section>
  );
}

function ToggleGroup({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  testId: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2" data-testid={`${testId}-group`}>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex gap-2">
        {[
          { id: "yes", value: true, label: "Yes" },
          { id: "no", value: false, label: "No" },
        ].map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.id}
              type="button"
              data-testid={`${testId}-${opt.id}`}
              data-selected={selected}
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex flex-1 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
