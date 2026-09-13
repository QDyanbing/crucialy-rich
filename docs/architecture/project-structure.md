# 工程结构

本仓库按单体仓库组织，当前已完成第 1–19 周闭环：工程骨架、文本/void/list/image 模型、文字样式与链接、Range/Block Selection、语义渲染与 DOM 映射、Operation、Transaction、输入、Command、History、工具栏、斜杠菜单和图片交互。

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
- `packages/react`：React 集成层，提供 `RichTextEditor`、Toolbar、斜杠菜单、图片块选区和本地图片资源 helper，并接入普通文本输入、列表键盘行为、任务 checkbox、图片删除、command 复用和 `onTransaction` 回调。
- `apps/demo`：开发与验收入口，展示中文模型样例、文档 JSON、选区与 command 状态、基础编辑、文字样式、链接、Block Type、列表、Toolbar、图片和 History 流程。
- `tests/e2e`：浏览器级冒烟测试、演示验收和后续关键交互测试。
- `docs`：架构、功能设计、测试策略和 QA 验收记录。

## 当前边界

当前仍不包含真实图片上传、图片缩放/图注、非连续 block 多选、空 Quote 自动退出、复杂 history 合并、跨 block mark、完整输入法或粘贴解析。
