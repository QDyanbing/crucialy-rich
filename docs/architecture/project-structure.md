# 工程结构

本仓库按 monorepo 组织，当前阶段只提供工程骨架。

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

- `packages/core`：预留给富文本内核，后续承载文档模型、selection、operation、transaction、normalize、command、history、parser、serializer。
- `packages/react`：预留给 React 集成层，后续承载组件、DOM 渲染、事件绑定、工具栏和菜单。
- `apps/demo`：开发与验收入口，当前只提供可启动的空壳页面。
- `tests/e2e`：浏览器级 smoke 与后续关键交互测试。
- `docs`：架构、功能设计、测试策略和 QA 验收记录。

## 当前边界

当前只允许配置、目录、文档和 smoke 测试进入仓库，不实现富文本编辑行为。
