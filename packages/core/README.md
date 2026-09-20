# @crucialy-rich/core

自研富文本编辑内核，不依赖 ProseMirror、Tiptap、Lexical、Slate 作为运行时内核。

> 当前已完成第 1–24 周能力闭环，提供文本、void、list、image 和可编辑 table 文档模型，以及语义渲染、文字样式、链接、模型选区、Operation、Transaction、Command、History、Clipboard parser、输入法状态、编辑快捷键和 Markdown 输入规则。

## 安装

```sh
pnpm add @crucialy-rich/core@^0.1.0
```

要求 Node.js `>=22.14.0 <23`。

## 使用

```ts
import {
  createDocument,
  createHeading,
  addTextMark,
  applyTransaction,
  BOLD_COMMAND_NAME,
  createParagraph,
  createBackspaceInputTransaction,
  createDeleteInputTransaction,
  createDeleteTextOperation,
  createEnterInputTransaction,
  createDefaultCommandRegistry,
  createHistorySnapshot,
  createHistoryState,
  createInsertTextInputTransaction,
  createMergeBlockOperation,
  createSetBlockTypeOperation,
  createTransaction,
  createTransactionAcceptanceReport,
  createText,
  createInsertTextOperation,
  createSplitBlockOperation,
  createToggleMarkOperation,
  executeCommand,
  getCommandNameFromShortcut,
  getTextMarkAttribute,
  getTextInRange,
  ITALIC_COMMAND_NAME,
  normalizeTextMarks,
  normalizeDocument,
  queryCommandState,
  recordHistory,
  setTextMarkAttribute,
  setTextMark,
  STRIKE_COMMAND_NAME,
  undoHistory,
  UNDERLINE_COMMAND_NAME,
  toggleTextMark,
  validateDocument,
} from "@crucialy-rich/core";

const document = createDocument([
  createParagraph([createText("你好，crucialy-rich。", { bold: true })]),
]);
const headingOperation = createSetBlockTypeOperation([0], {
  level: 2,
  type: "heading",
});
const marks = toggleTextMark(
  addTextMark(normalizeTextMarks({ bold: true }), "italic"),
  "bold",
);
const activeMarks = setTextMark(marks, "bold", true);
const styledMarks = setTextMarkAttribute(activeMarks, "fontSize", 18);
const fontSize = getTextMarkAttribute(styledMarks, "fontSize");

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
const boldOperation = createToggleMarkOperation(
  {
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [0, 0], offset: 5 },
  },
  "bold",
);
const transaction = createTransaction([
  operation,
  deleteOperation,
  boldOperation,
  headingOperation,
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
const commandRegistry = createDefaultCommandRegistry();
const commandState = queryCommandState(commandRegistry, "insertText", {
  context: {
    document: normalized,
    selection: {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 0 },
    },
  },
  payload: {
    text: "新",
  },
});
const boldResult = executeCommand(commandRegistry, BOLD_COMMAND_NAME, {
  context: {
    document: normalized,
    selection: {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 5 },
    },
  },
});
const italicResult = executeCommand(commandRegistry, ITALIC_COMMAND_NAME, {
  context: {
    document: normalized,
    selection: {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 5 },
    },
  },
});
const underlineResult = executeCommand(commandRegistry, UNDERLINE_COMMAND_NAME, {
  context: {
    document: normalized,
    selection: {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 5 },
    },
  },
});
const strikeResult = executeCommand(commandRegistry, STRIKE_COMMAND_NAME, {
  context: {
    document: normalized,
    selection: {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 5 },
    },
  },
});
const history = recordHistory({
  after: createHistorySnapshot(nextDocument),
  batch: "typing",
  before: createHistorySnapshot(normalized),
  history: createHistoryState(),
  transaction,
});
const undoChange = undoHistory(history);
const shortcutCommandName = getCommandNameFromShortcut({
  ctrlKey: true,
  key: "b",
});
```

## 当前 API 范围

