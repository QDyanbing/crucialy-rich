import { describe, expect, it } from "vitest";
import {
  startComposition,
  updateComposition,
  finishComposition,
  type CompositionState,
} from "../../src";

const range = () => ({
  anchor: { path: [0, 0], offset: 1 },
  focus: { path: [0, 0], offset: 2 },
});

describe("active composition snapshot isolation", () => {
  it.each([false, true])(
    "copies previous start/current points when updating (explicit selection: %s)",
    (explicit) => {
      const previous = startComposition(range());
      const selection = explicit ? range() : undefined;
      const next = updateComposition(previous, "候选", selection);
      const expected = structuredClone(next);
      previous.startSelection!.anchor.path[0] = 99;
      previous.selection!.focus.offset = 99;
      if (selection) selection.anchor.offset = 99;
      expect(next).toEqual(expected);
      expect(finishComposition(next)!.selection).toEqual(range());
    },
  );

  it.each(["startSelection", "selection"] as const)(
    "does not mutate earlier state by changing returned %s",
    (key) => {
      const previous = startComposition(range());
      const expected = structuredClone(previous);
      const next = updateComposition(previous, "中");
      next[key]!.anchor.path[0] = 99;
      expect(previous).toEqual(expected);
    },
  );

  it("separates aliased current and initial ranges", () => {
    const selection = range();
    const input: CompositionState = {
      active: true,
      data: "",
      selection,
      startSelection: selection,
    };
    const next = updateComposition(input, "中文");
    next.selection!.anchor.path[0] = 99;
    expect(next.startSelection).toEqual(range());
    expect(input.startSelection).toEqual(range());
  });

  it("keeps each candidate snapshot and returned commit independent", () => {
    const initial = startComposition(range());
    const first = updateComposition(initial, "中");
    const second = updateComposition(first, "中文");
    const commit = finishComposition(second)!;
    first.startSelection!.focus.offset = 99;
    commit.selection.anchor.path[0] = 99;
    expect(second.startSelection).toEqual(range());
    expect(initial.startSelection).toEqual(range());
    expect(finishComposition(second)!.data).toBe("中文");
  });
});
