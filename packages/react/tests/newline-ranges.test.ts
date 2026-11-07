// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  createTable,
  createDefaultCommandRegistry,
  executeCommand,
  applyTransaction,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe.each(["insertParagraph", "insertLineBreak"])(
  "native %s range replacement",
  (type) => {
    for (const kind of ["marks", "blocks", "cell"]) {
      it.each([false, true])(
        `keeps ${kind} boundaries and direction snapshots (%s)`,
        (reverse) => {
          const paragraphs = [
            createParagraph([createText("前甲", { bold: true })]),
            createParagraph([createText("乙后", { italic: true })]),
          ];
          const table = createTable(1, 2);
          table.children[0]!.children[0]!.children = paragraphs;
          const value =
            kind === "cell"
              ? createDocument([table])
              : kind === "marks"
                ? createDocument([
                    createParagraph([
                      ...paragraphs[0]!.children,
                      ...paragraphs[1]!.children,
                    ]),
                  ])
                : createDocument(paragraphs);
          const first = { path: kind === "cell" ? [0, 0, 0, 0, 0] : [0, 0], offset: 1 };
          const last = {
            path:
              kind === "cell" ? [0, 0, 0, 1, 0] : kind === "marks" ? [0, 1] : [1, 0],
            offset: 1,
          };
          const selection = reverse
            ? { anchor: last, focus: first }
            : { anchor: first, focus: last };
          const host = mountDeletionEditor(value, first);
          const element = (path: number[]) =>
            host.editor.querySelector(`[data-crucialy-path="${JSON.stringify(path)}"]`)!
              .firstChild!;
          window
            .getSelection()!
            .setBaseAndExtent(
              element(selection.anchor.path),
              1,
              element(selection.focus.path),
              1,
            );
          const result = executeCommand(
            createDefaultCommandRegistry(),
            type === "insertParagraph" ? "splitBlock" : "insertText",
            {
              context: { document: value, selection },
              ...(type === "insertLineBreak" ? { payload: { text: "\n" } } : {}),
            },
          );
          host.nativeInput(type);
          expect(host.ref.current!.getDocument()).toEqual(
            applyTransaction(value, result.transaction!),
          );
          const event = host.onTransaction.mock.calls[0]![0];
          expect(event.beforeSelection).toEqual(selection);
          expect(
            event.transaction.operations.map(
              (operation: { type: string }) => operation.type,
            ),
          ).toEqual([
            kind === "marks" ? "delete_text" : "delete_range",
            type === "insertParagraph" ? "split_block" : "insert_text",
          ]);
          if (kind === "cell")
            expect(host.ref.current!.getDocument().children[0]).toMatchObject({
              children: [
                { children: [expect.anything(), table.children[0]!.children[1]] },
              ],
            });
          expect(host.onTransaction).toHaveBeenCalledTimes(1);
        },
      );
    }
  },
);
