# QA：History 撤销重做验收

## 验收范围

第 8 周 History 范围覆盖快照记录、entry 克隆、undo/redo 栈转换、history command、React 真实输入记录、连续 typing 合并、快捷键识别和 demo 撤销重做入口。

当前 History 能力：

- `createHistorySnapshot`
- `createHistoryEntry`
- `cloneHistoryEntry`
- `canMergeHistoryEntries`
- `mergeHistoryEntries`
- `recordHistory`
- `canUndo`
- `canRedo`
- `getUndoEntry`
- `getRedoEntry`
- `undoHistory`
- `redoHistory`
- `getHistoryShortcutAction`
- `undoCommand`
- `redoCommand`

## 自动化覆盖

- `packages/core/tests/history/snapshot.test.ts`：文档和 selection 快照复制。
- `packages/core/tests/history/entry.test.ts`：entry 中 snapshot、transaction 和 batch 的复制隔离。
- `packages/core/tests/history/state.test.ts`：初始状态和清空状态。
- `packages/core/tests/history/record.test.ts`：非空 transaction 入栈、空 transaction 跳过和 redoStack 清空。
- `packages/core/tests/history/merge.test.ts`：batch 合并边界和 entry 合并结果。
- `packages/core/tests/history/query.test.ts`：undo/redo 可用性和栈顶读取。
- `packages/core/tests/history/undo.test.ts`：撤销到 before 快照并把 entry 移到 redoStack。
- `packages/core/tests/history/redo.test.ts`：重做到 after 快照并把 entry 移回 undoStack。
- `packages/core/tests/history/shortcut.test.ts`：撤销重做快捷键识别和忽略场景。
- `packages/core/tests/history/command.test.ts`：通过 command registry 执行撤销和重做。
- `packages/core/tests/command/block-type-history.test.ts`：Heading/Quote 连续切换的 undo/redo 生命周期。
- `packages/core/tests/public-api.test.ts`：History API 包出口。
- `tests/e2e/demo-shell.spec.ts`：demo 操作区插入、真实输入、连续 typing 合并、快捷键触发撤销重做和 History 状态展示。

## 本地验证记录

- `pnpm check:all` 已覆盖 Prettier、ESLint、全仓与包级 TypeScript 检查、Vitest、生产构建和 Playwright。
- History、真实输入、Link 和 Block Type 的浏览器流程均已纳入 Playwright 回归。

## 当前限制

- 暂未实现按时间间隔、选区跳变或输入类型细分的复杂合并策略。
- 快照复制覆盖 document、paragraph、heading、quote、text 和完整 text marks；Block Type 与 heading level 在 undo/redo 中保持不变。

## 结论

History 已形成可用的撤销重做闭环：core 具备快照记录、栈转换、command 包装、batch 合并和快捷键识别，React 可通过 `onTransaction` 暴露真实输入，demo 具备真实输入、Link、Block Type、连续 typing、快捷键撤销重做和状态展示。更细粒度的合并边界仍按后续计划演进。
