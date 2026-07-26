# Bold/Italic 闭环验收

本文记录第 9 周 Day 5 的加粗与斜体闭环验收范围，覆盖模型、Operation、Command、渲染、Demo 和 toolbar 状态。

## 验收范围

- 单个 text 节点内可以添加和移除加粗、斜体。
- 同一段落内的跨 text 选区会统一添加或移除目标 mark。
- 混合格式选区不会逐节点反转已有格式。
- 反向选区与正向选区得到相同文档结果。
- 加粗与斜体可以叠加，也可以分别取消。
- 相邻且 marks 相同的 text 节点会自动合并。
- mark 应用后的模型选区会映射到合并后的 text 节点。
- toolbar 会根据当前选区更新可用状态和激活状态。

## 自动化覆盖

| 层级      | 覆盖文件                                               | 重点场景                        |
| --------- | ------------------------------------------------------ | ------------------------------- |
| 模型      | `packages/core/tests/model/marks.test.ts`              | mark 增删、显式设值、比较与合并 |
| Operation | `packages/core/tests/operation/toggle-mark.test.ts`    | 切分、混合选区、反向选区与映射  |
| Command   | `packages/core/tests/command/bold.test.ts`             | 加粗执行、取消、输入继承与状态  |
| Command   | `packages/core/tests/command/italic.test.ts`           | 斜体执行、取消、组合格式与状态  |
| 交互      | `packages/core/tests/command/mark-interaction.test.ts` | 加粗和斜体叠加、active 状态切换 |
| 浏览器    | `tests/e2e/demo-shell.spec.ts`                         | 多节点样例、toolbar 和渲染闭环  |

## Demo 验收步骤

1. 在“模型示例”中选择“文字标记”。
2. 确认编辑区展示普通、加粗、斜体和组合格式。
3. 确认第二段多节点文本已被选中，加粗和斜体按钮均未激活。
4. 点击“加粗”，确认整段选区统一加粗，按钮进入激活状态。
5. 点击“斜体”，确认整段同时加粗和斜体，两个按钮均激活。
6. 再次点击“加粗”，确认只移除加粗，斜体仍保留。
7. 检查文档 JSON、最近 Transaction、Command 状态与渲染结果一致。

## 本地验证

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## 当前边界

- mark 选区必须位于同一个 paragraph 内。
- 当前只支持 `bold` 和 `italic`，Underline 与 Strike 从第 10 周开始。
- collapsed selection 通过空 text 占位继承后续输入格式，完整输入法组合流程仍按后续计划推进。
