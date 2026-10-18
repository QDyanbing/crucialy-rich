import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  canExecutePasteCommand,
  createCodeBlock,
  createDocument,
  createParagraph,
  createText,
  parsePlainText,
  pasteCommand,
  validateDocument,
} from "../../src";

describe("plain text paste into CodeBlock", () => {
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
