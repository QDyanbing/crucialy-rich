# QA：History 撤销重做验收

## 验收范围

第 8 周 History 范围覆盖快照记录、entry 克隆、undo/redo 栈转换、history command 和 demo 操作区撤销重做入口。

当前 History 能力：

- `createHistorySnapshot`
- `createHistoryEntry`
- `cloneHistoryEntry`
- `recordHistory`
- `canUndo`
- `canRedo`
- `getUndoEntry`
- `getRedoEntry`
- `undoHistory`
- `redoHistory`
- `undoCommand`
- `redoCommand`

## 自动化覆盖

- `packages/core/tests/history/snapshot.test.ts`：文档和 selection 快照复制。
- `packages/core/tests/history/entry.test.ts`：entry 中 snapshot、transaction 和 batch 的复制隔离。
- `packages/core/tests/history/state.test.ts`：初始状态和清空状态。
- `packages/core/tests/history/record.test.ts`：非空 transaction 入栈、空 transaction 跳过和 redoStack 清空。
- `packages/core/tests/history/query.test.ts`：undo/redo 可用性和栈顶读取。
- `packages/core/tests/history/undo.test.ts`：撤销到 before 快照并把 entry 移到 redoStack。
- `packages/core/tests/history/redo.test.ts`：重做到 after 快照并把 entry 移回 undoStack。
- `packages/core/tests/history/command.test.ts`：通过 command registry 执行撤销和重做。
- `packages/core/tests/public-api.test.ts`：History API 包出口。
- `tests/e2e/demo-shell.spec.ts`：demo 操作区插入后撤销、重做和 History 状态展示。

## 本地验证记录

- 已通过提交钩子的 Prettier 和 ESLint 校验。
- 已执行 `pnpm --filter @crucialy-rich/core typecheck`，core 类型检查通过。
- 未启动 demo 或运行 Playwright；当前项目协作规则要求没有明确要求时不启动项目和完整测试。

## 当前限制

- React 组件真实输入路径暂未写入 history；当前 demo 只记录操作区按钮产生的 command 结果。
- 暂未实现连续输入合并策略，`batch` 仍作为后续合并入口保留。
- 暂未接入键盘快捷键，例如 Ctrl/Meta + Z 和 Ctrl/Meta + Shift + Z。
- 快照复制只覆盖当前 document -> paragraph -> text 模型。

## 结论

History 已从数据结构推进到可用的撤销重做闭环：core 具备快照记录、栈转换和 command 包装，demo 具备按钮级 history 记录、撤销、重做和状态展示。下一步建议处理真实输入 history 记录、连续输入合并和快捷键。
