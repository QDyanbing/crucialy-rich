# QA：第 2 周文档模型

## 范围

验证 `document` → `paragraph` → `text` 第一版模型、创建接口、运行时判断、结构校验、规范化和演示模型验收入口。

## 自动化测试

- `packages/core/tests/model/types.test.ts`：文档模型类型结构。
- `packages/core/tests/model/factories.test.ts`：创建接口默认值和传入 children。
- `packages/core/tests/model/guards.test.ts`：运行时类型判断。
- `packages/core/tests/model/validate.test.ts`：结构校验。
- `packages/core/tests/model/normalize.test.ts`：规范化修复。
- `tests/e2e/demo-shell.spec.ts`：演示模型示例切换和规范化验收。

命令：

```sh
pnpm test
pnpm test:e2e
```

## 手测场景

| 场景          | 操作                   | 期望                       | 结果 |
| ------------- | ---------------------- | -------------------------- | ---- |
| 默认文档      | 打开演示               | JSON 面板展示合法 document | 通过 |
| 普通示例      | 选择“常规文档”         | 校验状态为“合法”           | 通过 |
| 空文档示例    | 选择“空文档”           | JSON 显示空 children       | 通过 |
| 非法文档示例  | 选择“非法文档”         | 校验状态为“非法”           | 通过 |
| 规范化修复    | 非法示例下点击“规范化” | 修复为合法 paragraph       | 通过 |
| core API 验证 | 运行模型相关 Vitest    | 模型测试全部通过           | 通过 |

## 结论

第 2 周文档模型已闭环，当前模型可支撑后续选区、渲染和编辑命令继续扩展。
