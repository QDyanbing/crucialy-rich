# QA：第 8 周 History 撤销重做闭环

## 当前进度

第 8 周 Day 1「History 数据结构」已完成。

第 8 周 Day 2「History 撤销重做转换」已完成。

第 8 周 Day 3「History Command 与 demo 控制」已完成。

下一步继续完善真实输入路径 history 记录、连续输入合并和快捷键。

## 已完成范围

- 新增 `HistorySnapshot`、`HistoryEntry`、`HistoryState` 和 `HistoryChange`。
- 新增 `createHistorySnapshot`、`createHistoryEntry` 和 `cloneHistoryEntry`。
- 新增 `createHistoryState` 和 `clearHistory`。
- 新增 `recordHistory`，记录非空 transaction 并清空 redoStack。
- 新增 `canUndo`、`canRedo`、`getUndoEntry` 和 `getRedoEntry`。
- 新增 `undoHistory` 和 `redoHistory`。
- 新增 `undoCommand` 和 `redoCommand`。
- 扩展 `CommandResult`，支持返回快照式 `document` 和 `history`。
- demo 操作区按钮会记录 history。
- demo 操作区新增“撤销”和“重做”按钮。
- demo 显示 undoStack/redoStack 长度。
- 新增 `docs/features/history.md` 和 `docs/qa/history.md`。

## 自动化覆盖

- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/history/entry.test.ts`
- `packages/core/tests/history/state.test.ts`
- `packages/core/tests/history/record.test.ts`
- `packages/core/tests/history/query.test.ts`
- `packages/core/tests/history/undo.test.ts`
- `packages/core/tests/history/redo.test.ts`
- `packages/core/tests/history/command.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前限制

- React 组件真实输入暂未记录 history。
- 暂未实现连续输入 history 合并。
- 暂未实现撤销重做快捷键。
- demo typecheck 仍受当前 tsconfig `rootDir` 与 workspace path 映射问题影响，需要后续单独修整。

## 结论

第 8 周 History 撤销重做闭环已完成到按钮级可验证状态；下一阶段应把 history 接入真实输入事件和快捷键。
