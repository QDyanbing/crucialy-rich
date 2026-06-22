# 测试策略

当前阶段已经包含工程 smoke、文档模型单测、model selection 单测和 demo e2e 验收。

## 单元测试

- 工具：Vitest。
- 范围：
  - workspace smoke。
  - 包入口可导入。
  - 文档模型类型、创建、guard、validate 和 normalize。
  - Path、Point、RangeSelection 和文本切片工具。
- 命令：`pnpm test`。

## 浏览器测试

- 工具：Playwright。
- 范围：demo 页面可打开，文档 JSON 面板、编辑器外壳和 selection 调试面板可验证。
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
