# QA：第 7 周 Command 系统闭环

## 当前进度

第 7 周 Day 1「Command 基础接口」已完成。

第 7 周 Day 2「文本编辑命令」已完成。

第 7 周 Day 3「Block 编辑命令」已完成。

第 7 周 Day 4「Command 状态读取」已完成。

下一步进入 Day 5「Command 闭环验收」。

## 已完成范围

- 定义 `CommandContext`、`CommandInput`、`CommandResult` 和 `Command`。
- 新增 `createCommandSuccess`、`createCommandFailure` 和 `createCommandSkipped`。
- 新增 `createCommandRegistry`。
- 新增 `canExecuteCommand`。
- 新增 `executeCommand`。
- 包入口暴露 Command 基础 API。
- 新增 Command 功能文档。
- 新增 `insertTextCommand`。
- 新增 `deleteSelectionCommand`。
- React 编辑器 `beforeinput insertText` 复用 `insertTextCommand`。
- React 编辑器非折叠 Backspace/Delete 优先复用 `deleteSelectionCommand`。
- demo 操作区“插入”和“删除选区”按钮通过 `executeCommand` 调用文本 command。
- 新增 `splitBlockCommand`。
- 新增 `mergeBlockCommand`。
- React 编辑器 Enter 优先复用 `splitBlockCommand`。
- React 编辑器段首 Backspace 优先复用 `mergeBlockCommand`。
- demo 操作区“分段”和“合并段落”按钮通过 `executeCommand` 调用 block command。
- 新增 `queryCommandState`。
- Command 支持可选 `isActive` 状态读取钩子。
- demo 显示 Command 状态调试面板。
- demo 操作区按钮会根据 command disabled 状态禁用。

## 自动化覆盖

- `packages/core/tests/command/result.test.ts`
- `packages/core/tests/command/registry.test.ts`
- `packages/core/tests/command/can-execute.test.ts`
- `packages/core/tests/command/execute.test.ts`
- `packages/core/tests/command/insert-text.test.ts`
- `packages/core/tests/command/delete-selection.test.ts`
- `packages/core/tests/command/split-block.test.ts`
- `packages/core/tests/command/merge-block.test.ts`
- `packages/core/tests/command/state.test.ts`
- `packages/core/tests/public-api.test.ts`

## 当前限制

- 暂未接入快捷键、工具栏、history 或 undo/redo。

## 结论

Command 基础接口、文本编辑 command、block 编辑 command 和状态读取已经具备注册、查询、可执行判断、按名称执行、键盘输入复用、demo 按钮复用和 disabled 状态展示能力；下一步进入 Command 闭环验收。
