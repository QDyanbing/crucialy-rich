# 测试策略

当前阶段已经包含工程冒烟测试、文档模型单测、模型选区单测、渲染与 DOM 映射单测、React 组件 API 单测和演示端到端验收。

## 单元测试

- 工具：Vitest。
- 范围：
  - 工作区冒烟测试。
  - 包入口可导入。
  - 文档模型类型、创建、类型判断、校验和规范化。
  - Path、Point、RangeSelection 和文本切片工具。
  - 基础渲染器、HTML 序列化、DOM 与模型位置映射和选区同步。
  - React 组件 `value`、`defaultValue` 和 `onChange` 初始渲染契约。
- 命令：`pnpm test`。

## 浏览器测试

- 工具：Playwright。
- 范围：演示页面可打开，文档 JSON 面板、React 组件示例、渲染边界示例、选区调试面板和浏览器选区同步可验证。
- 命令：`pnpm test:e2e`。

## 类型检查

- 工具：TypeScript project references。
- 范围：根工程、packages 和演示应用。
- 命令：`pnpm typecheck`。

## 代码质量

- 代码检查：`pnpm lint`。
- 格式检查：`pnpm format:check`。
- 聚合检查：`pnpm check`。

后续每个富文本能力都应包含代码、测试、演示、文档和 QA 记录。
