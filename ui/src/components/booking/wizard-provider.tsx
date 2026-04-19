"use client";

import * as React from "react";
import {
  bookingReducer,
  INITIAL_STATE,
  type BookingAction,
  type BookingState,
} from "@/lib/booking-state";

type WizardContextValue = {
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
};

const WizardContext = React.createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(bookingReducer, INITIAL_STATE);
  const value = React.useMemo(() => ({ state, dispatch }), [state]);
  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard(): WizardContextValue {
  const ctx = React.useContext(WizardContext);
  if (!ctx) {
    throw new Error("useWizard must be used within <WizardProvider>");
  }
  return ctx;
}
