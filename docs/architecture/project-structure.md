# 工程结构

本仓库按单体仓库组织，当前阶段已经完成工程骨架、文档模型第一版、模型选区第一版、基础模型渲染第一版、DOM 与模型位置映射第一版、选区双向同步第一版、React 组件 API 第一版、渲染闭环验收、`insertText` operation 第一版和 `deleteText` operation 第一版。

```text
.
├── apps/
│   └── demo/
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
├── docs/
│   ├── architecture/
│   ├── development/
│   ├── features/
│   └── qa/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   └── react/
│       ├── src/
│       ├── tests/
│       └── package.json
├── tests/
│   └── e2e/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.config.ts
├── playwright.config.ts
└── eslint.config.js
```

## 包职责

- `packages/core`：富文本内核包，当前承载文档模型、规范化、模型选区、基础渲染器、DOM 与模型位置映射、选区双向同步、`insertText` operation 和 `deleteText` operation；后续继续扩展分段、合并、事务、命令、历史、解析器和序列化器。
- `packages/react`：React 集成层，当前提供可渲染 `value` / `defaultValue` 的 `RichTextEditor`；后续承载真实编辑事件、工具栏和菜单。
- `apps/demo`：开发与验收入口，当前展示文档模型 JSON、React 组件示例、渲染边界示例和选区调试面板。
- `tests/e2e`：浏览器级冒烟测试、演示验收和后续关键交互测试。
- `docs`：架构、功能设计、测试策略和 QA 验收记录。

## 当前边界

当前仍不包含真实键盘输入、分段、合并、事务、历史或输入法处理。
