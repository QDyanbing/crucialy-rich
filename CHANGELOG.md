# 变更记录

本文件记录项目中的重要变更。

格式参考 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 的精神，提交信息遵循 Conventional Commits。

## 未发布

### 新增

- 初始化 `packages/core`、`packages/react` 和 `apps/demo` 的 pnpm 工作区结构。
- 新增 TypeScript、tsup、Vite、Vitest、Playwright、ESLint、Prettier、commitlint、lint-staged 和 Git hooks。
- 新增 GitHub Actions CI、Issue 模板、PR 模板、CODEOWNERS 和 Dependabot 配置。
- 新增 MIT 许可证、贡献指南、安全策略、初始化流程和脚手架 QA 文档。
- 新增文档模型第一版，包含工厂函数、类型判断、校验、规范化、文档、QA 和演示 JSON 输出。
- 新增模型选区第一版，包含 Path、Point、RangeSelection、文本范围读取、文本范围切分、文档、QA 和演示调试器。
- 新增 React 编辑器外壳组件，并接入演示页面。
- 新增模型演示控制区，支持示例切换、校验状态和规范化验收。
- 新增选区 JSON 节点高亮能力。
- 新增第 2 周和第 3 周的模型与选区 QA 记录。
- 新增未知节点类型和非法 document 子节点规范化测试。
- 新增基础渲染第一版，包含模型路径属性、HTML 序列化、文档、QA 和演示渲染。
- 新增 DOM 与模型位置映射工具，并配套 jsdom 测试。
- 新增浏览器选区与模型选区同步工具，并配套 jsdom 和演示端到端覆盖。
- 新增选区同步文档和 QA 记录。
- 新增 React 组件 API 第一版，包含 `value`、`defaultValue`、`onChange`、renderer 输出、文档和演示示例。
- 新增渲染闭环覆盖，包括空文档、空段落、DOM 映射非法输入、React 组件边界、演示边界示例和第 4 周 QA。
- 新增 `insert_text` operation 第一版，包含创建、应用、插入后选区计算、测试、文档、QA 和演示调试入口。
- 新增 `delete_text` operation 第一版，包含同 text 节点内删除、反向 range、删除后选区计算、测试、文档、QA 和演示调试入口。
- 新增 `split_block` 和 `merge_block` operation 第一版，包含 paragraph 分段、段落合并、操作后选区计算、测试、文档、QA 和演示调试入口。
- 新增 Transaction 第一版，包含 operation 分发、批量应用、结束 normalize、失败保护、测试、文档、QA 和演示调试入口。
- 新增 Operation 闭环验收能力，包含 operation 类型注册、text/block 分类、operation 摘要、transaction 摘要、transaction 验收报告、测试、文档、QA 和演示验收报告。
- 新增 `beforeinput insertText` 第一版，包含输入 helper、React 组件真实文本输入、输入后选区同步、演示输入、端到端测试、文档和 QA。
- 新增 Backspace 第一版，包含段中删除前一个字符、段首合并上一段、空段合并、输入后选区同步、测试、文档、QA 和演示端到端覆盖。
- 新增 Delete 第一版，包含段中删除后一个字符、段尾合并下一段、空段合并、输入后选区同步、测试、文档、QA 和演示端到端覆盖。
- 新增 Enter 第一版，包含段首、段中、段尾和空段分裂段落、Enter 后继续输入、输入后选区同步、测试、文档、QA 和演示端到端覆盖。
- 新增基础编辑闭环验收，覆盖输入、Backspace、Delete、Enter 的组合交互和输入后模型合法性。
- 新增 Command 基础接口，包含 command 类型、结果 helper、注册表、可执行判断、按名称执行、测试、文档和 QA。
- 新增文本编辑命令，包含 `insertTextCommand`、`deleteSelectionCommand`、collapsed/range selection 覆盖、React 输入复用和 demo 按钮复用。
- 新增 Block 编辑命令，包含 `splitBlockCommand`、`mergeBlockCommand`、collapsed selection 覆盖、React Enter/Backspace 复用和 demo 按钮复用。
- 新增 Command 状态读取，包含 `queryCommandState`、`isActive` 钩子、disabled/active 状态、测试、demo 状态面板和按钮禁用。
- 新增默认 Command 注册表，demo 与 React 复用同一套内置 command。
- 新增 Command 闭环验收文档，覆盖默认注册表、综合执行、状态矩阵、demo 状态面板和 React 输入复用。
- 新增 History 数据结构第一版，包含快照、undo/redo 栈、transaction 记录入口、batch 标记、查询 helper、测试和文档。
- 新增 History 撤销/重做第一版，包含 entry 克隆、`undoHistory`、`redoHistory`、`undoCommand`、`redoCommand`、demo history 记录、撤销/重做按钮、测试和文档。
- 新增 React `onTransaction` 回调，真实输入会暴露 before、after、transaction、inputType、输入前后 selection 和可选 batch。
- 新增连续输入 history 合并第一版，普通文本输入通过 `typing` batch 合并为一个 undo item。
- 新增 History 快捷键识别和 demo 接入，支持 Ctrl/Meta + Z 撤销、Ctrl/Meta + Shift + Z 和 Ctrl/Meta + Y 重做。
- 新增 text marks 模型基础，包含 `bold` / `italic` 类型、helper、校验、规范化、operation 保留、history 快照保留、文档和 QA。
- 新增 Bold 第一版，包含 `toggle_mark` operation、`boldCommand`、默认 command 注册、`<strong>` 渲染、demo“加粗”按钮、测试、文档和 QA。
- 新增 Italic 第一版，包含 `italicCommand`、默认 command 注册、`<em>` 渲染、bold+italic 组合渲染、demo“斜体”按钮、JSON 映射展示、测试、文档和 QA。
- 新增 Mark 切分与合并第一版，包含段落内文本 offset helper、相邻同 marks text 合并、同一 paragraph 内跨 text 的 `toggle_mark`、合并后的 selection 映射和 Bold/Italic command 跨 text 覆盖。
- 新增 Bold/Italic 闭环验收，包含混合选区统一 mark 语义、通用 mark command API、中文多节点 demo 样例、toolbar active 状态、交互覆盖和 QA 文档。
- 新增 Underline/Strike boolean mark schema，四种 marks 可在同一 text 节点共存，并由 helper、校验、规范化、Operation 和 History 完整保留。
- 新增 Underline 第一版，包含 `underlineCommand`、默认 command 注册、`<u>` 与组合样式渲染、demo“下划线”按钮、中文样例、测试和文档。
- 新增 Strike 第一版，包含 `strikeCommand`、默认 command 注册、`<s>` 与四种 mark 组合渲染、demo“删除线”按钮、中文样例、测试和文档。
- 新增 mark 快捷键占位，包含 Bold/Italic/Underline 默认映射、配置查询、按键匹配、自定义映射和测试文档。
- 新增 Underline/Strike 闭环验收，包含 boolean mark command 集合、混合选区交互、四种 mark Demo 验收和 QA 文档。
- 新增 `fontSize`、`textColor` 和 `backgroundColor` 属性 Mark schema，支持与四种 boolean mark 共存。
- 新增属性 Mark 值校验、读取、设置和移除 helper，并补齐规范化、合并、编辑保留、History 快照与公共导出测试。
- 新增文字属性 Mark 设计文档和第 11 周进度记录。
- 新增 `8–72` 整数字号约束、通用 `set_mark_attribute` operation 和 selection 映射。
- 新增 `setFontSizeCommand`，支持选区设置、覆盖、取消字号和 collapsed 输入继承。
- 新增安全字号 renderer、HTML/React 渲染测试、中文 demo 字号选择器和 Playwright 设置/取消验收。
- 新增 `sanitizeHexColor`，只接受 `#RGB` / `#RRGGBB` 并输出小写六位十六进制颜色。
- 新增 `setTextColorCommand`，支持选区设置、规范化、取消文字颜色和 collapsed 输入继承。
- 新增安全文字颜色 renderer、HTML/React 渲染测试、中文 demo 颜色控件和 Playwright 设置/取消验收。
- 新增字号、文字颜色和 boolean mark 连续应用与独立取消的组合回归测试。
- 新增安全背景色模型约束，复用十六进制颜色 sanitize 并补齐规范化、校验和 operation 覆盖。
- 新增 `setBackgroundColorCommand`，支持选区设置、取消、跨 text 应用和 collapsed 输入继承。
- 新增安全背景色 renderer、HTML/React 渲染测试、中文 demo 背景色控件和 Playwright 设置/取消验收。
- 新增字号、文字颜色、背景色和 boolean mark 连续应用与独立取消的组合回归测试。
- 新增文字属性闭环验收，覆盖统一 command 集合、跨 text 与反向选区、默认注册表和 Demo 混合样例。
- 新增结构化 Link Mark 类型，包含 href 和可选 target / rel，并支持与现有文字样式共存。
- 新增 HTTP、HTTPS、mailto URL sanitize，以及 target 和 rel 白名单规范化。
- 新增 Link Mark helper、文档校验、规范化、节点合并、编辑保留和 History 深拷贝测试。
- 新增 Link Mark 功能文档和第 12 周进度 QA。
- 新增 paragraph、1–6 级 heading 和 quote Block Type schema、工厂、守卫、校验与规范化。
- 新增 `set_block_type` operation，并接入 Transaction、operation 摘要、验收报告和公共 API。
- 新增 Block Type 设计文档和第 13 周 Day 1 QA 记录。
- 新增 Heading 第一版，包含 `h1`–`h6` 语义渲染、`setHeading` command、默认注册、标题层级状态读取和公共 API。
- 新增中文标题 Demo 样例与层级选择器，并覆盖层级切换、继续输入和恢复正文的浏览器验收。
- 新增 Heading API 文档并更新第 13 周 Day 2 QA 进度。
- 新增 Quote 第一版，包含 `blockquote` 语义渲染、`toggleQuote` command、默认注册、active 状态和公共 API。
- 新增中文 Quote Demo 样例与引用按钮，并覆盖切换、取消、输入、删除、Enter 和继续输入的浏览器验收。
- 新增 Quote 行为文档并更新第 13 周 Day 3 QA 进度。
- 新增多块选区解析 helper，统一处理 Heading 与 Quote command 的正向、反向和 collapsed block 范围。
- 新增 Heading 与 Quote 多块切换能力，保留文字、marks 和原 selection 方向，并补齐命令状态、连续交互和 transaction 验收。
- 新增多块标题与引用 Demo 浏览器验收、切换规则文档，并更新第 13 周 Day 4 QA 进度。
- 新增 `BLOCK_TYPE_COMMANDS`、共享 Block Type command helper、默认注册表与 History 生命周期验收。
- 新增中文“块类型混合”Demo、Heading/Quote 完整浏览器流程和独立 Block Type QA 报告。

