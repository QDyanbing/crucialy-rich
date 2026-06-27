# 工程结构

本仓库按 monorepo 组织，当前阶段已经完成工程骨架、文档模型第一版、model selection 第一版、基础 model 渲染第一版、DOM/model point 映射第一版、selection 双向同步第一版和 React 组件 API 第一版。

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

- `packages/core`：富文本内核包，当前承载文档模型、normalize、model selection、基础 renderer、DOM/model point 映射和 selection 双向同步；后续继续扩展 operation、transaction、command、history、parser、serializer。
- `packages/react`：React 集成层，当前提供可渲染 `value` / `defaultValue` 的 `RichTextEditor`；后续承载真实编辑事件、工具栏和菜单。
- `apps/demo`：开发与验收入口，当前展示文档模型 JSON、React 组件示例和 selection 调试面板。
- `tests/e2e`：浏览器级 smoke、demo 验收和后续关键交互测试。
- `docs`：架构、功能设计、测试策略和 QA 验收记录。

## 当前边界

当前仍不包含真实编辑命令、operation、transaction、history 或输入法处理。
