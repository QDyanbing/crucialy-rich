# 测试策略

当前阶段只配置 smoke 测试，确保工程链路可运行。

## 单元测试

- 工具：Vitest。
- 范围：workspace smoke、包入口可导入。
- 命令：`pnpm test`。

## 浏览器测试

- 工具：Playwright。
- 范围：demo 空壳页面可打开，关键区域可见。
- 命令：`pnpm test:e2e`。

## 类型检查

- 工具：TypeScript project references。
- 范围：root、packages、demo。
- 命令：`pnpm typecheck`。

## 代码质量

- Lint：`pnpm lint`。
- 格式检查：`pnpm format:check`。
- 聚合检查：`pnpm check`。

后续每个富文本能力都应包含代码、测试、demo、文档和 QA 记录。

