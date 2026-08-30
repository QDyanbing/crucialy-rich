# QA：标题和引用闭环

## 验收状态

第 13 周标题与引用闭环已完成。当前文档模型、Operation、Command、History、Renderer、React 编辑流程和中文 Demo 均能识别并保留 paragraph、1–6 级 heading 与 quote。

## 模型与 Operation 矩阵

| 场景                 | 预期                                      | 状态 |
| -------------------- | ----------------------------------------- | ---- |
| 创建 paragraph       | 包含 text children                        | 通过 |
| 创建 heading         | level 只允许 1–6                          | 通过 |
| 创建 quote           | 包含 text children                        | 通过 |
| 校验三种 block       | 合法节点通过，未知类型与非法 level 被拒绝 | 通过 |
| Normalize 三种 block | 保留合法类型并修复 text children          | 通过 |
| `set_block_type`     | paragraph、heading、quote 可互相切换      | 通过 |
| 多块 Transaction     | 每个命中 block 对应一条 operation         | 通过 |
| 数据保持             | 文字、顺序和 marks 不丢失                 | 通过 |

## Command 矩阵

| 场景                      | 预期                                        | 状态 |
| ------------------------- | ------------------------------------------- | ---- |
| paragraph → heading       | 设置目标 level                              | 通过 |
| heading → heading         | 更新 level                                  | 通过 |
| heading → paragraph       | `level: null` 恢复正文                      | 通过 |
| paragraph/heading → quote | 统一切换为 Quote                            | 通过 |
| quote → paragraph         | 全部为 Quote 时统一取消                     | 通过 |
| 正向多块选区              | 按文档顺序生成 operations                   | 通过 |
| 反向多块选区              | operations 仍按文档顺序，selection 方向保持 | 通过 |
| 混合 active 状态          | 全部匹配目标时才激活                        | 通过 |
| 默认注册表执行            | 可通过 command name 执行 Heading/Quote      | 通过 |
| 非法选区或 payload        | 返回 `skipped`                              | 通过 |

## History 验收

- History 快照按原类型克隆 paragraph、heading 和 quote，不再把扩展 block 降级成 paragraph。
- Heading 和 Quote 类型切换分别形成独立 history item。
- 连续 undo 可以从 Quote 恢复 Heading，再恢复初始混合文档。
- 连续 redo 可以重新应用 Heading 和 Quote。
- undo/redo 后 selection、文字和 marks 保持一致。

## Demo 验收

中文“块类型混合”样例包含：

- 带粗体的二级标题。
- 带斜体的正文段落。
- 带下划线的引用块。
- 不在默认选区内的结尾段落。

默认选区覆盖前三块。浏览器自动化已验证：

- 初始语义标签分别为 `h2`、`p`、`blockquote`、`p`。
- 选择三级标题后，前三块统一渲染为 `h3`，第四块保持 paragraph。
- 点击引用后，前三块统一渲染为 `blockquote`；再次点击统一恢复 paragraph。
- 三种 marks、文字内容、选区范围和模型合法性在切换后保持稳定。

## 自动化覆盖

- 模型：`packages/core/tests/model/types.test.ts`、`guards.test.ts`、`validate.test.ts`、`normalize.test.ts`。
- Operation：`packages/core/tests/operation/set-block-type.test.ts`、`transaction.test.ts`、`summary.test.ts`、`acceptance.test.ts`。
- Command：`packages/core/tests/command/heading.test.ts`、`quote.test.ts`、`block-selection.test.ts`、`block-type-result.test.ts`。
- 交互：`packages/core/tests/command/block-type-interaction.test.ts`、`block-type-history.test.ts`、`integration.test.ts`、`state.test.ts`。
- History：`packages/core/tests/history/snapshot.test.ts`、`undo.test.ts`、`redo.test.ts`。
- 渲染与公共 API：`packages/core/tests/render/render.test.ts`、`html.test.ts`、`packages/core/tests/public-api.test.ts`。
- 浏览器：`tests/e2e/demo-shell.spec.ts`。

## 本地验收命令

```bash
pnpm check:all
```

该命令依次执行格式检查、ESLint、TypeScript 类型检查、Vitest、工作区生产构建和 Playwright。

## 当前边界

- 单条 `set_block_type` operation 仍只描述一个顶层 block；多块 command 会组合多条 operation。
- 当前只支持连续顶层 block 范围，不支持非连续多选。
- 空 Quote 按 Enter 自动退出、标题快捷键和 Quote 快捷键尚未实现。
- codeBlock、divider、list 等 Block Type 按后续周计划继续扩展。

## 结论

Heading 与 Quote 已达到“测试全过、Demo 可验收”的闭环标准，可以进入第 14 周 CodeBlock 与分割线工作。
