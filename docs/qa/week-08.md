# QA：第 8 周 History 撤销重做闭环

## 当前进度

第 8 周 Day 1「History 数据结构」已完成。

第 8 周 Day 2「History 撤销重做转换」已完成。

第 8 周 Day 3「History Command 与 demo 控制」已完成。

第 8 周 Day 4「History 合并策略」已完成第一版。

第 8 周 Day 5「History 闭环验收」已完成第一版。

下一步进入第 9 周「Bold 和 Italic 闭环」。

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
- React 组件新增 `onTransaction` 回调，真实输入会暴露 transaction 和输入前后 selection。
- demo 主编辑器真实输入会记录 history。
- 普通文本输入会携带 `typing` batch。
- `recordHistory` 会合并连续同 batch 的 history entry。
- demo 覆盖连续 typing 合并为一个 undo item 的验收路径。
- 新增 `getHistoryShortcutAction`，统一识别撤销重做快捷键。
- demo 主编辑器接入 Ctrl/Meta + Z、Ctrl/Meta + Shift + Z 和 Ctrl/Meta + Y。
- 新增 `docs/features/history.md` 和 `docs/qa/history.md`。

## 自动化覆盖

- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/history/entry.test.ts`
- `packages/core/tests/history/state.test.ts`
- `packages/core/tests/history/record.test.ts`
- `packages/core/tests/history/merge.test.ts`
- `packages/core/tests/history/query.test.ts`
- `packages/core/tests/history/undo.test.ts`
- `packages/core/tests/history/redo.test.ts`
- `packages/core/tests/history/shortcut.test.ts`
- `packages/core/tests/history/command.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前限制

- 暂未实现按时间间隔、选区跳变或输入类型细分的复杂合并策略。

## 结论

第 8 周 History 撤销重做闭环已完成到真实输入可记录、连续 typing 可合并、按钮和快捷键均可验证状态；下一阶段进入 Bold 和 Italic。
