// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  createQuote,
  createCodeBlock,
  createBulletList,
  createOrderedList,
  createListItem,
  createTaskList,
  createTaskItem,
  createTable,
  createDefaultCommandRegistry,
  executeCommand,
  applyTransaction,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

function fixture(kind: string) {
  const nodes = [createText("AB", { bold: true })];
  let block,
    path,
    offset = 1;
  if (kind === "bullet") {
    block = createBulletList([createListItem(nodes)]);
    path = [0, 0, 0];
  } else if (kind === "ordered") {
    block = createOrderedList([createListItem(nodes)], 7);
    path = [0, 0, 0];
  } else if (kind === "task") {
    block = createTaskList([createTaskItem(nodes, true)]);
    path = [0, 0, 0];
  } else if (kind === "nested") {
    block = createBulletList([
      createListItem(
        [createText("父项")],
        createTaskList([createTaskItem(nodes, true)]),
      ),
    ]);
    path = [0, 0, 1, 0, 0];
  } else if (kind === "empty-quote") {
    block = createQuote();
    path = [0, 0];
    offset = 0;
  } else if (kind === "code-exit") {
    block = createCodeBlock([createText("A\n")]);
    path = [0, 0];
    offset = 2;
  } else {
    block = createTable(1, 2);
    block.children[0]!.children[0]!.children = [
      createParagraph(nodes),
      createParagraph([createText("邻段")]),
    ];
    path = [0, 0, 0, 0, 0];
  }
  return {
    value: createDocument([block, createParagraph([createText("邻块")])]),
    point: { path, offset },
  };
}

describe.each(["insertParagraph", "insertLineBreak"])(
  "native %s structured containers",
  (type) => {
    it.each([
      "bullet",
      "ordered",
      "task",
      "nested",
      "empty-quote",
      "code-exit",
      "cell",
    ])("follows the existing command contract in %s", (kind) => {
      const { value, point } = fixture(kind);
      const original = structuredClone(value);
      const selection = { anchor: point, focus: point };
      const command = executeCommand(
        createDefaultCommandRegistry(),
        type === "insertParagraph" ? "splitBlock" : "insertText",
        {
          context: { document: value, selection },
          ...(type === "insertLineBreak" ? { payload: { text: "\n" } } : {}),
        },
      );
      expect(command.ok).toBe(true);
      const host = mountDeletionEditor(value, point);
      expect(host.nativeInput(type).defaultPrevented).toBe(true);
      expect(host.ref.current!.getDocument()).toEqual(
        applyTransaction(value, command.transaction!),
      );
      expect(host.onSelectionChange.mock.calls[0]![0]).toEqual(command.selection);
      const event = host.onTransaction.mock.calls[0]![0];
      expect(event.inputType).toBe(type);
      expect(event).not.toHaveProperty("batch");
      expect(host.ref.current!.getDocument().children.at(-1)).toEqual(
        original.children.at(-1),
      );
      if (kind === "empty-quote")
        expect(host.ref.current!.getDocument().children[0]!.type).toBe(
          type === "insertParagraph" ? "paragraph" : "quote",
        );
      if (kind === "code-exit")
        expect(host.ref.current!.getDocument().children).toHaveLength(
          type === "insertParagraph" ? 3 : 2,
        );
      expect(value).toEqual(original);
    });
  },
);
