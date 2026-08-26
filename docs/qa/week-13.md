# QA：第 13 周标题和引用闭环

## 当前进度

第 13 周 Day 1「Block Type 设计」已完成。

☑️ 当前指针：第 13 周 Day 2「Heading」待开始。

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
- 现有 renderer 对新 block 使用 paragraph 兼容输出，语义标签留到 Day 2、Day 3。
- 新增 `docs/features/block-type.md`，记录模型协议、切换规则和阶段边界。

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
- `packages/core/tests/public-api.test.ts`

## 当前边界

- 尚未提供 heading/quote command。
- renderer 尚未输出 `h1`–`h6` 或 `blockquote`。
- Demo 尚未提供标题选择器或引用按钮。
- 当前 `set_block_type` 一次只处理一个顶层 block path，跨 block 切换留到 Day 4。

## 结论

第 13 周 Day 1 已达到“文档模型可表达 heading/quote”的验收目标，并具备可进入后续 command 与 renderer 开发的稳定 Block Type operation。
