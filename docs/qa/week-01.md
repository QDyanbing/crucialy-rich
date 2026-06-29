# QA：第 1 周工程初始化

## 范围

验证单体仓库工程骨架、质量门禁、演示外壳和仓库治理配置。

## 自动化测试

- `tests/smoke/workspace.test.ts`：工作区包清单冒烟测试。
- `packages/core/tests/public-api.test.ts`：core 包入口可导入。
- `packages/react/tests/public-api.test.ts`：react 包入口可导入。
- `tests/e2e/demo-shell.spec.ts`：演示页面基础区域可见。

命令：

```sh
pnpm check
pnpm test:e2e
```

## 手测场景

| 场景           | 操作                 | 期望                                 | 结果 |
| -------------- | -------------------- | ------------------------------------ | ---- |
| 安装依赖       | `pnpm install`       | 使用 pnpm 且版本校验通过             | 通过 |
| 启用 Git 钩子  | `pnpm hooks:install` | Git 钩子路径指向 `.githooks`         | 通过 |
| 运行质量门禁   | `pnpm check`         | 格式、代码检查、类型、测试、构建通过 | 通过 |
| 打开演示       | `pnpm dev`           | 页面展示编辑器外壳和调试面板         | 通过 |
| 运行浏览器验收 | `pnpm test:e2e`      | 演示冒烟测试通过                     | 通过 |
| 清理生成产物   | `pnpm clean`         | 构建和测试产物被清理                 | 通过 |

## 结论

第 1 周工程初始化已闭环，后续功能应继续保持代码、测试、演示、文档和 QA 记录同步更新。
