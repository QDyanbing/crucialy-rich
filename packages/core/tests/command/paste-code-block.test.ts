import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  canExecutePasteCommand,
  createCodeBlock,
  createDocument,
  createParagraph,
  createText,
  DEFAULT_CLIPBOARD_PARSERS,
  parseClipboardData,
  parseHtml,
  parseMarkdown,
  parsePlainText,
  pasteCommand,
  validateDocument,
} from "../../src";

describe("plain text paste into CodeBlock", () => {
  it.each([parseHtml("<p><b>富内容</b></p>")!, parseMarkdown("# 富内容")!])(
    "rejects $mimeType blocks inside code",
    (fragment) => {
      const point = { path: [0, 0], offset: 1 };
      const input = {
        context: {
          document: createDocument([createCodeBlock([createText("前后")])]),
          selection: { anchor: point, focus: point },
        },
        payload: { fragment },
      };
      expect(canExecutePasteCommand(input)).toBe(false);
      expect(pasteCommand.execute(input).status).toBe("skipped");
      expect(pasteCommand.execute(input).transaction).toBeUndefined();
    },
  );

  it("uses actual plain text rather than importing rich or Markdown code syntax", () => {
    const document = createDocument([createCodeBlock([createText("前后")])]);
    const point = { path: [0, 0], offset: 1 };
    const context = { document, selection: { anchor: point, focus: point } };
    const text = "`a`\n<b>literal</b>";
    const fragment = parseClipboardData(
      {
        types: ["text/markdown", "text/html", "text/plain"],
        getData: (type) =>
          type === "text/markdown"
            ? "# 富内容"
            : type === "text/html"
              ? "<b>富内容</b>"
              : text,
      },
      DEFAULT_CLIPBOARD_PARSERS,
      (candidate) =>
        canExecutePasteCommand({ context, payload: { fragment: candidate } }),
    );
    expect(fragment?.mimeType).toBe("text/plain");
    const result = pasteCommand.execute({ context, payload: { fragment } });
    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([createCodeBlock([createText(`前${text}后`)])]),
    );
  });

  it.each([
    { input: "甲", expected: "甲" },
    { input: "甲\n乙", expected: "甲\n乙" },
    { input: "甲\r\n乙", expected: "甲\n乙" },
    { input: "甲\r乙", expected: "甲\n乙" },
    { input: "甲\n\n乙\n", expected: "甲\n\n乙\n" },
    { input: "  const a = 1;\n\treturn a;", expected: "  const a = 1;\n\treturn a;" },
  ])("inserts %j as text without splitting the block", ({ input, expected }) => {
    const document = createDocument([
      createParagraph([createText("前方")]),
      createCodeBlock([createText("前后")]),
      createParagraph([createText("后方")]),
    ]);
    const snapshot = structuredClone(document);
    const point = { path: [1, 0], offset: 1 };
    const commandInput = {
      context: { document, selection: { anchor: point, focus: point } },
      payload: { fragment: parsePlainText(input)! },
    };
    const result = pasteCommand.execute(commandInput);
    const next = applyTransaction(document, result.transaction!);
    expect(canExecutePasteCommand(commandInput)).toBe(true);
    expect(next).toEqual(
      createDocument([
        document.children[0]!,
        createCodeBlock([createText(`前${expected}后`)]),
        document.children[2]!,
      ]),
    );
    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "insert_text",
    ]);
    expect(result.selection).toEqual({
      anchor: { path: [1, 0], offset: expected.length + 1 },
      focus: { path: [1, 0], offset: expected.length + 1 },
    });
    expect(validateDocument(next).valid).toBe(true);
    expect(document).toEqual(snapshot);
  });
});
