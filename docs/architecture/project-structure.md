# 工程结构

本仓库按单体仓库组织，当前已完成第 1–15 周闭环：工程骨架、文本/void/list 模型、文字样式与链接、嵌套 Path、语义渲染与 DOM 映射、Operation、Transaction、输入、Command 和 History。

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

- `packages/core`：富文本内核包，承载 text/void/list schema、规范化、模型选区、DOM 映射、渲染、operation、Transaction、输入 helper、Command 和 History。
- `packages/react`：React 集成层，当前提供可渲染 `value` / `defaultValue` 的 `RichTextEditor`，并接入普通文本输入、Backspace、Delete、Enter、command 复用、编辑态链接点击拦截和 `onTransaction` 回调；后续承载工具栏和菜单。
- `apps/demo`：开发与验收入口，展示中文模型样例、文档 JSON、选区与 command 状态、基础编辑、文字样式、链接、Block Type、CodeBlock、Divider 和 History 流程。
- `tests/e2e`：浏览器级冒烟测试、演示验收和后续关键交互测试。
- `docs`：架构、功能设计、测试策略和 QA 验收记录。

## 当前边界

当前仍不包含列表缩进、任务列表、图片、非连续 block 多选、空 Quote 自动退出、复杂 history 合并、跨 block mark、格式化 toolbar、完整输入法或粘贴解析。
