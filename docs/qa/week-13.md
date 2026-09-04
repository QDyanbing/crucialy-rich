# QA：第 13 周标题和引用闭环

## 当前进度

第 13 周 Day 1「Block Type 设计」、Day 2「Heading」、Day 3「Quote」、Day 4「Block 切换边界」和 Day 5「标题和引用闭环验收」已完成。

☑️ 该周收口指针：第 14 周 Day 1「CodeBlock 设计」；最新进度见 [第 14 周 QA](./week-14.md)。

## Day 1 已完成范围

- 定义 `BLOCK_TYPES`，当前包含 paragraph、heading 和 quote。
- 定义 `HEADING_LEVELS`，标题层级限制为 1–6。
- 新增 `HeadingNode`、`QuoteNode`，并扩展 `BlockNode` 联合类型。
- 新增 heading level、heading、quote 运行时守卫。
- 新增 `createHeading` 和 `createQuote` 工厂。
- `validateDocument` 可校验三种 block 及其 text children。
- `normalizeDocument` 可保留并修复三种 block，非法标题层级按未知 block 丢弃。
- 新增 `BlockTypeSpec` 和 `set_block_type` operation。
- Block Type 切换保留 children、文本和 marks，并支持 heading level 更新。
- `set_block_type` 已接入 Transaction、operation 摘要、block 作用域分类和验收报告。
- 公共入口已导出 Block Type 模型与 operation API。
- renderer 对 paragraph、heading 和 quote 均使用对应语义标签。
- 新增 `docs/features/block-type.md`，记录模型协议、切换规则和阶段边界。

## Day 2 已完成范围

- renderer 按 heading level 输出 `h1`–`h6`，保留 block/text 模型路径和 marks。
- 新增 `setHeading` command，支持 1–6 级标题设置、层级切换和恢复 paragraph。
- command 接受 collapsed selection、单块 range 和跨 block range，非法层级与非法选区不可执行。
- command 返回 `set_block_type` transaction 并克隆保留选区，切换后可继续输入。
- 新增当前标题层级读取和 command active 状态判断，并进入默认 Command 注册表。
- Demo 新增中文“标题层级”模型样例和“正文 / 1–6 级标题”选择器。
- Playwright 已覆盖六级语义标签、层级切换、继续输入和恢复正文。
- 新增 `docs/features/heading.md`，记录 Heading API、选区规则和阶段边界。

## Day 3 已完成范围

- renderer 把 quote 输出为 `blockquote`，保留 block/text 模型路径和 marks。
- 新增 `toggleQuote` command，支持切换 Quote 和恢复 paragraph。
- command 接受 collapsed selection、单块 range 和跨 block range，非法选区不可执行。
- command 返回 `set_block_type` transaction，克隆保留选区并进入默认 Command 注册表。
- Demo 新增中文“引用块”样例、带 active 状态的“引用”按钮和引用块样式。
- Playwright 已覆盖 Quote 切换/取消、输入、Backspace 删除、Enter 拆分和新块继续输入。
- 新增 `docs/features/quote.md`，记录 Quote API、输入行为和阶段边界。

## Day 4 已完成范围

- 新增 `getSelectedBlockIndexes`，统一把正向、反向和 collapsed selection 解析为连续顶层 block indexes。
- `setHeadingCommand` 可把全部命中 block 统一设置为同一标题层级或恢复为 paragraph。
- `toggleQuoteCommand` 在混合范围中统一应用 Quote，只有全部命中 block 都是 Quote 时才统一取消。
- 两个 command 都按文档顺序生成 `set_block_type` operations，并克隆保留原 selection 方向。
- 多块 command 状态仅在全部命中 block 与目标一致时激活，混合状态保持可执行。
- 正向、反向和连续命令交互测试确认 text children、文字内容和 marks 不丢失。
- Transaction 验收报告可正确统计多条 `set_block_type` block operations。
- Playwright 已覆盖跨两段统一切换标题、统一开启和取消 Quote，以及最终模型合法性。
- 新增 `docs/features/block-type-boundaries.md`，并同步 Heading、Quote、Command 和 Block Type 文档。

## Day 5 已完成范围

- 提取选中块匹配和 Block Type command 成功结果 helper，Heading/Quote 复用同一套范围、operation 与 selection 处理。
- 新增 `BLOCK_TYPE_COMMANDS` 公共集合，默认注册表按功能集合装配 Heading 与 Quote。
- 补齐默认注册表执行、Heading/Quote 连续交互和 History undo/redo 生命周期测试。
- 修复 History 快照把 heading/quote 降级为 paragraph 的问题，快照现已保留全部当前 Block Type 和 heading level。
- Demo 新增中文“块类型混合”样例，包含标题、正文、引用和未选中结尾段落。
- Playwright 覆盖混合样例状态表达、直接恢复正文、统一设置标题、统一开启/取消引用、marks 保留和未选中块稳定性。
- 新增 `docs/qa/block-type.md` 独立闭环验收报告。

## 自动化覆盖

- `packages/core/tests/model/types.test.ts`
- `packages/core/tests/model/guards.test.ts`
- `packages/core/tests/model/factories.test.ts`
- `packages/core/tests/model/validate.test.ts`
- `packages/core/tests/model/normalize.test.ts`
- `packages/core/tests/operation/set-block-type.test.ts`
- `packages/core/tests/operation/transaction.test.ts`
- `packages/core/tests/operation/summary.test.ts`
- `packages/core/tests/operation/acceptance.test.ts`
- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/core/tests/command/heading.test.ts`
- `packages/core/tests/command/quote.test.ts`
- `packages/core/tests/command/block-selection.test.ts`
- `packages/core/tests/command/block-type-interaction.test.ts`
- `packages/core/tests/command/block-type-history.test.ts`
- `packages/core/tests/command/block-type-result.test.ts`
- `packages/core/tests/command/state.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前边界

- 单条 `set_block_type` operation 仍只处理一个顶层 block path；多块 command 会在同一 transaction 中为每个命中 block 生成一条 operation。
- 当前没有空 Quote 按 Enter 自动退出引用的特殊规则。

## 结论

第 13 周已达到“heading/quote 测试全过”的闭环目标。模型、Operation、Command、History、Renderer、中文混合块 Demo、自动化测试和独立 QA 报告均已对齐。后续进度见 [第 14 周 QA](./week-14.md)。
