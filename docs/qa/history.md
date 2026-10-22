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
- `packages/core/tests/history/merge-policy.test.ts`：默认策略兼容、相邻策略的合法折叠 Point、非折叠/缺失/非法选区、不同 path、无效策略与复制隔离，13 项通过。
- `packages/core/tests/history/adjacent-record.test.ts`：连续输入、段内跳变、Tab 换格、显式 batch、撤销分支与空 transaction，6 项通过。
- `packages/react/tests/adjacent-history.test.ts`：受控组件真实输入、Tab 无事务、鼠标移动光标及宿主选择旧策略，4 项通过。
- `packages/core/tests/history/query.test.ts`：undo/redo 可用性和栈顶读取。
- `packages/core/tests/history/undo.test.ts`：撤销到 before 快照并把 entry 移到 redoStack。
- `packages/core/tests/history/redo.test.ts`：重做到 after 快照并把 entry 移回 undoStack。
- `packages/core/tests/history/shortcut.test.ts`：撤销重做快捷键识别和忽略场景。
- `packages/core/tests/history/command.test.ts`：通过 command registry 执行撤销和重做。
- `packages/core/tests/command/block-type-history.test.ts`：Heading/Quote 连续切换的 undo/redo 生命周期。
- `packages/core/tests/public-api.test.ts`：History API 包出口。
- `tests/e2e/demo-shell.spec.ts`：demo 操作区插入、真实输入、连续 typing 合并、快捷键触发撤销重做和 History 状态展示。
- `tests/e2e/demo-shell.spec.ts`：新增五条浏览器回归，覆盖换格、段内/跨段移动、选区替换后的连续输入、撤销分支及文档/选区恢复。
- `scripts/verify-package-exports.mjs`：从构建产物验证策略类型、默认兼容、相邻合并、跳变、redo 分支及快照结构。

## 本地验证记录

- `pnpm check:all` 已覆盖 Prettier、ESLint、全仓与包级 TypeScript 检查、Vitest、生产构建和 Playwright。
- History、真实输入、Link 和 Block Type 的浏览器流程均已纳入 Playwright 回归。
- 2026-10-22：`pnpm check:all` 通过，200 个测试文件、1452 项 Vitest 测试、178 项 Chromium 测试，详见[全量回归](./full-regression.md)。

## 当前限制

- Demo 已启用 `adjacent`，Core 默认 `batch` 不变；尚无时间窗口、输入类型自动细分或完整快照连续性校验，宿主负责提供连续的前后快照。
- 相邻策略不追踪光标离开再回到同一点的中间事件，也不在 redoStack 已清空后强制拆分；这些边界仍由宿主调整 batch。策略按次传入，不保存到 History 状态。
- 快照复制覆盖 document、文本/void/list block、ListItem、text 和完整 marks；列表类型、项目与三层 selection 在 undo/redo 中保持不变。

## 结论

History 已形成可用闭环：core 具备快照、栈转换、command 包装、默认 batch 与可选相邻合并、快捷键识别，Demo 已覆盖文本、Link、Block Type、CodeBlock 与 Divider 插入的撤销重做，以及换格、选区变化和 redo 分支后的分步撤销。
