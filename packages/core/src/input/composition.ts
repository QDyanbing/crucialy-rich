import { cloneRangeSelection, type RangeSelection } from "../selection";

export interface CompositionState {
  active: boolean;
  data: string;
  selection?: RangeSelection;
  startSelection?: RangeSelection;
}

export function createCompositionState(): CompositionState {
  return { active: false, data: "" };
}

export function startComposition(selection: RangeSelection): CompositionState {
  return {
    active: true,
    data: "",
    selection: cloneRangeSelection(selection),
    startSelection: cloneRangeSelection(selection),
  };
}

export function updateComposition(
  state: CompositionState,
  data: string,
  selection?: RangeSelection,
): CompositionState {
  if (!state.active) {
    return state;
  }

  return {
    ...state,
    data,
    ...(selection ? { selection: cloneRangeSelection(selection) } : {}),
  };
}

export function cancelComposition(): CompositionState {
  return createCompositionState();
}
