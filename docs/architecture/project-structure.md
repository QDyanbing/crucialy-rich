# 工程结构

本仓库按单体仓库组织，当前阶段已经完成工程骨架、文档模型第一版、模型选区第一版、基础模型渲染第一版、DOM 与模型位置映射第一版、选区双向同步第一版、React 组件 API 第一版、渲染闭环验收、`insertText`、`deleteText`、`splitBlock`、`mergeBlock` operation 第一版、Transaction 第一版、Operation 闭环验收、`beforeinput insertText` 第一版、Backspace 第一版、Delete 第一版、Enter 第一版和基础编辑闭环验收。

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

- `packages/core`：富文本内核包，当前承载文档模型、规范化、模型选区、基础渲染器、DOM 与模型位置映射、选区双向同步、`insertText`、`deleteText`、`splitBlock`、`mergeBlock` operation、Transaction、Operation 闭环验收工具和输入 helper；后续继续扩展命令、历史、解析器和序列化器。
- `packages/react`：React 集成层，当前提供可渲染 `value` / `defaultValue` 的 `RichTextEditor`，并接入普通文本输入、Backspace、Delete 和 Enter 基础编辑入口；后续承载工具栏和菜单。
- `apps/demo`：开发与验收入口，当前展示文档模型 JSON、React 组件示例、渲染边界示例、选区调试面板和基础编辑闭环验收场景。
- `tests/e2e`：浏览器级冒烟测试、演示验收和后续关键交互测试。
- `docs`：架构、功能设计、测试策略和 QA 验收记录。

## 当前边界

当前仍不包含历史、命令系统或输入法完整处理。