### 变更

- 更新项目、QA、包和协作文档，使其匹配已完成的模型与选区范围。
- 更新包主页元信息，统一使用 `master` 分支。
- 澄清贡献、模型属性和选区演示调试器相关文档。
- 更新基础 renderer 完成后的项目状态文档。
- 更新 DOM 与模型位置映射相关的渲染文档。
- 更新选区同步完成后的项目状态文档。
- 更新渲染闭环完成后的渲染文档和项目状态。
- 清理 React 输入事件中的 selection 读取和输入结果提交逻辑。
- 更新输入事件、组件 API、QA 和包说明，使其匹配基础编辑闭环状态。
- 更新项目状态和包说明，使其匹配 Command 基础接口范围。
- 更新 Command、输入事件、组件 API、QA 和包说明，使其匹配文本编辑命令范围。
- 更新 Command、输入事件、组件 API、QA 和包说明，使其匹配 Block 编辑命令范围。
- 更新 Command、QA、测试策略和包说明，使其匹配 Command 状态读取范围。
- 更新 React 键盘输入路径，使 Enter 只通过 `splitBlockCommand`，段尾 Delete 优先通过 `mergeBlockCommand` 合并下一段。
- 更新 README、core README、架构和 Command 文档，使其匹配 Command 闭环验收状态。
- 更新 README、core README、架构、测试策略和变更记录，使其匹配 History 数据结构范围。
- 更新 README、History 文档和变更记录，使其匹配 History 撤销/重做范围。
- 更新 README、core README、react README、输入事件、组件 API、History、Command、QA 和测试策略，使其匹配真实输入 history 与连续 typing 合并范围。
- 更新 README、History、输入事件、组件 API、QA 和测试策略，使其匹配撤销重做快捷键范围。
- 更新文字标记、Command、QA、包说明和项目状态，使其匹配 Bold/Italic 闭环范围。
- 更新文字标记、模型、QA、包说明和项目状态，使其匹配第 10 周样式叠加规则。
- 更新文字标记、Command、渲染、QA、包说明和项目状态，使其匹配 Underline 范围。
- 更新文字标记、Command、渲染、QA、包说明和项目状态，使其匹配 Strike 范围。
- 更新默认 Command 注册表，统一复用 `BOOLEAN_MARK_COMMANDS`。
- 更新 README、架构、Command、文字标记、测试策略和第 10 周进度，使其匹配 boolean marks 闭环状态。
- 修正 React 渲染组合 mark 时错误传入 HTML style 字符串的问题，并整理 Demo 操作按钮布局与段落合并测试预期。
- 更新 README、架构、文字标记、测试策略和项目进度，使其匹配第 11 周 Day 1 属性 Mark 设计范围。
- 更新项目、包、Operation、Command、渲染和 QA 文档，使其匹配第 11 周 Day 2 字号闭环。
- 更新项目、包、文字属性、Command、渲染和 QA 文档，使其匹配第 11 周 Day 3 文字颜色闭环。
- 更新项目、包、文字属性、Command、渲染和 QA 文档，使其匹配第 11 周 Day 4 背景色闭环。
- 更新项目、文字属性和 QA 文档，使其匹配第 11 周综合验收状态。
- 更新项目、模型、文字标记和测试策略文档，使其匹配第 12 周 Day 1 Link Mark 设计范围。
- 更新项目、Core 包、架构、Block Type、Command 和渲染文档，使其匹配 Heading 闭环状态。
- 更新项目、Core 包、架构、Block Type、Command 和渲染文档，使其匹配 Quote 闭环状态。
- 更新项目、Core 包、Operation、Command、History、渲染和第 13 周 QA 文档，使其匹配标题与引用闭环状态。

### 修复

- 修复 History 快照把 heading 和 quote 错误克隆为 paragraph，导致 Block Type 操作无法正确 undo/redo 的问题。

### 暂未包含

- 复杂历史合并策略、解析、文档序列化或输入法完整处理。
