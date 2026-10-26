import { describe, expect, it } from "vitest";
import {
  createDocument,
  createParagraph,
  createTable,
  createText,
  getClipboardHtml,
  getClipboardText,
  parseHtml,
  type TextMarks,
} from "../../src";

const selection = {
  anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
  focus: { path: [0, 0, 1, 0, 0], offset: 1 },
};

describe("table clipboard safety", () => {
  it("escapes literal tags and preserves safe link, code and text styles", () => {
    const table = createTable(1, 2);
    table.children[0]!.children[0]!.children = [
      createParagraph([
        createText('<img onerror="x">&', {
          bold: true,
          code: true,
          underline: true,
          textColor: "#123456",
          backgroundColor: "#aabbcc",
          fontSize: 18,
          link: {
            href: "https://example.com/?x=1&y=2",
            target: "_blank",
            rel: "noopener noreferrer",
          },
        }),
      ]),
    ];
    table.children[0]!.children[1]!.children = [createParagraph([createText("乙")])];
    const html = getClipboardHtml(createDocument([table]), selection)!;
    expect(html).toContain("&lt;img onerror=&quot;x&quot;&gt;&amp;");
    expect(html).toContain("<code>");
    expect(html).not.toMatch(/<img|data-|aria-|contenteditable|class=/i);
    expect(parseHtml(html)?.blocks).toEqual([table]);
  });

  it.each([
    { link: { href: "javascript:alert(1)" } },
    { textColor: "red;position:fixed" },
    { fontSize: 999 },
  ])(
    "refuses an invalid source table instead of repairing it silently: %j",
    (marks) => {
      const table = createTable(1, 2);
      table.children[0]!.children[0]!.children[0]!.children = [
        { type: "text", text: "甲", marks: marks as TextMarks },
      ];
      table.children[0]!.children[1]!.children[0]!.children = [createText("乙")];
      const document = createDocument([table]);
      expect(getClipboardText(document, selection)).toBe("甲\t乙");
      expect(getClipboardHtml(document, selection)).toBeUndefined();
    },
  );

  it("clips UTF-16 offsets across text runs without leaking neighboring marks", () => {
    const table = createTable(1, 2);
    table.children[0]!.children[0]!.children[0]!.children = [
      createText("未选", { strike: true }),
      createText("前😀甲", { bold: true }),
    ];
    table.children[0]!.children[1]!.children[0]!.children = [
      createText("乙😀后", { italic: true }),
      createText("未选", { strike: true }),
    ];
    const document = createDocument([table]);
    const range = {
      anchor: { path: [0, 0, 0, 0, 1], offset: 1 },
      focus: { path: [0, 0, 1, 0, 0], offset: 3 },
    };
    const html = getClipboardHtml(document, range)!;
    expect(getClipboardText(document, range)).toBe("😀甲\t乙😀");
    expect(html).toContain("<strong>😀甲</strong>");
    expect(html).toContain("<em>乙😀</em>");
    expect(html).not.toMatch(/未选|<s>|前|后/);
  });
});
