# 输入事件（第一版）

输入事件负责把浏览器编辑意图转换为模型 transaction。当前阶段已接入 `beforeinput insertText` 和 collapsed selection 下的 Backspace。

## 当前范围

- 监听 `beforeinput`。
- 支持 `insertText` 文本输入。
- 使用 DOM Selection 转换得到模型 `RangeSelection`。
- 使用 `createInsertTextInputTransaction` 创建 transaction。
- 使用 `applyTransaction` 更新文档模型。
- 通过 `onChange` 输出最新 `DocumentNode`。
- 输入后通过 `createSelectionAfterInsertTextInput` 计算新的折叠选区。
- 支持 collapsed selection 下的 Backspace。
- 段中 Backspace 会删除光标前一个字符。
- 段首 Backspace 会合并上一段。
- Backspace 后通过 `createSelectionAfterBackspaceInput` 计算新的折叠选区。

## 数据流

```text
beforeinput
  -> 读取输入文本 data
  -> 读取浏览器 Selection
  -> domSelectionToModelSelection
  -> createInsertTextInputTransaction
  -> applyTransaction
  -> onChange(nextDocument)
  -> onSelectionChange(nextSelection)
```

`RichTextEditor` 会阻止浏览器默认 DOM 修改，避免直接信任 contenteditable 生成的 DOM 结果。模型更新只通过 operation 和 transaction 完成。

Backspace 当前走 `keydown` 入口：

```text
keydown Backspace
  -> 读取浏览器 Selection
  -> domSelectionToModelSelection
  -> createBackspaceInputTransaction
  -> applyTransaction
  -> onChange(nextDocument)
  -> onSelectionChange(nextSelection)
```

## Core API

```ts
interface InsertTextInput {
  data: string;
  selection: RangeSelection;
}

function createInsertTextInputTransaction(input: InsertTextInput): Transaction;

function createSelectionAfterInsertTextInput(input: InsertTextInput): RangeSelection;

interface BackspaceInput {
  document: DocumentNode;
  selection: RangeSelection;
}

function createBackspaceInputTransaction(input: BackspaceInput): Transaction;

function createSelectionAfterBackspaceInput(input: BackspaceInput): RangeSelection;
```

当前 `createInsertTextInputTransaction` 会把输入文本插入到 selection 规范化后的起点。

当前 `createBackspaceInputTransaction` 会根据 collapsed selection 位置创建：

- `delete_text`：光标不在 text 节点开头时删除前一个字符。
- `merge_block`：光标位于非首段段首时合并上一段。
- 空 transaction：光标位于首段段首或 selection 非折叠时。

## React 行为

`RichTextEditor` 当前支持：

- `contentEditable`：开启真实输入入口。
- `onChange`：输入后输出最新文档模型。
- `selection`：受控模型选区。
- `onSelectionChange`：输入后输出新的模型选区。
- `onBeforeInput`：仍会先调用外部回调，若外部已 `preventDefault`，内部不再处理。

## Demo 验收

演示页的主编辑区已经接入真实输入：

- 点击或设置光标后输入文本。
- 在段中按 Backspace 删除前一个字符。
- 在第二段段首按 Backspace 合并上一段。
- 文档 JSON 会跟随输入更新。
- 渲染预览会使用最新模型重渲染。
- 选区 JSON 会折叠到插入文本后。

## 当前限制

- 仅支持普通 `insertText` 和 collapsed selection 下的 Backspace。
- 非折叠选区当前不会替换选中内容，只使用规范化后的起点插入。
- 暂不处理 Delete、Enter、粘贴、拖拽或格式输入。
- Backspace 暂不处理非折叠 selection、跨 text 删除或 inline text 节点合并。
- 暂不处理 IME composition 的完整生命周期。
- 暂不包含 undo/redo 或 history 记录。
