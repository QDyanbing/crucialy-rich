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

### 暂未包含

- 历史记录、解析、文档序列化或输入法完整处理。
