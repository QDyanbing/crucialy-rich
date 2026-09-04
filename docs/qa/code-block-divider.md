# QA：代码块和分割线闭环

## 验收范围

验证第 14 周 CodeBlock 与 Divider 的模型、Operation、Command、输入、选区、Renderer、React、History、中文 Demo 和浏览器交互均按任务清单闭环。

## 能力矩阵

| 场景           | 预期                                                    | 状态 |
| -------------- | ------------------------------------------------------- | ---- |
| CodeBlock 模型 | 可表达多行纯文本，marks 被拒绝或规范化移除              | 通过 |
| CodeBlock 切换 | `setCodeBlock` 支持进入和恢复 paragraph                 | 通过 |
| CodeBlock 输入 | Enter 插入换行，末尾连续 Enter 退出到 paragraph         | 通过 |
| CodeBlock 渲染 | 输出带模型路径的 `pre > code`                           | 通过 |
| Divider 模型   | `children: []`，归类为 void block                       | 通过 |
| Divider 插入   | `split_block + insert_block` 保留两侧内容               | 通过 |
| Divider 渲染   | 输出只含 block path 的 void `hr`                        | 通过 |
| 前方删除       | Divider 前方文本末尾按 Delete 删除 Divider              | 通过 |
| 后方删除       | Divider 后方文本开头按 Backspace 删除 Divider           | 通过 |
| 选区边界       | Divider 可由 block path 查询，但不产生内部 Point        | 通过 |
| History        | 插入 Divider 可撤销、重做，选区恢复合法                 | 通过 |
| 后续复用       | `insert_block` / `remove_block` 不依赖 Divider 专有结构 | 通过 |

## 自动化覆盖

- 模型：`packages/core/tests/model`。
- CodeBlock：`packages/core/tests/command/code-block.test.ts`、`packages/core/tests/input/enter.test.ts`。
- Divider：`packages/core/tests/command/divider.test.ts`、`packages/core/tests/operation/insert-block.test.ts`、`remove-block.test.ts`。
- void 边界：`packages/core/tests/input/backspace.test.ts`、`delete.test.ts`、`selection` 与 `render` 测试。
- React 与公开 API：`packages/react/tests/public-api.test.ts`、`packages/core/tests/public-api.test.ts`。
- 浏览器：`tests/e2e/demo-shell.spec.ts`。

## 浏览器场景

- 中文混合样例同时渲染 CodeBlock、Divider 和后续 paragraph。
- 在普通段落中间插入 Divider，检查两侧文字、选区落点和 Transaction。
- 插入后执行撤销、重做，并在 Divider 后继续输入。
- 从 Divider 前方按 Delete、后方按 Backspace，检查节点删除和选区 path。
- 全流程保持模型校验状态为“合法”。

## 本地验收命令

```sh
pnpm check:all
```

该命令覆盖 Prettier、ESLint、全仓与包级 TypeScript、Vitest、生产构建和 Playwright。

## 当前边界

- RangeSelection 仍由 text Point 组成，Divider 本身不承载内部光标；删除通过相邻文本 Point 表达。
- 当前未实现 List、Image 或通用 NodeSelection；`insert_block` / `remove_block` 已为后续 void block 留出复用基础。

## 结论

CodeBlock 与 Divider 已达到“代码、测试、中文 Demo、文档、验收一起完成”的闭环标准，可以进入第 15 周列表模型设计。
