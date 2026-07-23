# 测试策略

当前阶段已经包含工程冒烟测试、文档模型单测、text marks 单测、模型选区单测、渲染与 DOM 映射单测、React 组件 API 单测、输入 helper 单测、command 单测、history 单测和演示端到端验收。

## 单元测试

- 工具：Vitest。
- 范围：
  - 工作区冒烟测试。
  - 包入口可导入。
  - 文档模型类型、创建、类型判断、校验和规范化。
  - Text marks 类型、helper、校验、规范化、`toggle_mark`、Bold command、operation 保留和 history 快照保留。
  - Path、Point、RangeSelection 和文本切片工具。
  - 基础渲染器、bold mark HTML 输出、HTML 序列化、DOM 与模型位置映射和选区同步。
  - React 组件 `value`、`defaultValue`、`onChange` 和 `onTransaction` 初始渲染契约。
  - 输入 helper 的普通文本输入、Backspace、Delete 和 Enter transaction。
  - Command 注册、执行、可执行判断、默认注册表、状态矩阵、Bold command、文本编辑 command 和 block 编辑 command。
  - History 快照、entry 克隆、状态工厂、记录入口、batch 合并、查询 helper、undo/redo 栈转换、快捷键识别和 history command。
- 命令：`pnpm test`。

## 浏览器测试

- 工具：Playwright。
- 范围：演示页面可打开，文档 JSON 面板、React 组件示例、渲染边界示例、选区调试面板、浏览器选区同步、基础编辑闭环、Bold 按钮、command 按钮复用、command 状态面板、selection 驱动的 command 状态切换、真实输入 history 记录、连续 typing 合并、History 撤销重做按钮、撤销重做快捷键和 undoStack/redoStack 状态展示可验证。
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
