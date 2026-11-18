import {
  createDocument,
  createParagraph,
  createText,
  type RangeSelection,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import {
  createLinkSelectionSnapshot,
  readLinkSelectionSnapshot,
} from "../../apps/demo/src/link-selection";

const document = createDocument([createParagraph([createText("链接正文")])]);
const range = (): RangeSelection => ({
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 2 },
});

describe("Demo link selection ownership", () => {
  it("copies both endpoints when captured and read", () => {
    const selection = range();
    const snapshot = createLinkSelectionSnapshot(document, selection)!;
    selection.anchor.path[0] = 9;
    selection.focus.offset = 99;
    expect(snapshot.selection).toEqual(range());
    const read = readLinkSelectionSnapshot(snapshot, document)!;
    read.anchor.path[0] = 8;
    read.focus.offset = 88;
    expect(readLinkSelectionSnapshot(snapshot, document)).toEqual(range());
  });
  it("rejects a different document even if its content is equal", () => {
    const snapshot = createLinkSelectionSnapshot(document, range())!;
    expect(
      readLinkSelectionSnapshot(snapshot, structuredClone(document)),
    ).toBeUndefined();
    expect(readLinkSelectionSnapshot(null, document)).toBeUndefined();
  });
  it.each(["anchor", "focus"] as const)("rejects an invalid %s", (endpoint) => {
    const selection = range();
    selection[endpoint].offset = 99;
    expect(createLinkSelectionSnapshot(document, selection)).toBeUndefined();
  });
  it("preserves reverse direction and permits a collapsed inspection range", () => {
    const selection = range();
    [selection.anchor, selection.focus] = [selection.focus, selection.anchor];
    expect(createLinkSelectionSnapshot(document, selection)?.selection).toEqual(
      selection,
    );
    selection.focus = selection.anchor;
    expect(createLinkSelectionSnapshot(document, selection)?.selection).toEqual(
      selection,
    );
  });
  it("revalidates a captured range if the same model was mutated", () => {
    const model = structuredClone(document);
    const snapshot = createLinkSelectionSnapshot(model, range())!;
    model.children.splice(0);
    expect(readLinkSelectionSnapshot(snapshot, model)).toBeUndefined();
  });
});
