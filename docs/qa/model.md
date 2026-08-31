# QA：文档模型

## 范围

验证 `document` → `block` → `text` 模型的创建、类型判断、结构校验和规范化。当前 block 包含 paragraph、1–6 级 heading 和 quote，text 可携带 boolean mark、文字属性和 Link Mark。

## 自动化测试

- `packages/core/tests/model/types.test.ts`：类型结构。
- `packages/core/tests/model/guards.test.ts`：类型判断。
- `packages/core/tests/model/factories.test.ts`：创建接口。
- `packages/core/tests/model/validate.test.ts`：结构校验。
- `packages/core/tests/model/normalize.test.ts`：规范化修复。

命令：`pnpm test`。

## 手测场景

| 场景                 | 操作                                               | 期望                             | 结果 |
| -------------------- | -------------------------------------------------- | -------------------------------- | ---- |
| 初始文档由 core 生成 | 打开演示，查看文档 JSON 面板                       | 显示 `createDocument` 生成的文档 | 通过 |
| 示例切换             | 在演示中切换“模型示例”                             | JSON 面板切换到对应示例          | 通过 |
| 非法示例校验         | 选择“非法文档”                                     | 校验状态显示“非法”               | 通过 |
| 演示规范化           | 选择非法示例后点击“规范化”                         | 文档修复为合法 paragraph         | 通过 |
| 合法文档校验         | `validateDocument(createDocument())`               | `valid: true`                    | 通过 |
| 非法根节点           | 校验 `{ type: "text", text: "x" }`                 | `valid: false`，path 为 `[]`     | 通过 |
| 空文档修复           | `normalizeDocument({type:"document",children:[]})` | 补一个空段落                     | 通过 |
| 空段落修复           | normalize 含空段落的文档                           | 段落补一个空 text                | 通过 |
| 标题校验             | 创建 1–6 级 heading                                | 合法层级通过，非法层级被拒绝     | 通过 |
| 引用校验             | 创建 quote 并执行 normalize                        | Quote 类型和 text children 保留  | 通过 |
| Marks 校验           | 创建样式与链接组合 text                            | 合法 marks 保留，非法值被拒绝    | 通过 |

## 结论

模型相关单测覆盖 paragraph、heading、quote、text marks 和 Link Mark。演示初始文档由 core 创建，并可通过中文示例切换和“规范化”按钮验证校验与修复行为。