- 文档模型：`DocumentNode`、文本/void/list block、`ListItemNode`、`TextNode`、marks 及对应类型常量。
- 创建和判断：`createDocument`、`createParagraph`、`createHeading`、`createQuote`、`createCodeBlock`、`createDivider`、`createText` 及对应 text/block/void 类型守卫。
- 文字标记：`normalizeTextMarks`、`hasTextMark`、`addTextMark`、`removeTextMark`、`setTextMark`、`toggleTextMark`、`isValidTextMarkAttributeValue`、`isValidFontSize`、`sanitizeHexColor`、`MIN_FONT_SIZE`、`MAX_FONT_SIZE`、`getTextMarkAttribute`、`setTextMarkAttribute`、`removeTextMarkAttribute`、`areTextMarksEqual`、`mergeAdjacentTextNodes`。
- 链接标记：`LinkMarkAttributes`、`LinkTarget`、`LinkRelToken`、`LINK_PROTOCOLS`、`LINK_TARGETS`、`LINK_REL_TOKENS`、`sanitizeLinkHref`、`normalizeLinkTarget`、`normalizeLinkRel`、`normalizeLinkMark`、`isValidLinkMark`、`areLinkMarksEqual`、`getLinkMark`、`setLinkMark`、`removeLinkMark`。
- 链接功能命名空间：`link` 集中提供 Link Mark、安全处理、`set_link` operation 和链接 command；原有平铺导出保持可用。
- 校验和修复：`validateDocument`、`normalizeDocument`。
- 选区：`Path`、`Point`、`RangeSelection`、`cloneRangeSelection`、`getNodeAtPath`、`isValidPoint`、`normalizeRange`、`getBlockTextOffset`、`getPointAtBlockTextOffset`、`getTextInRange`、`splitTextByRange`、`getSelectedBlockIndexes`、`doSelectedBlocksMatch`；旧 `ParagraphTextOffset` 名称保留为兼容别名。
- 基础渲染：`renderDocument`、`renderNodeToHtml`、`MODEL_PATH_ATTRIBUTE`、`encodeModelPath`、`decodeModelPath`。
- DOM 映射：`domPointToModelPoint`、`modelPointToDomPoint`、`findElementByModelPath`、`findClosestModelPathElement`。
- 选区同步：`domSelectionToModelSelection`、`createDomRangeFromModelSelection`、`applyModelSelectionToDom`。
- Operation：文本、Mark、链接和 Block Type operation，以及同容器 `delete_text`、跨顶层文本块 `delete_range`、`split_block`、`merge_block`、通用 `insert_block` 与 `remove_block`。
- Transaction：`createTransaction`、`applyOperation`、`applyTransaction`、`summarizeOperation`、`summarizeTransaction`、`createTransactionAcceptanceReport`。
- 输入：基础文本输入与删除 helper、Composition 状态机、`getEditorShortcutAction`、`findMarkdownInputRule` 和 `createMarkdownInputRuleResult`。
- 当前输入与 command 管线覆盖普通文本插入、同容器跨 text 与连续顶层文本块选区编辑、非折叠 Enter、段中删除、文本块合并/分裂、CodeBlock 换行/退出、相邻 void block 删除和输入后 selection 落点。
- Command：默认注册表、状态查询、文字样式、链接、Heading、Quote、CodeBlock、Divider、BulletList、OrderedList、文本与 block command。
- History：`createHistorySnapshot`、`cloneHistorySnapshot`、`createHistoryEntry`、`cloneHistoryEntry`、`createHistoryState`、`clearHistory`、`recordHistory`、`canMergeHistoryEntries`、`mergeHistoryEntries`、`canUndo`、`canRedo`、`getUndoEntry`、`getRedoEntry`、`undoHistory`、`redoHistory`、`getHistoryShortcutAction`、`undoCommand`、`redoCommand`。

## 构建产物

```sh
pnpm --filter @crucialy-rich/core build
```

构建输出位于 `dist`，包含 ESM `index.js`、`index.js.map` 和 `index.d.ts`。包通过 `exports` 同时声明 `types`、`import` 和 `default` 入口，并标记 `sideEffects: false`。

## 许可

[MIT](./LICENSE) © QDyanbing
