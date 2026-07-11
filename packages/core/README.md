# @crucialy-rich/core

自研富文本编辑内核，不依赖 ProseMirror、Tiptap、Lexical、Slate 作为运行时内核。

> 当前处于早期阶段，已提供文档模型、模型选区、基础渲染器、DOM 与模型位置映射、选区双向同步、`insertText`、`deleteText`、`splitBlock`、`mergeBlock` operation、Transaction、Operation 闭环验收工具、`beforeinput insertText` 输入 helper、Backspace 输入 helper、Delete 输入 helper、Enter 输入 helper、Command 基础接口和文本编辑命令，基础编辑 transaction 与 selection 计算已闭环，尚未提供 block 编辑命令。

## 安装

```sh
pnpm add @crucialy-rich/core
```

## 使用

```ts
import {
  createDocument,
  applyTransaction,
  createParagraph,
  createBackspaceInputTransaction,
  createDeleteInputTransaction,
  createDeleteTextOperation,
  createEnterInputTransaction,
  createCommandRegistry,
  createInsertTextInputTransaction,
  createMergeBlockOperation,
  createTransaction,
  createTransactionAcceptanceReport,
  createText,
  createInsertTextOperation,
  deleteSelectionCommand,
  createSplitBlockOperation,
  getTextInRange,
  insertTextCommand,
  normalizeDocument,
  validateDocument,
} from "@crucialy-rich/core";

const document = createDocument([
  createParagraph([createText("你好，crucialy-rich。")]),
]);

const validation = validateDocument(document);
const normalized = normalizeDocument(document);
const selectedText = getTextInRange(normalized, {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 5 },
});
const operation = createInsertTextOperation({ path: [0, 0], offset: 2 }, "，");
const deleteOperation = createDeleteTextOperation({
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 2 },
});
const splitOperation = createSplitBlockOperation({ path: [0, 0], offset: 2 });
const mergeOperation = createMergeBlockOperation({ path: [1, 0], offset: 0 });
const transaction = createTransaction([
  operation,
  deleteOperation,
  splitOperation,
  mergeOperation,
]);
const nextDocument = applyTransaction(normalized, transaction);
const report = createTransactionAcceptanceReport(normalized, transaction);
const inputTransaction = createInsertTextInputTransaction({
  data: "新",
  selection: {
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [0, 0], offset: 0 },
  },
});
const backspaceTransaction = createBackspaceInputTransaction({
  document: normalized,
  selection: {
    anchor: { path: [0, 0], offset: 1 },
    focus: { path: [0, 0], offset: 1 },
  },
});
const deleteInputTransaction = createDeleteInputTransaction({
  document: normalized,
  selection: {
    anchor: { path: [0, 0], offset: 1 },
    focus: { path: [0, 0], offset: 1 },
  },
});
const enterTransaction = createEnterInputTransaction({
  document: normalized,
  selection: {
    anchor: { path: [0, 0], offset: 1 },
    focus: { path: [0, 0], offset: 1 },
  },
});
const commandRegistry = createCommandRegistry([
  deleteSelectionCommand,
  insertTextCommand,
]);
```

## 当前 API 范围

- 文档模型：`DocumentNode`、`BlockNode`、`ParagraphNode`、`TextNode`。
- 创建和判断：`createDocument`、`createParagraph`、`createText`、`isTextNode`、`isBlockNode`、`isDocumentNode`。
- 校验和修复：`validateDocument`、`normalizeDocument`。
- 选区：`Path`、`Point`、`RangeSelection`、`getNodeAtPath`、`isValidPoint`、`normalizeRange`、`getTextInRange`、`splitTextByRange`。
- 基础渲染：`renderDocument`、`renderNodeToHtml`、`MODEL_PATH_ATTRIBUTE`、`encodeModelPath`、`decodeModelPath`。
- DOM 映射：`domPointToModelPoint`、`modelPointToDomPoint`、`findElementByModelPath`、`findClosestModelPathElement`。
- 选区同步：`domSelectionToModelSelection`、`createDomRangeFromModelSelection`、`applyModelSelectionToDom`。
- Operation：`createInsertTextOperation`、`applyInsertText`、`createSelectionAfterInsertText`、`createDeleteTextOperation`、`applyDeleteText`、`createSelectionAfterDeleteText`、`createSplitBlockOperation`、`applySplitBlock`、`createSelectionAfterSplitBlock`、`createMergeBlockOperation`、`applyMergeBlock`、`createSelectionAfterMergeBlock`。
- Transaction：`createTransaction`、`applyOperation`、`applyTransaction`、`summarizeOperation`、`summarizeTransaction`、`createTransactionAcceptanceReport`。
- 输入：`createInsertTextInputTransaction`、`createSelectionAfterInsertTextInput`、`createBackspaceInputTransaction`、`createSelectionAfterBackspaceInput`、`createDeleteInputTransaction`、`createSelectionAfterDeleteInput`、`createEnterInputTransaction`、`createSelectionAfterEnterInput`。
- 当前输入 helper 覆盖普通文本插入、段中删除、段落合并、段落分裂和输入后 selection 落点。
- Command：`createCommandRegistry`、`canExecuteCommand`、`executeCommand`、`createCommandSuccess`、`createCommandFailure`、`createCommandSkipped`、`insertTextCommand`、`deleteSelectionCommand`、`INSERT_TEXT_COMMAND_NAME`、`DELETE_SELECTION_COMMAND_NAME`。

## 许可

[MIT](./LICENSE) © QDyanbing
