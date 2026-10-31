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
- `packages/core/tests/history/merge-policy.test.ts`：默认文字策略兼容、相邻策略的合法折叠 Point、非折叠/缺失/非法选区、不同 path、无效策略与复制隔离，以及两种策略遇到任一前后快照带块选区时拒绝合并，21 项通过。
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
- `packages/core/tests/history/block-selection.test.ts`：3 项，验证 undo/redo 返回独立块选区、无文字范围及多轮栈迁移。
- `packages/core/tests/history/block-selection-isolation.test.ts`：5 项，验证 entry/快照路径隔离、显式低层合并保留外侧选区、两种自动记录策略不合并块选区、空事务不新增记录。
- 快照测试新增 2 项、Command 测试新增 2 项，覆盖可选第三参数、旧形状兼容、文字范围与块选区独立复制，以及 Registry 结果的块选区透传。
- `packages/core/tests/history/image-cut.test.ts`：5 项，验证仅图片文档/保留邻文的删除、可选保存块选区、旧调用不恢复高亮、剪切与粘贴独立撤销重做。
- `packages/react/tests/clipboard-copy-cut.test.ts`：新增 3 项，验证剪切、Backspace、Delete 事务的 `beforeBlockSelection` 与宿主参数、已记录快照互不共享；失败保护与旧文字事件契约继续回归。
- `tests/e2e/image-history.spec.ts`：8 项，覆盖桌面/手机选中态恢复后不重新点击的复制/再次编辑、快捷键、文字快照清除旧高亮、重做清除与悬浮文字工具栏隐藏。构建产物测试验证快照第三参数、History/CommandResult 与 React 事件的可选字段。

## 本地验证记录

- `pnpm check:all` 已覆盖 Prettier、ESLint、全仓与包级 TypeScript 检查、Vitest、生产构建和 Playwright。
- History、真实输入、Link 和 Block Type 的浏览器流程均已纳入 Playwright 回归。
- 2026-10-22：`pnpm check:all` 通过，200 个测试文件、1452 项 Vitest 测试、178 项 Chromium 测试，详见[全量回归](./full-regression.md)。
- 2026-10-31：`pnpm check:all` 通过，236 个文件/1787 项 Vitest、234 项 Chromium；桌面 1280×720 与手机 390×844 截图检查通过，离线 PNG 已解码，图片高亮可见且无工具栏遮挡或溢出。文字输入用例先显式设置合法文字光标，避免样例原有跨图片范围触发现有结构保护。

## 当前限制

- Demo 已启用 `adjacent`，Core 默认 `batch` 不变；尚无时间窗口、输入类型自动细分或完整快照连续性校验，宿主负责提供连续的前后快照。
- 相邻策略不追踪光标离开再回到同一点的中间事件，也不在 redoStack 已清空后强制拆分；这些边界仍由宿主调整 batch。策略按次传入，不保存到 History 状态。
- 快照复制覆盖 document、文本/void/list block、ListItem、text 和完整 marks；列表类型、项目与三层 selection 在 undo/redo 中保持不变。
- 块选区须由宿主显式传入快照第三参数并应用/清除返回值；Core 不自动校验或修复块路径、不管理焦点。Demo 只恢复合法图片块，不保存 cell 矩形选区或多个块。只点击选择仍不是可撤销事务，旧快照不自动推断图片选中态。

## 结论

History 已形成可用闭环：core 具备快照、栈转换、command 包装、默认 batch 与可选相邻合并、快捷键识别，Demo 已覆盖文本、Link、Block Type、CodeBlock 与 Divider 插入的撤销重做，以及换格、选区变化和 redo 分支后的分步撤销。
