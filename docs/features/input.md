# 输入事件（第一版）

输入事件负责把浏览器编辑意图转换为模型 transaction。当前阶段已接入 `beforeinput insertText`、Backspace、Delete 和 Enter；同一文本容器或连续顶层文本块中的非折叠选区可以通过输入、删除或 Enter 完成替换、删除与分段。

## 当前范围

- 监听 `beforeinput`。
- 支持 `insertText` 文本输入。
- collapsed selection 直接插入；受支持的非折叠 selection 先删除选区再插入。
- 使用 DOM Selection 转换得到模型 `RangeSelection`。
- 使用 `createInsertTextInputTransaction` 创建 transaction。
- 使用 `applyTransaction` 更新文档模型。
- 通过 `onChange` 输出最新 `DocumentNode`。
- 输入后通过 `createSelectionAfterInsertTextInput` 计算新的折叠选区。
- 支持 collapsed selection 下的 Backspace。
- 支持同一文本容器及连续顶层文本块 selection 的 Backspace 删除。
- 段中 Backspace 会删除光标前一个字符。
- 段首 Backspace 会合并上一段。
- 文本块开头的 Backspace 会删除紧邻的前一个 void block，并修正 block path。
- Backspace 后通过 `createSelectionAfterBackspaceInput` 计算新的折叠选区。
- 支持 collapsed selection 下的 Delete。
- 支持同一文本容器及连续顶层文本块 selection 的 Delete 删除。
- 段中 Delete 会删除光标后一个字符。
- 段尾 Delete 会合并下一段。
- 文本块末尾的 Delete 会删除紧邻的后一个 void block，并保持当前 Point。
- Delete 后通过 `createSelectionAfterDeleteInput` 计算新的折叠选区。
- 支持 collapsed selection，以及同一文本容器或连续顶层文本块 selection 下的 Enter。
- 非折叠 selection 会先通过共享范围删除计划折叠到起点，再执行当前位置的 Enter 规则。
- block 首部、中间、尾部和空 block Enter 会分裂当前 block，并保留 block type、heading level 和 text marks。
- 空 Quote 的 Enter 会原地转为 paragraph；非空 Quote 仍分裂为两个 Quote。
- CodeBlock 内 Enter 插入换行；末尾已有换行时再次 Enter 会退出到 paragraph。
- 列表项内 Enter 分裂当前项；空列表项 Enter 退出为 paragraph。
- 嵌套空列表项 Enter 提升一级；任务项分裂出的新项目默认未完成。
- 列表项按 Tab 缩进，按 Shift+Tab 反缩进，最多三层。
- 顶层列表项开头按 Backspace 转为 paragraph；嵌套项开头按 Backspace 提升一级。
- Enter 后通过 `createSelectionAfterEnterInput` 计算新的折叠选区。
- 支持完整 Composition 生命周期；候选阶段不修改模型，结束时提交一次 `insertCompositionText` transaction。
- 支持 boolean mark、标题、引用和两种列表快捷键，并在组合输入期间暂停执行。
- 支持 paragraph 开头的标题、列表、引用和代码块 Markdown 输入规则。

## 数据流

```text
beforeinput
  -> 读取输入文本 data
  -> 读取浏览器 Selection
  -> domSelectionToModelSelection
  -> executeCommand(insertTextCommand)
  -> applyTransaction
  -> onChange(nextDocument)
  -> onTransaction({ before, after, transaction, batch: "typing" })
  -> onSelectionChange(nextSelection)
```

`RichTextEditor` 会阻止浏览器默认 DOM 修改，避免直接信任 contenteditable 生成的 DOM 结果。模型更新只通过 operation 和 transaction 完成。

Backspace、Delete、Enter 和列表 Tab 当前走 `keydown` 入口；非折叠 selection 下的 Backspace/Delete 会先尝试 `deleteSelectionCommand`，Enter 会先尝试 `splitBlockCommand`，段首 Backspace 会先尝试 `mergeBlockCommand`：

```text
keydown Backspace/Delete/Enter
  -> 读取浏览器 Selection
  -> domSelectionToModelSelection
  -> 非折叠 Backspace/Delete 优先 executeCommand(deleteSelectionCommand)
  -> Enter 优先 executeCommand(splitBlockCommand)
  -> 段首 Backspace 优先 executeCommand(mergeBlockCommand)
  -> createBackspaceInputTransaction / createDeleteInputTransaction / createEnterInputTransaction
  -> applyTransaction
  -> onChange(nextDocument)
  -> onTransaction({ before, after, transaction })
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

interface DeleteInput {
  document: DocumentNode;
  selection: RangeSelection;
}

function createDeleteInputTransaction(input: DeleteInput): Transaction;

function createSelectionAfterDeleteInput(input: DeleteInput): RangeSelection;

interface EnterInput {
  document: DocumentNode;
  selection: RangeSelection;
}

function createEnterInputTransaction(input: EnterInput): Transaction;

function createSelectionAfterEnterInput(input: EnterInput): RangeSelection;

interface TabInput {
  document: DocumentNode;
  selection: RangeSelection;
  shiftKey?: boolean;
}

function createTabInputTransaction(input: TabInput): Transaction;

function createSelectionAfterTabInput(input: TabInput): RangeSelection;
```

当前 `createInsertTextInputTransaction` 会把输入文本插入到 selection 规范化后的起点。

当前 `createBackspaceInputTransaction` 会根据 collapsed selection 位置创建：

- `delete_text`：光标不在 text 节点开头时删除前一个字符。
- `merge_block`：光标位于非首段段首时合并上一段。
- 空 transaction：光标位于首段段首或 selection 非折叠时。

