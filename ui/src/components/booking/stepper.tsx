"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepId } from "@/lib/booking-state";

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: 1, label: "Address" },
  { id: 2, label: "Waste" },
  { id: 3, label: "Skip" },
  { id: 4, label: "Review" },
];

export function Stepper({ current }: { current: StepId }) {
  return (
    <ol
      className="flex w-full items-center gap-2"
      data-testid="stepper"
      aria-label="Booking progress"
    >
      {STEPS.map((step, idx) => {
        const state =
          step.id < current ? "done" : step.id === current ? "current" : "upcoming";
        return (
          <li
            key={step.id}
            data-testid={`stepper-step-${step.id}`}
            data-state={state}
            className="flex flex-1 items-center gap-2"
            aria-current={state === "current" ? "step" : undefined}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                state === "done" && "border-primary bg-primary text-primary-foreground",
                state === "current" && "border-primary bg-primary/10 text-primary",
                state === "upcoming" && "border-border bg-background text-muted-foreground",
              )}
            >
              {state === "done" ? <Check className="h-4 w-4" /> : step.id}
            </div>
            <span
              className={cn(
                "hidden text-sm font-medium sm:inline",
                state === "upcoming" && "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 bg-border",
                  state === "done" && "bg-primary",
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
