# 测试策略

当前阶段已经包含工程冒烟测试、文档模型单测、text marks 单测、Block Type 与 operation 单测、模型选区单测、渲染与 DOM 映射单测、React 组件 API 单测、输入 helper 单测、command 单测、history 单测和演示端到端验收。

## 单元测试

- 工具：Vitest。
- 范围：
  - 工作区冒烟测试。
  - 包入口可导入。
  - 文档模型类型、创建、类型判断、校验和规范化。
  - Bold/Italic/Underline/Strike boolean marks 与 fontSize/textColor/backgroundColor 属性 Mark 的类型、helper、校验、规范化、合并、operation 保留和 history 快照保留。
  - 字号 `8–72` 边界、属性 operation、`setFontSize` command、取消字号、安全 HTML/React 渲染和 selection 映射。
  - 十六进制颜色 sanitize、`setTextColor` command、取消文字颜色、字号与 boolean mark 组合、安全 HTML/React 渲染和 selection 映射。
  - `setBackgroundColor` command、取消背景色、与文字颜色共存、非法背景色拒绝、安全 HTML/React 渲染和 selection 映射。
  - Link Mark 类型、HTTP/HTTPS/mailto URL sanitize、target/rel 规范化、helper、校验、模型修复、节点合并、`set_link` operation、链接 command、安全渲染、选区恢复、编辑保留和 History 深拷贝。
  - paragraph、1–6 级 heading、quote 模型，`set_block_type` operation，多块 Heading/Quote command、History 往返和语义渲染。
  - Path、Point、RangeSelection、段落 text offset 和文本切片工具。
  - 基础渲染器、paragraph/heading/quote 语义标签、四种 boolean mark、字号、文字颜色、背景色与安全链接 HTML 输出、组合样式、HTML 序列化、DOM 与模型位置映射和选区同步。
  - React 组件 `value`、`defaultValue`、`onChange` 和 `onTransaction` 初始渲染契约。
  - 输入 helper 的普通文本输入、Backspace、Delete 和 Enter transaction。
  - Command 注册、执行、可执行判断、默认注册表、状态矩阵、四种 boolean mark command、`setFontSize`、`setTextColor`、`setBackgroundColor`、链接、Heading、Quote、mark 快捷键配置与匹配、文本编辑 command 和 block 编辑 command。
  - History 快照、entry 克隆、状态工厂、记录入口、batch 合并、查询 helper、undo/redo 栈转换、快捷键识别、history command 和 Block Type 生命周期。
- 命令：`pnpm test`。

## 浏览器测试

- 工具：Playwright。
- 范围：演示页面可打开，文档 JSON 面板、React 组件示例、渲染边界示例、选区调试面板、浏览器选区同步、基础编辑闭环、Bold/Italic/Underline/Strike 按钮、字号、文字颜色与背景色设置/取消、链接创建/编辑/取消与交互、Heading/Quote 单块和多块切换、混合样例与组合切换、command 状态面板、真实输入 history、连续 typing 合并和撤销重做可验证。
- 命令：`pnpm test:e2e`。

## 类型检查

- 工具：TypeScript。
- 全仓范围：根工程、packages 和演示应用，命令为 `pnpm typecheck`。
- 包级契约：逐个运行工作区项目声明的类型检查脚本，命令为 `pnpm typecheck:packages`。

## 代码质量

- 代码检查：`pnpm lint`。
- 格式检查：`pnpm format:check`。
- 聚合检查：`pnpm check`。

后续每个富文本能力都应包含代码、测试、演示、文档和 QA 记录。
