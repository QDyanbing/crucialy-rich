# QA：第 2 周文档模型

## 范围

验证 `document` → `paragraph` → `text` 第一版模型、创建 API、运行时判断、schema 校验、normalize 和 demo model 验收入口。

## 自动化测试

- `packages/core/tests/model/types.test.ts`：文档模型类型结构。
- `packages/core/tests/model/factories.test.ts`：创建 API 默认值和传入 children。
- `packages/core/tests/model/guards.test.ts`：运行时 type guard。
- `packages/core/tests/model/validate.test.ts`：schema 校验。
- `packages/core/tests/model/normalize.test.ts`：normalize 修复。
- `tests/e2e/demo-shell.spec.ts`：demo model 示例切换和 normalize 验收。

命令：

```sh
pnpm test
pnpm test:e2e
```

## 手测场景

| 场景           | 操作                       | 期望                       | 结果 |
| -------------- | -------------------------- | -------------------------- | ---- |
| 默认文档       | 打开 demo                  | JSON 面板展示合法 document | 通过 |
| 普通示例       | 选择 `Regular document`    | 校验状态为 `Valid`         | 通过 |
| 空文档示例     | 选择 `Empty document`      | JSON 显示空 children       | 通过 |
| 非法文档示例   | 选择 `Invalid document`    | 校验状态为 `Invalid`       | 通过 |
| normalize 修复 | 非法示例下点击 `Normalize` | 修复为合法 paragraph       | 通过 |
| core API 验证  | 运行 model 相关 Vitest     | model 测试全部通过         | 通过 |

## 结论

第 2 周文档模型已闭环，当前模型可支撑后续 selection、渲染和编辑命令继续扩展。
