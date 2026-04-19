import type { Address, PlasterboardOptionId, Skip } from "./fixtures";

export type StepId = 1 | 2 | 3 | 4;

export type BookingState = {
  step: StepId;
  postcode: string | null;
  addresses: Address[];
  selectedAddressId: string | null;
  manualAddressLine1: string | null;
  manualAddressCity: string | null;

  heavyWaste: boolean | null;
  plasterboard: boolean | null;
  plasterboardOption: PlasterboardOptionId | null;

  skips: Skip[];
  selectedSkipSize: string | null;

  bookingId: string | null;
};

export const INITIAL_STATE: BookingState = {
  step: 1,
  postcode: null,
  addresses: [],
  selectedAddressId: null,
  manualAddressLine1: null,
  manualAddressCity: null,
  heavyWaste: null,
  plasterboard: null,
  plasterboardOption: null,
  skips: [],
  selectedSkipSize: null,
  bookingId: null,
};

export type BookingAction =
  | { type: "set-postcode-result"; postcode: string; addresses: Address[] }
  | { type: "select-address"; addressId: string }
  | { type: "set-manual-address"; line1: string; city: string }
  | { type: "set-waste"; heavyWaste: boolean; plasterboard: boolean; plasterboardOption: PlasterboardOptionId | null }
  | { type: "set-skips"; skips: Skip[] }
  | { type: "select-skip"; size: string }
  | { type: "set-step"; step: StepId }
  | { type: "set-booking-id"; bookingId: string }
  | { type: "reset" };

export function bookingReducer(
  state: BookingState,
  action: BookingAction,
): BookingState {
  switch (action.type) {
    case "set-postcode-result":
      return {
        ...state,
        postcode: action.postcode,
        addresses: action.addresses,
        selectedAddressId: null,
        manualAddressLine1: null,
        manualAddressCity: null,
      };
    case "select-address":
      return {
        ...state,
        selectedAddressId: action.addressId,
        manualAddressLine1: null,
        manualAddressCity: null,
      };
    case "set-manual-address":
      return {
        ...state,
        selectedAddressId: `manual:${action.line1}|${action.city}`,
        manualAddressLine1: action.line1,
        manualAddressCity: action.city,
      };
    case "set-waste":
      return {
        ...state,
        heavyWaste: action.heavyWaste,
        plasterboard: action.plasterboard,
        plasterboardOption: action.plasterboardOption,
        // NOTE: downstream skip selection is deliberately NOT cleared here.
        // If the user revisits step 2 and changes waste flags after already
        // picking a skip, the previous `selectedSkipSize` leaks into the
        // review step — including when the new waste constraints would
        // disable that skip. Tracked as BUG-1 in bug-reports.md.
      };
    case "set-skips":
      return { ...state, skips: action.skips };
    case "select-skip":
      return { ...state, selectedSkipSize: action.size };
    case "set-step":
      return { ...state, step: action.step };
    case "set-booking-id":
      return { ...state, bookingId: action.bookingId };
    case "reset":
      return INITIAL_STATE;
    default:
      return state;
  }
}

export function selectedAddressLabel(state: BookingState): string | null {
  if (!state.selectedAddressId) return null;
  if (state.manualAddressLine1 && state.manualAddressCity) {
    return `${state.manualAddressLine1}, ${state.manualAddressCity}`;
  }
  const a = state.addresses.find((x) => x.id === state.selectedAddressId);
  return a ? `${a.line1}, ${a.city}` : null;
}

export function selectedSkipPrice(state: BookingState): number | null {
  if (!state.selectedSkipSize) return null;
  const s = state.skips.find((x) => x.size === state.selectedSkipSize);
  return s ? s.price : null;
}
