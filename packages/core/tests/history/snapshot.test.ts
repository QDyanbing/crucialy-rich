import { describe, expect, it } from "vitest";

import {
  createDocument,
  createHistorySnapshot,
  createParagraph,
  createText,
} from "../../src";

describe("createHistorySnapshot", () => {
  it("clones document and selection values", () => {
    const document = createDocument([
      createParagraph([createText("你好", { bold: true })]),
    ]);
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 2 },
    };
    const snapshot = createHistorySnapshot(document, selection);

    document.children[0]!.children[0]!.text = "已改";
    document.children[0]!.children[0]!.marks = { italic: true };
    selection.anchor.path[0] = 9;
    selection.focus.offset = 9;

    expect(snapshot.document.children[0]?.children[0]?.text).toBe("你好");
    expect(snapshot.document.children[0]?.children[0]?.marks).toEqual({ bold: true });
    expect(snapshot.document.children[0]?.children[0]?.marks).not.toBe(
      document.children[0]?.children[0]?.marks,
    );
    expect(snapshot.selection).toEqual({
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 2 },
    });
  });

  it("omits selection when it is not provided", () => {
    const snapshot = createHistorySnapshot(createDocument());

    expect(snapshot.selection).toBeUndefined();
  });
});
