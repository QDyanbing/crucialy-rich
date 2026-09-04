# QA：第 14 周代码块和分割线闭环

## 当前进度

第 14 周 Day 1 至 Day 5 已全部完成。

☑️ 当前指针：第 15 周 Day 1「List 模型设计」待开始。

## 每日完成情况

- Day 1：完成 CodeBlock schema、纯文本 marks 规则、工厂、守卫、校验、规范化、History 与功能文档。
- Day 2：完成 `setCodeBlock`、`pre > code`、多行输入、Enter 换行、双 Enter 退出、中文 Demo 和浏览器测试。
- Day 3：完成 Divider void schema、`hr` 渲染、通用 `insert_block`、`insertDivider` 与插入后 Point。
- Day 4：完成通用 `remove_block`、相邻 Backspace/Delete、merge void 边界、选区路径与后续 Image 复用约束。
- Day 5：完成中文代码块/分隔线混合样例、History 往返、浏览器综合场景、公开导出和独立 QA 报告。

## 验收入口

- 功能文档：[CodeBlock 代码块](../features/code-block.md)、[Divider 分隔线](../features/divider.md)。
- 独立报告：[代码块和分割线闭环](./code-block-divider.md)。
- 自动化命令：`pnpm check:all`。

## 结论

第 14 周范围与 6 个月任务清单一致，未提前实现第 15 周 List，也未引入第三方编辑器内核。下一步从 List 模型与 normalize 契约开始。
