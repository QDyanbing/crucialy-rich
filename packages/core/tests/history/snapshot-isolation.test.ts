import { describe, expect, it } from "vitest";
import { cloneHistorySnapshot, createHistorySnapshot } from "../../src";
import { isolationEntry, mutateSnapshot } from "./isolation-fixture";

describe.each([
  [
    "create",
    (snapshot: ReturnType<typeof createHistorySnapshot>) =>
      createHistorySnapshot(
        snapshot.document,
        snapshot.selection,
        snapshot.blockSelection,
      ),
  ],
  ["clone", cloneHistorySnapshot],
] as const)("%s snapshot ownership", (_name, clone) => {
  it("isolates marks, links, nested lists, cells and image metadata from the source", () => {
    const source = isolationEntry().before;
    const snapshot = clone(source);
    const expected = structuredClone(snapshot);
    mutateSnapshot(source);
    expect(snapshot).toEqual(expected);
  });

  it("does not modify the source when the returned snapshot is changed", () => {
    const source = isolationEntry().before;
    const expected = structuredClone(source);
    mutateSnapshot(clone(source));
    expect(source).toEqual(expected);
  });

  it("separates aliased anchor and focus paths", () => {
    const source = isolationEntry().before;
    source.selection!.focus = source.selection!.anchor;
    const snapshot = clone(source);
    snapshot.selection!.anchor.path[0] = 99;
    snapshot.selection!.anchor.offset = 99;
    expect(snapshot.selection!.focus).toEqual({ path: [0, 0], offset: 0 });
    expect(source.selection!.anchor).toEqual({ path: [0, 0], offset: 0 });
    expect(snapshot.blockSelection!.path).toEqual([3]);
  });
});
