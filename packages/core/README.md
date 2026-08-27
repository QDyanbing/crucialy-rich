# @crucialy-rich/core

自研富文本编辑内核，不依赖 ProseMirror、Tiptap、Lexical、Slate 作为运行时内核。

> 当前处于早期阶段，已提供 paragraph、heading、quote 文档模型、1–6 级 heading 语义渲染与 command、四种 boolean marks 闭环、三种文字属性闭环、结构化 Link Mark 与 URL sanitize、mark 快捷键配置查询、同一 paragraph 内跨 text 的 mark 切分与合并、模型选区、基础渲染器、DOM 与模型位置映射、选区双向同步、基础 operation 与 Transaction、输入 helper、Command 系统、默认 Command 注册表和 History 撤销重做第一版。

## 安装

```sh
pnpm add @crucialy-rich/core
```

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

- 文档模型：`DocumentNode`、`BlockNode`、`ParagraphNode`、`HeadingNode`、`QuoteNode`、`BlockType`、`HeadingLevel`、`TextNode`、`TextMarks`、`BLOCK_TYPES`、`HEADING_LEVELS`、`TEXT_MARK_TYPES`、`TEXT_MARK_ATTRIBUTE_TYPES`。
- 创建和判断：`createDocument`、`createParagraph`、`createHeading`、`createQuote`、`createText`、`isTextNode`、`isParagraphNode`、`isHeadingNode`、`isQuoteNode`、`isBlockNode`、`isDocumentNode`。
- 文字标记：`normalizeTextMarks`、`hasTextMark`、`addTextMark`、`removeTextMark`、`setTextMark`、`toggleTextMark`、`isValidTextMarkAttributeValue`、`isValidFontSize`、`sanitizeHexColor`、`MIN_FONT_SIZE`、`MAX_FONT_SIZE`、`getTextMarkAttribute`、`setTextMarkAttribute`、`removeTextMarkAttribute`、`areTextMarksEqual`、`mergeAdjacentTextNodes`。
- 链接标记：`LinkMarkAttributes`、`LinkTarget`、`LinkRelToken`、`LINK_PROTOCOLS`、`LINK_TARGETS`、`LINK_REL_TOKENS`、`sanitizeLinkHref`、`normalizeLinkTarget`、`normalizeLinkRel`、`normalizeLinkMark`、`isValidLinkMark`、`areLinkMarksEqual`、`getLinkMark`、`setLinkMark`、`removeLinkMark`。
- 链接功能命名空间：`link` 集中提供 Link Mark、安全处理、`set_link` operation 和链接 command；原有平铺导出保持可用。
- 校验和修复：`validateDocument`、`normalizeDocument`。
- 选区：`Path`、`Point`、`RangeSelection`、`cloneRangeSelection`、`getNodeAtPath`、`isValidPoint`、`normalizeRange`、`getParagraphTextOffset`、`getPointAtParagraphTextOffset`、`getTextInRange`、`splitTextByRange`。
- 基础渲染：`renderDocument`、`renderNodeToHtml`、`MODEL_PATH_ATTRIBUTE`、`encodeModelPath`、`decodeModelPath`。
- DOM 映射：`domPointToModelPoint`、`modelPointToDomPoint`、`findElementByModelPath`、`findClosestModelPathElement`。
- 选区同步：`domSelectionToModelSelection`、`createDomRangeFromModelSelection`、`applyModelSelectionToDom`。
- Operation：`createInsertTextOperation`、`applyInsertText`、`createDeleteTextOperation`、`applyDeleteText`、`createToggleMarkOperation`、`applyToggleMark`、`createSetMarkAttributeOperation`、`applySetMarkAttribute`、`createSetLinkOperation`、`applySetLink`、`createSetBlockTypeOperation`、`applySetBlockType`、`createSplitBlockOperation`、`applySplitBlock`、`createMergeBlockOperation`、`applyMergeBlock`。
- Transaction：`createTransaction`、`applyOperation`、`applyTransaction`、`summarizeOperation`、`summarizeTransaction`、`createTransactionAcceptanceReport`。
- 输入：`createInsertTextInputTransaction`、`createSelectionAfterInsertTextInput`、`createBackspaceInputTransaction`、`createSelectionAfterBackspaceInput`、`createDeleteInputTransaction`、`createSelectionAfterDeleteInput`、`createEnterInputTransaction`、`createSelectionAfterEnterInput`。
- 当前输入 helper 覆盖普通文本插入、段中删除、段落合并、段落分裂和输入后 selection 落点。
- Command：`DEFAULT_COMMANDS`、`BOOLEAN_MARK_COMMANDS`、`DEFAULT_COMMAND_SHORTCUTS`、`createDefaultCommandRegistry`、`createCommandRegistry`、`canExecuteCommand`、`executeCommand`、`queryCommandState`、四种 boolean mark command、`setFontSizeCommand`、`setTextColorCommand`、`setBackgroundColorCommand`、`setHeadingCommand`、对应 canExecute/active/选中标题查询 helper、文本与 block command 和对应 command name 常量。
- History：`createHistorySnapshot`、`cloneHistorySnapshot`、`createHistoryEntry`、`cloneHistoryEntry`、`createHistoryState`、`clearHistory`、`recordHistory`、`canMergeHistoryEntries`、`mergeHistoryEntries`、`canUndo`、`canRedo`、`getUndoEntry`、`getRedoEntry`、`undoHistory`、`redoHistory`、`getHistoryShortcutAction`、`undoCommand`、`redoCommand`。

## 许可

[MIT](./LICENSE) © QDyanbing
