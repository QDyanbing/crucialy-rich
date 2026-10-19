import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  canExecutePasteCommand,
  createCodeBlock,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createText,
  DEFAULT_CLIPBOARD_PARSERS,
  isValidPoint,
  parseClipboardData,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
  validateDocument,
} from "../../src";

describe("Office fallback paste transaction and history", () => {
  it.each(["forward", "backward"])(
    "replaces a %s cross-block range in one history entry",
    (direction) => {
      const document = createDocument([
        createParagraph([createText("开头", { bold: true })]),
        createParagraph([createText("结尾", { italic: true })]),
      ]);
      const start = { path: [0, 0], offset: 1 };
      const end = { path: [1, 0], offset: 1 };
      const selection = {
        anchor: direction === "forward" ? start : end,
        focus: direction === "forward" ? end : start,
      };
      const context = { document, selection };
      const fragment = parseClipboardData(
        {
          types: ["text/markdown", "text/html", "text/plain"],
          getData: (type) =>
            type === "text/html"
              ? '<h1 class="MsoNormal">rich</h1>'
              : type === "text/markdown"
                ? "# heading"
                : "甲\r\n\r\n乙",
        },
        DEFAULT_CLIPBOARD_PARSERS,
        (candidate) =>
          canExecutePasteCommand({ context, payload: { fragment: candidate } }),
      );
      expect(fragment?.mimeType).toBe("text/plain");
      const result = pasteCommand.execute({
        context,
        payload: { fragment: fragment! },
      });
      expect(result.status).toBe("success");
      const after = applyTransaction(document, result.transaction!);
      expect(
        after.children.map((block) =>
          "children" in block
            ? block.children
                .map((child) => ("text" in child ? child.text : ""))
                .join("")
            : "",
        ),
      ).toEqual(["开甲", "", "乙尾"]);
      expect(JSON.stringify(after)).not.toContain("rich");
      expect(validateDocument(after).valid).toBe(true);
      expect(isValidPoint(after, result.selection!.anchor)).toBe(true);
      const history = recordHistory({
        history: createHistoryState(),
        before: createHistorySnapshot(document, selection),
        after: createHistorySnapshot(after, result.selection!),
        transaction: result.transaction!,
      });
      expect(history.undoStack).toHaveLength(1);
      const undone = undoHistory(history)!;
      expect(undone.document).toEqual(document);
      expect(undone.selection).toEqual(selection);
      const redone = redoHistory(undone.history)!;
      expect(redone.document).toEqual(after);
      expect(redone.selection).toEqual(result.selection);
    },
  );

  it("keeps Office whitespace literal inside a code block", () => {
    const document = createDocument([createCodeBlock([createText("前后")])]);
    const point = { path: [0, 0], offset: 1 };
    const context = { document, selection: { anchor: point, focus: point } };
    const fragment = parseClipboardData(
      {
        types: ["text/html", "text/plain"],
        getData: (type) =>
          type === "text/html"
            ? '<p style="mso-list:l0">rich</p>'
            : "<b>甲</b>\r\n\t乙\n",
      },
      DEFAULT_CLIPBOARD_PARSERS,
    );
    const result = pasteCommand.execute({ context, payload: { fragment: fragment! } });
    expect(result.transaction?.operations.map((operation) => operation.type)).toEqual([
      "insert_text",
    ]);
    expect(applyTransaction(document, result.transaction!)).toEqual(
      createDocument([createCodeBlock([createText("前<b>甲</b>\n\t乙\n后")])]),
    );
    expect(result.selection?.anchor).toEqual({ path: [0, 0], offset: 13 });
  });
});
