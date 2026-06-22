# @crucialy-rich/core

自研富文本编辑内核，不依赖 ProseMirror、Tiptap、Lexical、Slate 作为运行时内核。

> 当前处于早期阶段，已提供文档模型和 model selection 第一版 API，尚未提供编辑命令、DOM 映射或浏览器 selection 同步。

## 安装

```sh
pnpm add @crucialy-rich/core
```

## 使用

```ts
import {
  createDocument,
  createParagraph,
  createText,
  getTextInRange,
  normalizeDocument,
  validateDocument,
} from "@crucialy-rich/core";

const document = createDocument([
  createParagraph([createText("Hello crucialy-rich.")]),
]);

const validation = validateDocument(document);
const normalized = normalizeDocument(document);
const selectedText = getTextInRange(normalized, {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 5 },
});
```

## 当前 API 范围

- 文档模型：`DocumentNode`、`BlockNode`、`ParagraphNode`、`TextNode`。
- 创建和判断：`createDocument`、`createParagraph`、`createText`、`isTextNode`、`isBlockNode`、`isDocumentNode`。
- 校验和修复：`validateDocument`、`normalizeDocument`。
- Selection：`Path`、`Point`、`RangeSelection`、`getNodeAtPath`、`isValidPoint`、`normalizeRange`、`getTextInRange`、`splitTextByRange`。

## 许可

[MIT](./LICENSE) © QDyanbing
