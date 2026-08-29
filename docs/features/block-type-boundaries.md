# 多块 Block Type 切换规则

第 13 周 Day 4 已完成 Heading 和 Quote 的多块切换边界。两个 command 共用 `getSelectedBlockIndexes(input)` 解析选区覆盖的顶层 block，并为每个命中的 block 创建一条 `set_block_type` operation。

## 选区范围

- anchor 和 focus 都必须是文档中的合法 text point。
- collapsed selection、单块 range 和跨块 range 都可执行。
- 命中范围包含 anchor 与 focus 所在的两个 block，以及它们之间的全部 block。
- 反向选区会按较小 block index 到较大 block index 生成 operation，但返回的 selection 保留原 anchor/focus 方向。
- 无选区或任一端点非法时，command 返回 `skipped`，不会生成 transaction。

## Heading 规则

- `{ level: 1 | 2 | 3 | 4 | 5 | 6 }` 把全部命中 block 统一为指定标题层级。
- `{ level: null }` 把全部命中 block 统一恢复为 paragraph。
- `isHeadingCommandActive(input)` 仅在全部命中 block 都与目标类型和层级一致时返回 `true`。
- `getSelectedHeadingLevel(input)` 在全部命中 block 都是同级标题时返回该层级；混合层级、混合类型或非标题返回 `null`；非法选区返回 `undefined`。

## Quote 规则

- 只要命中范围内存在非 Quote block，`toggleQuoteCommand` 就把全部命中 block 统一切换为 Quote。
- 只有全部命中 block 都是 Quote 时，再次执行才统一恢复为 paragraph。
- `isQuoteCommandActive(input)` 仅在全部命中 block 都是 Quote 时返回 `true`。
- 混合类型选区保持可执行且不激活，便于工具栏表达下一次操作会统一应用 Quote。

## 数据不变量

- 每个命中 block 对应一条 `set_block_type` operation，operation 按文档顺序排列。
- 类型切换只替换 block 外壳，原有 text children、文字内容、顺序和 marks 保持不变。
- command 返回 selection 的深拷贝，不与输入 selection 共享 path 引用。
- transaction 应用过程不修改传入的原始 document，并在结束后继续执行 normalize。
- 多块 transaction 的验收报告会按实际数量统计 block operation，应用前后文档都必须通过模型校验。

## 当前边界

- Heading 和 Quote 已支持连续顶层 block 范围，不支持非连续 block 集合。
- 多块切换不会插入、删除或移动 block，因此现有顶层 path 保持稳定。
- Mark command 的跨 paragraph 规则独立演进，不因 Block Type command 支持多块而自动扩大范围。
- 空 Quote 的退出策略、标题快捷键和 Quote 快捷键仍未实现。

## 自动化验收

- `packages/core/tests/command/block-selection.test.ts`
- `packages/core/tests/command/heading.test.ts`
- `packages/core/tests/command/quote.test.ts`
- `packages/core/tests/command/block-type-interaction.test.ts`
- `packages/core/tests/command/state.test.ts`
- `packages/core/tests/operation/acceptance.test.ts`
- `tests/e2e/demo-shell.spec.ts`
