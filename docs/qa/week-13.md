# QA：第 13 周标题和引用闭环

## 当前进度

第 13 周 Day 1「Block Type 设计」、Day 2「Heading」和 Day 3「Quote」已完成。

☑️ 当前指针：第 13 周 Day 4「Block 切换边界」待开始。

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
- command 接受 collapsed selection 和单个 block 内的 range selection，非法层级与跨 block 选区不可执行。
- command 返回 `set_block_type` transaction 并克隆保留选区，切换后可继续输入。
- 新增当前标题层级读取和 command active 状态判断，并进入默认 Command 注册表。
- Demo 新增中文“标题层级”模型样例和“正文 / 1–6 级标题”选择器。
- Playwright 已覆盖六级语义标签、层级切换、继续输入和恢复正文。
- 新增 `docs/features/heading.md`，记录 Heading API、选区规则和阶段边界。

## Day 3 已完成范围

- renderer 把 quote 输出为 `blockquote`，保留 block/text 模型路径和 marks。
- 新增 `toggleQuote` command，支持切换 Quote 和恢复 paragraph。
- command 接受 collapsed selection 和单个 block 内的 range selection，跨 block 选区不可执行。
- command 返回 `set_block_type` transaction，克隆保留选区并进入默认 Command 注册表。
- Demo 新增中文“引用块”样例、带 active 状态的“引用”按钮和引用块样式。
- Playwright 已覆盖 Quote 切换/取消、输入、Backspace 删除、Enter 拆分和新块继续输入。
- 新增 `docs/features/quote.md`，记录 Quote API、输入行为和阶段边界。

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
- `packages/core/tests/command/state.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前边界

- 当前 `set_block_type` 一次只处理一个顶层 block path，跨 block 切换留到 Day 4。
- 当前没有空 Quote 按 Enter 自动退出引用的特殊规则。

## 结论

第 13 周 Day 3 已达到“引用内输入、删除、换行稳定”的验收目标。Quote 的模型、operation、command、renderer、Demo、自动化测试和中文文档已闭环，下一步处理跨多个 block 的类型切换边界。
