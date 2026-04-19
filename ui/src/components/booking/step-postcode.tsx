"use client";

import * as React from "react";
import { AlertCircle, Loader2, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { POSTCODE_REGEX, type Address } from "@/lib/fixtures";
import { useWizard } from "./wizard-provider";

type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; postcode: string; addresses: Address[] }
  | { kind: "error"; message: string };

export function StepPostcode() {
  const { state, dispatch } = useWizard();
  const [input, setInput] = React.useState(state.postcode ?? "");
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [lookup, setLookup] = React.useState<LookupState>(() =>
    state.postcode
      ? { kind: "success", postcode: state.postcode, addresses: state.addresses }
      : { kind: "idle" },
  );
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualLine1, setManualLine1] = React.useState(state.manualAddressLine1 ?? "");
  const [manualCity, setManualCity] = React.useState(state.manualAddressCity ?? "");

  async function runLookup() {
    const trimmed = input.trim();
    if (trimmed === "") {
      setValidationError("Please enter a postcode.");
      return;
    }
    if (!POSTCODE_REGEX.test(trimmed.replace(/\s+/g, ""))) {
      setValidationError("That doesn’t look like a valid UK postcode.");
      return;
    }
    setValidationError(null);
    setLookup({ kind: "loading" });
    try {
      const res = await fetch("/api/postcode/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode: trimmed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? `Lookup failed (${res.status})`);
      }
      const data = (await res.json()) as { postcode: string; addresses: Address[] };
      setLookup({ kind: "success", postcode: data.postcode, addresses: data.addresses });
      dispatch({
        type: "set-postcode-result",
        postcode: data.postcode,
        addresses: data.addresses,
      });
      setManualOpen(false);
    } catch (err) {
      setLookup({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  function onSelectAddress(id: string) {
    dispatch({ type: "select-address", addressId: id });
  }

  function onNext() {
    if (!state.selectedAddressId) return;
    dispatch({ type: "set-step", step: 2 });
  }

  function onSaveManual() {
    const l = manualLine1.trim();
    const c = manualCity.trim();
    if (l === "" || c === "") return;
    dispatch({ type: "set-manual-address", line1: l, city: c });
  }

  return (
    <section className="flex flex-col gap-6" data-testid="step-postcode">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Where should we deliver?</h2>
        <p className="text-sm text-muted-foreground">
          Enter your UK postcode and we&apos;ll find matching addresses.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="postcode-input">Postcode</Label>
        <div className="flex gap-2">
          <Input
            id="postcode-input"
            data-testid="postcode-input"
            placeholder="e.g. SW1A 1AA"
            value={input}
            autoComplete="postal-code"
            aria-invalid={validationError != null || lookup.kind === "error"}
            onChange={(e) => {
              setInput(e.target.value.toUpperCase());
              if (validationError) setValidationError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runLookup();
              }
            }}
          />
          <Button
            data-testid="postcode-lookup-button"
            onClick={runLookup}
            disabled={lookup.kind === "loading"}
          >
            {lookup.kind === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {lookup.kind === "loading" ? "Looking up…" : "Find address"}
          </Button>
        </div>
        {validationError && (
          <p
            role="alert"
            data-testid="postcode-validation-error"
            className="text-sm text-destructive"
          >
            {validationError}
          </p>
        )}
      </div>

      {lookup.kind === "loading" && (
        <div
          className="flex flex-col gap-2"
          data-testid="postcode-loading"
          aria-live="polite"
        >
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {lookup.kind === "error" && (
        <Alert variant="destructive" data-testid="postcode-error">
          <AlertCircle />
          <AlertTitle>We couldn’t fetch addresses</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>{lookup.message}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                data-testid="postcode-retry"
                onClick={runLookup}
              >
                Retry
              </Button>
              <Button
                size="sm"
                variant="ghost"
                data-testid="postcode-manual-open"
                onClick={() => setManualOpen(true)}
              >
                Enter address manually
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {lookup.kind === "success" && lookup.addresses.length === 0 && (
        <Alert data-testid="postcode-empty">
          <MapPin />
          <AlertTitle>No addresses found for {lookup.postcode}</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              We couldn&apos;t find any addresses for that postcode. Double-check it or
              enter your address manually below.
            </span>
            <div>
              <Button
                size="sm"
                variant="outline"
                data-testid="postcode-manual-open"
                onClick={() => setManualOpen(true)}
              >
                Enter address manually
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {lookup.kind === "success" && lookup.addresses.length > 0 && (
        <fieldset className="flex flex-col gap-2" data-testid="address-list">
          <legend className="text-sm font-medium">
            {lookup.addresses.length} addresses for {lookup.postcode}
          </legend>
          <div className="max-h-80 overflow-y-auto rounded-lg border">
            {lookup.addresses.map((a) => {
              const checked = state.selectedAddressId === a.id;
              return (
                <label
                  key={a.id}
                  data-testid={`address-option-${a.id}`}
                  data-selected={checked}
                  className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-muted/60 data-[selected=true]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="address"
                    value={a.id}
                    checked={checked}
                    onChange={() => onSelectAddress(a.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">
                    <span className="font-medium">{a.line1}</span>
                    <span className="text-muted-foreground">, {a.city}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {manualOpen && (
        <div
          className="flex flex-col gap-3 rounded-lg border border-dashed p-4"
          data-testid="manual-address"
        >
          <h3 className="text-sm font-medium">Enter your address manually</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="manual-line1">Address line 1</Label>
              <Input
                id="manual-line1"
                data-testid="manual-line1"
                value={manualLine1}
                onChange={(e) => setManualLine1(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="manual-city">City / Town</Label>
              <Input
                id="manual-city"
                data-testid="manual-city"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Button
              size="sm"
              data-testid="manual-save"
              onClick={onSaveManual}
              disabled={manualLine1.trim() === "" || manualCity.trim() === ""}
            >
              Use this address
            </Button>
          </div>
          {state.manualAddressLine1 && state.manualAddressCity && (
            <p className="text-sm text-muted-foreground" data-testid="manual-saved">
              Using manual address: {state.manualAddressLine1}, {state.manualAddressCity}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          data-testid="postcode-next"
          onClick={onNext}
          disabled={!state.selectedAddressId}
        >
          Continue
        </Button>
      </div>
    </section>
  );
}