当前 `createDeleteInputTransaction` 会根据 collapsed selection 位置创建：

- `delete_text`：光标不在 text 节点末尾时删除后一个字符。
- `merge_block`：光标位于非末段段尾时合并下一段。
- 空 transaction：光标位于末段末尾或 selection 非折叠时。

当前 `createEnterInputTransaction` 会根据 collapsed selection 位置创建：

- `split_block`：在当前 text 节点 offset 处分裂 block，并保留原 block 类型和 text marks。
- 空 transaction：selection 非折叠时。

低层 Enter helper 保持 collapsed-only；`splitBlockCommand` 负责组合范围删除和上述 Enter transaction，React 键盘入口统一复用该 command。

## React 行为

`RichTextEditor` 当前支持：

- `contentEditable`：开启真实输入入口。
- `onChange`：输入后输出最新文档模型。
- `selection`：受控模型选区。
- `onSelectionChange`：输入后输出新的模型选区。
- `onTransaction`：输入后输出 before、after、transaction、inputType 和输入前后 selection；普通文本输入会额外带上 `batch: "typing"`。
- `onKeyDown`：宿主可先拦截撤销/重做快捷键；若外部已 `preventDefault`，内部不再执行普通输入处理。
- `onBeforeInput`：仍会先调用外部回调，若外部已 `preventDefault`，内部不再处理。
- `onCompositionStateChange`：输入法开始、更新和结束时输出当前 Composition 状态。
- `onCompositionStart` / `onCompositionUpdate` / `onCompositionEnd`：外部回调先执行，内部随后维护候选状态和最终提交。
- 普通文本输入复用 `insertTextCommand`。
- 同一文本容器内跨 text 节点、或跨连续顶层文本块的普通文本输入会先删除选区，再插入输入文本。
- 非折叠 selection 下的 Backspace/Delete 复用 `deleteSelectionCommand`。
- Enter 复用 `splitBlockCommand`；非折叠选区会在同一 transaction 中先删除再分段。
- 段首 Backspace 复用 `mergeBlockCommand`。
- merge command 遇到 void block 会跳过，随后输入 helper 使用 `remove_block` 删除相邻 Divider。

## 基础编辑闭环

普通文本输入、Backspace、Delete 和 Enter 当前使用同一组基础步骤：

- 从当前 contenteditable 根节点读取浏览器 `Selection`。
- 转换为模型 `RangeSelection`。
- 创建对应输入 transaction。
- 阻止浏览器默认 DOM 修改。
- 通过 `applyTransaction` 得到下一份文档模型。
- 通过 `onChange` 和 `onSelectionChange` 把文档和选区交回调用方。
- 通过 `onTransaction` 把 transaction 交给宿主，demo 用它记录真实输入 history。

即使某次按键生成空 transaction，也会回传稳定的模型选区，避免 DOM selection 和模型 selection 分叉。

## Demo 验收

演示页的主编辑区已经接入真实输入：

- 点击或设置光标后输入文本。
- 在段中按 Backspace 删除前一个字符。
- 在第二段段首按 Backspace 合并上一段。
- 在段中按 Delete 删除后一个字符。
- 在第一段段尾按 Delete 合并下一段。
- 在段首、段中、段尾或空段按 Enter 分裂段落。
- 选中同一文本容器或连续顶层文本块后按 Enter，删除选区并在起点建立新段落边界。
- 在 CodeBlock 内输入多行，并通过连续两次 Enter 退出。
- 在 Quote 末尾按 Enter 创建空引用，再按 Enter 退出为正文；全选 Quote 内容后按 Enter 也会退出。
- 从 Divider 后方按 Backspace 或前方按 Delete 删除分隔线。
- 在列表中使用 Tab/Shift+Tab 缩进或反缩进，并在项目开头使用 Backspace 拆出或提升。
- 切换任务列表并通过 checkbox 保存完成状态。
- Enter 后可以继续在新段落输入文本。
- 文档 JSON 会跟随输入更新。
- 渲染预览会使用最新模型重渲染。
- 选区 JSON 会折叠到插入文本后。
- History 状态会记录真实输入产生的 transaction。
- 连续普通文本输入会按 `typing` batch 合并为一个 undo item。
- 主编辑器可通过 Ctrl/Meta + Z 撤销，通过 Ctrl/Meta + Shift + Z 或 Ctrl/Meta + Y 重做。
- 主编辑器可通过快捷键执行加粗、斜体、下划线、删除线、标题、引用、有序列表和无序列表 Command。
- 中文候选更新不会产生中间 transaction，确认后只记录一次输入。
- paragraph 开头可用 `# `、`- `、`1. `、`> ` 和 ` ``` ` 转换块结构。

## 当前限制

- 普通 `insertText`、Backspace 和 Delete 支持 collapsed selection、同一文本容器内跨 text 节点选区，以及连续顶层文本块选区。
- 跨块编辑暂不跨越 Divider、Image、List、Table 等结构节点；列表项和表格段落仅支持各自文本容器内部的范围。
- 暂不处理拖拽输入。
- 非折叠 Enter 与其他范围编辑使用相同结构边界：不跨越 Divider、Image、List 或 Table；列表项和表格段落内部仍可按各自规则分段。
- 组件本身不持有 history 状态，撤销重做快捷键需要宿主接入 history 状态。

输入法、快捷键和输入规则的独立契约见[中文输入法](./ime.md)、[编辑快捷键](./shortcuts.md)和 [Markdown 输入规则](./input-rules.md)。
