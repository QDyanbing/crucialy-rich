# QA：第 11 周字号和颜色闭环

## 当前进度

第 11 周 Day 1「属性 Mark 设计」已完成。

☑️ 当前指针：第 11 周 Day 2「字号」待开始。

## 已完成范围

- `TextMarks` 新增 `fontSize`、`textColor` 和 `backgroundColor` 属性。
- 属性 Mark 可以与 bold、italic、underline 和 strike 共存。
- `fontSize` 接受大于 `0` 的有限数值。
- `textColor` 和 `backgroundColor` 接受非空字符串，具体颜色过滤留在对应功能日完成。
- 新增属性值校验、读取、设置和移除 helper。
- 规范化会保留合法属性并丢弃非法属性。
- 文档校验会区分 boolean mark 与属性 Mark 的值约束。
- 相邻 text 节点只有在 boolean mark 与属性值全部一致时才会合并。
- boolean mark 切换、段落拆分和 History 快照会保留属性 Mark。
- core 公共入口已导出属性类型、常量和 helper。
- 新增 `docs/features/text-style.md`，记录模型规则和当前边界。

## 自动化覆盖

- `packages/core/tests/model/types.test.ts`
- `packages/core/tests/model/factories.test.ts`
- `packages/core/tests/model/marks.test.ts`
- `packages/core/tests/model/validate.test.ts`
- `packages/core/tests/model/normalize.test.ts`
- `packages/core/tests/operation/toggle-mark.test.ts`
- `packages/core/tests/operation/split-block.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`

## 当前边界

- 尚未实现 `setFontSize` command。
- renderer 尚未输出 `font-size`、文字颜色或背景颜色。
- demo 尚未提供字号和颜色控件。
- 颜色值 sanitize 将在 Day 3「文字颜色」实现。

## 结论

第 11 周 Day 1 的属性 Mark 设计已达到“text node 可表达字号和颜色”的验收要求。下一步实现 Day 2 字号命令、安全渲染、测试和 demo 选择器。
