# 工程结构

本仓库按 monorepo 组织，当前阶段已经完成工程骨架、文档模型第一版和 model selection 第一版。

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

- `packages/core`：富文本内核包，当前承载文档模型、normalize 和 model selection；后续继续扩展 operation、transaction、command、history、parser、serializer。
- `packages/react`：React 集成层，当前只保留空编辑器外壳；后续承载 DOM 渲染、事件绑定、工具栏和菜单。
- `apps/demo`：开发与验收入口，当前展示文档模型 JSON 和 selection 调试面板。
- `tests/e2e`：浏览器级 smoke、demo 验收和后续关键交互测试。
- `docs`：架构、功能设计、测试策略和 QA 验收记录。

## 当前边界

当前仍不包含 React 富文本组件逻辑、DOM 映射、浏览器 selection 同步或真实编辑行为。
