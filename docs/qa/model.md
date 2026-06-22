# QA：文档模型（第一版）

## 范围

验证 `document` → `paragraph` → `text` 模型的创建、类型判断、schema 校验和 normalize。

## 自动化测试

- `packages/core/tests/model/types.test.ts`：类型结构。
- `packages/core/tests/model/guards.test.ts`：type guard。
- `packages/core/tests/model/factories.test.ts`：创建 API。
- `packages/core/tests/model/validate.test.ts`：schema 校验。
- `packages/core/tests/model/normalize.test.ts`：normalize 修复。

命令：`pnpm test`。

## 手测场景

| 场景                 | 操作                                               | 期望                             | 结果 |
| -------------------- | -------------------------------------------------- | -------------------------------- | ---- |
| 初始文档由 core 生成 | 打开 demo，查看 Document JSON 面板                 | 显示 `createDocument` 生成的文档 | 通过 |
| 示例切换             | 在 demo 中切换 `Model example`                     | JSON 面板切换到对应示例          | 通过 |
| 非法示例校验         | 选择 `Invalid document`                            | 校验状态显示 `Invalid`           | 通过 |
| demo normalize       | 选择非法示例后点击 `Normalize`                     | 文档修复为合法 paragraph         | 通过 |
| 合法文档校验         | `validateDocument(createDocument())`               | `valid: true`                    | 通过 |
| 非法根节点           | 校验 `{ type: "text", text: "x" }`                 | `valid: false`，path 为 `[]`     | 通过 |
| 空文档修复           | `normalizeDocument({type:"document",children:[]})` | 补一个空段落                     | 通过 |
| 空段落修复           | normalize 含空段落的文档                           | 段落补一个空 text                | 通过 |

## 结论

模型相关单测全部通过，demo 初始文档由 core 创建，并可通过示例切换和 Normalize 按钮验证校验与修复行为。
