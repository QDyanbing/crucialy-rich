import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createImage,
  createParagraph,
  createText,
  getNodeAtPath,
  insertTextCommand,
  isValidPoint,
  parseHtml,
  parseMarkdown,
  pasteCommand,
  recordHistory,
  redoHistory,
  undoHistory,
  validateDocument,
} from "../../src";

for (const format of ["html", "markdown"] as const) {
  describe(`${format} mixed image paste history`, () => {
    for (const trailingImage of [false, true]) {
      it.each(["forward", "backward"])(
        `restores a %s range with trailing image: ${trailingImage}`,
        (direction) => {
          const document = createDocument([
            createParagraph([createText("开旧", { bold: true })]),
            createParagraph([createText("旧尾", { italic: true })]),
          ]);
          const start = { path: [0, 0], offset: 1 };
          const end = { path: [1, 0], offset: 1 };
          const selection = {
            anchor: direction === "forward" ? start : end,
            focus: direction === "forward" ? end : start,
          };
          const fragment =
            format === "html"
              ? parseHtml(
                  `<p><b>前</b><img src="https://example.com/mixed.png" alt="配图">${trailingImage ? "" : "<i>后</i>"}</p>`,
                )
              : parseMarkdown(
                  `**前**![配图](https://example.com/mixed.png)${trailingImage ? "" : "*后*"}`,
                );
          const result = pasteCommand.execute({
            context: { document, selection },
            payload: { fragment: fragment! },
          });
          expect(result.status).toBe("success");
          const after = applyTransaction(document, result.transaction!);
          expect(after).toEqual(
            createDocument([
              createParagraph([createText("开", { bold: true })]),
              createParagraph([createText("前", { bold: true })]),
              createImage("https://example.com/mixed.png", { alt: "配图" }),
              ...(trailingImage
                ? []
                : [createParagraph([createText("后", { italic: true })])]),
              createParagraph([
                createText("", { bold: true }),
                createText("尾", { italic: true }),
              ]),
            ]),
          );
          const point = { path: [3, 0], offset: trailingImage ? 0 : 1 };
          expect(result.selection).toEqual({ anchor: point, focus: point });
          expect(isValidPoint(after, point)).toBe(true);
          expect(validateDocument(after).valid).toBe(true);
          const history = recordHistory({
            after: createHistorySnapshot(after, result.selection!),
            before: createHistorySnapshot(document, selection),
            history: createHistoryState(),
            transaction: result.transaction!,
          });
          expect(history.undoStack).toHaveLength(1);
          const undone = undoHistory(history)!;
          expect(undone.document).toEqual(document);
          expect(undone.selection).toEqual(selection);
          const redone = redoHistory(undone.history)!;
          expect(redone.document).toEqual(after);
          expect(redone.selection).toEqual(result.selection);
          const typing = insertTextCommand.execute({
            context: { document: after, selection: result.selection! },
            payload: { text: "续" },
          });
          const typed = applyTransaction(after, typing.transaction!);
          if (trailingImage) {
            expect(typed.children[3]).toEqual(
              createParagraph([
                createText("续", { bold: true }),
                createText("尾", { italic: true }),
              ]),
            );
          } else {
            expect(getNodeAtPath(typed, [3, 0])).toMatchObject({ text: "后续" });
          }
        },
      );
    }
  });
}
