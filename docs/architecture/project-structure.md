# 工程结构

本仓库按单体仓库组织，当前阶段已经完成工程骨架、文档模型第一版、四种 boolean marks 闭环、字号和颜色属性闭环、Link Mark 模型与 URL sanitize、mark 快捷键占位、Mark 切分与合并第一版、模型选区第一版、基础模型渲染第一版、DOM 与模型位置映射第一版、选区双向同步第一版、React 组件 API 第一版、基础 operation 与 Transaction、输入闭环、Command 系统和 History 撤销重做第一版。

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

- `packages/core`：富文本内核包，当前承载文档模型、四种 boolean marks、三种文字属性闭环、Link Mark 与 URL sanitize、链接设置/取消 command、mark 快捷键、同 paragraph 跨 text 的 Mark 切分与合并、规范化、模型选区、DOM 映射、选区同步、operation、Transaction、输入 helper、Command 系统和 History；后续继续实现链接渲染/交互、跨 paragraph mark、解析器和序列化器。
- `packages/react`：React 集成层，当前提供可渲染 `value` / `defaultValue` 的 `RichTextEditor`，并接入普通文本输入、Backspace、Delete、Enter、command 复用和 `onTransaction` 回调；后续承载工具栏和菜单。
- `apps/demo`：开发与验收入口，当前展示文档模型 JSON、React 组件示例、渲染边界、选区调试、基础编辑闭环、四种 boolean mark 中文样例和 active 状态、字号、文字颜色与背景色控件、command 状态、真实输入 History 与撤销重做验收。
- `tests/e2e`：浏览器级冒烟测试、演示验收和后续关键交互测试。
- `docs`：架构、功能设计、测试策略和 QA 验收记录。

## 当前边界

当前仍不包含复杂 history 合并策略、跨 paragraph 的 mark 应用、格式化 toolbar、输入法完整处理或粘贴解析。
