# @crucialy-rich/core

自研富文本编辑内核，不依赖 ProseMirror、Tiptap、Lexical、Slate 作为运行时内核。

> 当前处于早期阶段，已提供文档模型、模型选区、基础渲染器、DOM 与模型位置映射、选区双向同步、`insertText` operation 和同 text 节点内的 `deleteText` operation，尚未提供完整编辑命令。

## 安装

```sh
pnpm add @crucialy-rich/core
```

## 使用

```ts
import {
  createDocument,
  applyInsertText,
  applyDeleteText,
  createParagraph,
  createDeleteTextOperation,
  createText,
  createInsertTextOperation,
  getTextInRange,
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
const nextDocument = applyInsertText(normalized, operation);
const deleteOperation = createDeleteTextOperation({
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 2 },
});
const deletedDocument = applyDeleteText(nextDocument, deleteOperation);
```

## 当前 API 范围

- 文档模型：`DocumentNode`、`BlockNode`、`ParagraphNode`、`TextNode`。
- 创建和判断：`createDocument`、`createParagraph`、`createText`、`isTextNode`、`isBlockNode`、`isDocumentNode`。
- 校验和修复：`validateDocument`、`normalizeDocument`。
- 选区：`Path`、`Point`、`RangeSelection`、`getNodeAtPath`、`isValidPoint`、`normalizeRange`、`getTextInRange`、`splitTextByRange`。
- 基础渲染：`renderDocument`、`renderNodeToHtml`、`MODEL_PATH_ATTRIBUTE`、`encodeModelPath`、`decodeModelPath`。
- DOM 映射：`domPointToModelPoint`、`modelPointToDomPoint`、`findElementByModelPath`、`findClosestModelPathElement`。
- 选区同步：`domSelectionToModelSelection`、`createDomRangeFromModelSelection`、`applyModelSelectionToDom`。
- Operation：`createInsertTextOperation`、`applyInsertText`、`createSelectionAfterInsertText`、`createDeleteTextOperation`、`applyDeleteText`、`createSelectionAfterDeleteText`。

## 许可

[MIT](./LICENSE) © QDyanbing
