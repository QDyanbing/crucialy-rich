import {
  createCodeBlock,
  createDivider,
  createDocument,
  createHeading,
  createHistorySnapshot,
  createImage,
  createInsertBlockOperation,
  createListItem,
  createOrderedList,
  createParagraph,
  createQuote,
  createTable,
  createTaskItem,
  createTaskList,
  createText,
  createTransaction,
  type HistoryEntry,
  type HistorySnapshot,
} from "../../src";

export function isolationEntry(): HistoryEntry {
  const text = () =>
    createText("原文", {
      bold: true,
      fontSize: 18,
      textColor: "#123456",
      link: { href: "https://example.com/original", target: "_blank" },
    });
  const table = createTable(1, 1);
  table.children[0]!.children[0]!.children = [
    createParagraph([text()]),
    createParagraph([createText("第二段")]),
  ];
  const list = createTaskList([
    createTaskItem([text()], true, createOrderedList([createListItem([text()])], 7)),
  ]);
  const document = createDocument([
    createParagraph([text()]),
    list,
    table,
    createImage("https://example.com/image.png", { width: 320, alt: "原图" }),
    createDivider(),
    createCodeBlock([createText("代码\n原文")]),
    createHeading(2, [text()]),
    createQuote([text()]),
  ]);
  const range = {
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [0, 0], offset: 2 },
  };
  return {
    before: createHistorySnapshot(document, range, { type: "block", path: [3] }),
    after: createHistorySnapshot(document, range, { type: "block", path: [3] }),
    batch: "fixture",
    transaction: createTransaction([
      createInsertBlockOperation([1], list),
      { type: "set_link", range, link: { href: "https://example.com/updated" } },
    ]),
  };
}

export function mutateSnapshot(snapshot: HistorySnapshot): void {
  for (const block of snapshot.document.children) {
    if (block.type === "taskList") {
      block.children[0]!.checked = false;
      block.children[0]!.children[0]!.text = "修改任务";
      const nested = block.children[0]!.nested;
      if (nested?.type === "orderedList") {
        nested.start = 99;
        nested.children[0]!.children[0]!.marks!.link!.href = "https://changed.test/";
      }
    } else if (block.type === "table") {
      block.children[0]!.children[0]!.children[0]!.children[0]!.marks!.link!.href =
        "https://changed.test/cell";
      block.children[0]!.children[0]!.children.pop();
    } else if (block.type === "image") {
      block.alt = "修改图片";
      block.width = 99;
      block.status = "error";
    } else if (block.type === "heading") {
      block.level = 6;
    } else if (block.type === "paragraph" || block.type === "quote") {
      block.children[0]!.marks!.link!.href = "https://changed.test/text";
      block.children[0]!.text = "修改文字";
    } else if (block.type === "codeBlock") {
      block.children[0]!.text = "修改代码";
    }
  }
  snapshot.selection!.anchor.path[0] = 99;
  snapshot.selection!.focus.offset = 99;
  snapshot.blockSelection!.path[0] = 99;
}

export function mutateEntry(entry: HistoryEntry): void {
  mutateSnapshot(entry.before);
  mutateSnapshot(entry.after);
  entry.batch = "changed";
  const operation = entry.transaction.operations[0]!;
  if (operation.type === "insert_block") {
    operation.path[0] = 99;
    if (operation.block.type === "taskList")
      operation.block.children[0]!.children[0]!.text = "修改操作";
  }
  const linkOperation = entry.transaction.operations[1]!;
  if (linkOperation.type === "set_link") {
    linkOperation.link!.href = "https://changed.test/operation";
    linkOperation.range.anchor.path[0] = 99;
  }
}
