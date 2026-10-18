import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  canExecutePasteCommand,
  createCodeBlock,
  createDivider,
  createDocument,
  createParagraph,
  createTable,
  createText,
  parsePlainText,
  pasteCommand,
  validateDocument,
} from "../../src";

describe("CodeBlock paste selection boundaries", () => {
  it.each(["forward", "backward"])(
    "replaces a %s cross-text range without splitting code",
    (direction) => {
      const document = createDocument([
        createCodeBlock([createText("开头"), createText("结尾")]),
      ]);
      const start = { path: [0, 0], offset: 1 };
      const end = { path: [0, 1], offset: 1 };
      const result = pasteCommand.execute({
        context: {
          document,
          selection: {
            anchor: direction === "forward" ? start : end,
            focus: direction === "forward" ? end : start,
          },
        },
        payload: { fragment: parsePlainText("甲\n乙")! },
      });
      expect(applyTransaction(document, result.transaction!)).toEqual(
        createDocument([createCodeBlock([createText("开甲\n乙尾")])]),
      );
      expect(result.transaction?.operations.map((operation) => operation.type)).toEqual(
        ["delete_text", "insert_text"],
      );
      expect(result.selection?.anchor).toEqual({ path: [0, 0], offset: 4 });
    },
  );

  it.each(["forward", "backward"])(
    "replaces a %s range starting in code and ending in marked prose",
    (direction) => {
      const document = createDocument([
        createParagraph([createText("前方")]),
        createCodeBlock([createText("开头")]),
        createParagraph([createText("结尾", { bold: true })]),
        createParagraph([createText("后方")]),
      ]);
      const start = { path: [1, 0], offset: 1 };
      const end = { path: [2, 0], offset: 1 };
      const result = pasteCommand.execute({
        context: {
          document,
          selection: {
            anchor: direction === "forward" ? start : end,
            focus: direction === "forward" ? end : start,
          },
        },
        payload: { fragment: parsePlainText("甲\n乙")! },
      });
      const next = applyTransaction(document, result.transaction!);
      expect(next).toEqual(
        createDocument([
          document.children[0]!,
          createCodeBlock([createText("开甲\n乙尾")]),
          document.children[3]!,
        ]),
      );
      expect(result.transaction?.operations.map((operation) => operation.type)).toEqual(
        ["delete_range", "insert_text"],
      );
      expect(result.selection?.anchor).toEqual({ path: [1, 0], offset: 4 });
      expect(validateDocument(next).valid).toBe(true);
    },
  );

  it.each([
    {
      before: "line\n",
      start: 5,
      end: 5,
      paste: "\n\n",
      after: "line\n\n\n",
      offset: 7,
    },
    { before: "开头\n结尾", start: 0, end: 5, paste: "\n", after: "\n", offset: 1 },
    { before: "前后", start: 1, end: 1, paste: "😀\nX", after: "前😀\nX后", offset: 5 },
  ])(
    "retains literal whitespace and UTF-16 offsets for $paste",
    ({ before, start, end, paste, after, offset }) => {
      const document = createDocument([createCodeBlock([createText(before)])]);
      const result = pasteCommand.execute({
        context: {
          document,
          selection: {
            anchor: { path: [0, 0], offset: start },
            focus: { path: [0, 0], offset: end },
          },
        },
        payload: { fragment: parsePlainText(paste)! },
      });
      expect(applyTransaction(document, result.transaction!)).toEqual(
        createDocument([createCodeBlock([createText(after)])]),
      );
      expect(result.selection?.anchor).toEqual({ path: [0, 0], offset });
    },
  );

  it.each([createDivider(), createTable(1, 1)])(
    "rejects a range across $type",
    (boundary) => {
      const document = createDocument([
        createCodeBlock([createText("开头")]),
        boundary,
        createParagraph([createText("结尾")]),
      ]);
      const input = {
        context: {
          document,
          selection: {
            anchor: { path: [0, 0], offset: 1 },
            focus: { path: [2, 0], offset: 1 },
          },
        },
        payload: { fragment: parsePlainText("甲\n乙")! },
      };
      expect(canExecutePasteCommand(input)).toBe(false);
      expect(pasteCommand.execute(input).transaction).toBeUndefined();
    },
  );
});
