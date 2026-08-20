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
      createParagraph([
        createText("你好", {
          backgroundColor: "#fff4cc",
          bold: true,
          fontSize: 16,
          italic: true,
          link: {
            href: "https://example.com/docs",
            rel: "noopener noreferrer",
            target: "_blank",
          },
          strike: true,
          textColor: "#1c2520",
          underline: true,
        }),
      ]),
    ]);
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 2 },
    };
    const originalLink = document.children[0]?.children[0]?.marks?.link;
    const snapshot = createHistorySnapshot(document, selection);

    if (originalLink) {
      originalLink.href = "https://example.com/changed";
    }
    document.children[0]!.children[0]!.text = "已改";
    document.children[0]!.children[0]!.marks = { italic: true };
    selection.anchor.path[0] = 9;
    selection.focus.offset = 9;

    expect(snapshot.document.children[0]?.children[0]?.text).toBe("你好");
    expect(snapshot.document.children[0]?.children[0]?.marks).toEqual({
      backgroundColor: "#fff4cc",
      bold: true,
      fontSize: 16,
      italic: true,
      link: {
        href: "https://example.com/docs",
        rel: "noopener noreferrer",
        target: "_blank",
      },
      strike: true,
      textColor: "#1c2520",
      underline: true,
    });
    expect(snapshot.document.children[0]?.children[0]?.marks).not.toBe(
      document.children[0]?.children[0]?.marks,
    );
    expect(snapshot.document.children[0]?.children[0]?.marks?.link).not.toBe(
      originalLink,
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
