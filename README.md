# crucialy-rich

自研富文本编辑内核与 React 富文本组件工程。

## 目标

- 自研富文本编辑内核，不依赖 ProseMirror、Tiptap、Lexical、Slate 作为运行时内核。
- 提供可集成的 React 富文本组件包。
- 建立可持续迭代的工程质量基础：构建、测试、类型检查、代码检查、格式化和提交规范。

## 当前阶段

已完成工程初始化、文档模型第一版、模型选区第一版、基础模型渲染第一版、DOM 与模型位置映射第一版、选区双向同步第一版、React 组件 API 第一版、渲染闭环验收、`insertText`、`deleteText`、`toggle_mark`、`set_link`、`set_block_type`、`splitBlock`、`mergeBlock` operation 第一版、Transaction 第一版、Operation 闭环验收、`beforeinput insertText` 第一版、Backspace 第一版、Delete 第一版、Enter 第一版、基础编辑闭环验收、Command 基础接口、文本编辑命令、Block 编辑命令、Bold 命令、Italic 命令、Underline 命令、Strike 命令、Heading 命令、Quote 命令、Mark 切分与合并第一版、Bold/Italic 闭环验收、Underline/Strike 闭环验收、标题和引用闭环验收、四种 boolean mark 叠加规则、mark 快捷键映射、Command 状态读取、Command 闭环验收、History 撤销/重做第一版、连续输入合并第一版、撤销重做快捷键第一版、text marks 属性模型、字号闭环、安全文字颜色与背景色闭环、文字属性综合验收、Link Mark 模型以及链接设置/取消 command 第一版。

当前 React 组件已支持通过 `value` / `defaultValue` 展示文档模型，普通文本输入、非折叠删除选区、选区 Enter 分段、段首 Backspace 合并和段尾 Delete 合并会优先复用 command；组件会通过 `onTransaction` 暴露真实输入 transaction。演示页按钮命令和真实输入都会记录 history，并支持撤销、重做、Ctrl/Meta + Z、Ctrl/Meta + Shift + Z、Ctrl/Meta + Y、连续 typing 合并和 undoStack/redoStack 状态查看。

非折叠选区编辑已支持同一文本容器内跨 text 节点，以及跨连续顶层 paragraph、heading、quote、codeBlock。输入替换、Backspace、Delete、Enter、选区映射和 History 往返共用 `delete_text` / `delete_range` operation；列表、表格、图片和分隔线等结构边界暂不参与跨块删除。

text marks schema 当前支持 `bold`、`italic`、`underline` 和 `strike` 共存，四种 boolean mark 均已完成 command、renderer、demo 和 history 闭环。第 11 周已完成 `8–72px` 字号、安全文字颜色与背景色，以及三种属性的跨 text、反向选区、默认注册表和混合样例验收；颜色只接受 `#RGB` / `#RRGGBB`，并统一规范化为小写六位格式。

第 12 周链接闭环已完成：包括结构化 Link Mark、HTTP/HTTPS/mailto URL sanitize、target/rel 白名单、`set_link` operation、`setLink` / `unsetLink` command、`core.link` 功能命名空间、统一链接选区状态读取、安全 `<a>` 渲染、编辑态点击拦截、只读态原生跳转、菜单选区快照与恢复、History 生命周期以及中文创建/编辑/取消验收样例。

第 13 周“标题和引用闭环”已全部完成：文档模型可表达 paragraph、1–6 级 heading 和 quote；Heading 与 Quote 均完成语义渲染、默认 command、单块/多块类型切换、History 往返、中文混合块 Demo 和浏览器验收，跨块正向/反向选区不会丢失文字、marks 或选区方向。

Quote 内按 Enter 会保留引用格式分段；空 Quote 再按 Enter 则原地退出为正文。选区 Enter 清空 Quote 后同样退出，并可通过 History 撤销、重做。

第 14 周“代码块和分割线闭环”已全部完成：CodeBlock 使用纯文本模型与 `pre > code` 语义渲染，支持 command 切换、多行输入和双 Enter 退出；Divider 使用 void block 模型与 `hr` 渲染，支持在光标处分割并插入、相邻 Backspace/Delete 删除、History 往返和中文混合样例。

第 15 周“有序和无序列表闭环”已全部完成：模型支持 bulletList、orderedList 和 listItem，渲染输出 `ul/ol/li`，支持段落与列表切换、列表类型互换、列表项输入、Enter 分裂、空项 Enter 退出、History 和中文浏览器验收。

第 16 周“列表缩进和任务列表闭环”已全部完成：支持最多三层嵌套列表、Tab/Shift+Tab 缩进与反缩进、列表项开头 Backspace、嵌套项 Enter、taskList/taskItem checked 模型、任务列表切换、checkbox 状态持久化、History 和中文浏览器验收。

第 17 周“工具栏闭环”已全部完成：React 包提供 Toolbar 配置、Command 状态映射、默认按钮、固定工具栏、悬浮工具栏、选区位置计算与点击前选区快照；Demo 支持固定/悬浮模式开关、真实命令执行、History 和中文浏览器验收。

第 18 周“斜杠菜单闭环”已全部完成：React 包提供 Slash Command 配置校验、默认块命令目录、中文/英文关键词过滤、paragraph 折叠光标触发识别、浮层定位、Escape 关闭、上下键循环选择和 Enter/鼠标执行；`/query` 清理与目标命令合并为一个 Transaction，支持跨 mark 文本节点和一次撤销。

第 19 周“图片闭环”已全部完成：core 支持安全 ImageNode、URL 清洗、校验/规范化、语义化 `img` 渲染、`insertImage` / `deleteImage` 命令和独立 BlockSelection；React 支持图片点击选中、Backspace/Delete 删除及本地 object URL 预览，Demo 提供中文 URL、本地和删除流程，真实上传由外部接入。

第 20 周“粘贴闭环”已全部完成：core 提供可扩展 Clipboard parser、Markdown/HTML/纯文本优先级、安全 HTML 白名单和 `paste` 命令；纯文本换行转换为 paragraph，结构化内容保留标题、引用、代码、marks 和列表。React 通过 `onPaste` 生成统一 Transaction，Demo 与 Playwright 覆盖三种中文粘贴流程。

第 21 周“基础表格闭环”已全部完成：core 支持 table/tableRow/tableCell 模型、矩形结构校验与修复、完整模型 Path、语义渲染、默认 3×3 插入、整表删除以及行列增删命令；Demo 和 Playwright 提供中文验收流程。

第 22 周“表格编辑闭环”已全部完成：单元格支持文字输入、删除、Enter 分段和段落边界合并；core 提供 CellSelection、当前 cell 定位、`set_table_cell_text` 与 TSV 网格粘贴；React 支持 cell 点击回调和可控高亮，Demo 显示当前 cell path，Playwright 覆盖完整交互。

第 23 周“键盘与输入法闭环”已全部完成：支持 Composition 状态与中文候选词单次提交、Mod+B/I/U 和撤销重做统一快捷键解析，以及 paragraph 开头的标题、列表、引用和代码块 Markdown 输入规则。

第 24 周“组件 API、集成回归与发布闭环”已全部完成：`RichTextEditor` 提供 Command Registry 和 ref API，core/react 已形成 `0.1.0` ESM 发布产物，全量回归、Demo 示例索引、中文文档中心和发布说明草稿均已完成。当前 `0.1.0` 发布候选已就绪，尚未创建 tag 或发布 npm 包。

## 技术栈

| 分类       | 工具                              | 用途                                                    |
| ---------- | --------------------------------- | ------------------------------------------------------- |
| 运行时     | Node.js 22.14.0                   | 本地开发、脚本和 CI 运行时                              |
| 包管理     | pnpm 8.6.11                       | 工作区依赖管理                                          |
| 版本钉定   | Volta                             | 固定 Node.js 和 pnpm 版本                               |
| 语言       | TypeScript 5.8                    | 包和演示应用类型系统                                    |
| 包构建     | tsup 8.5                          | `packages/core`、`packages/react` 的 ESM 和类型声明构建 |
| 演示构建   | Vite 6.3                          | `apps/demo` 的开发服务和生产构建                        |
| 演示界面   | React 18.3                        | 演示调试页面运行时                                      |
| 单元测试   | Vitest 3.2                        | 工作区和包入口冒烟测试                                  |
| 端到端测试 | Playwright 1.52                   | 演示页面浏览器冒烟测试                                  |
| 代码检查   | ESLint 9、typescript-eslint       | TypeScript、脚本和配置文件检查                          |
| 格式化     | Prettier 3.5                      | 统一代码、文档和配置格式                                |
| 提交检查   | commitlint、lint-staged、Git 钩子 | 提交信息和暂存文件质量门禁                              |
| CI         | GitHub Actions                    | 安装、检查、构建和端到端冒烟测试                        |
| 依赖维护   | Dependabot                        | 定期检查 npm 和 GitHub Actions 更新                     |

## 工程结构

```text
.
├── apps/demo              # Vite + React 调试演示
├── docs                   # 架构、开发和 QA 文档
├── packages/core          # 富文本内核模型、选区、基础渲染、DOM 映射、选区同步和 operation
├── packages/react         # React 集成包和 RichTextEditor 组件 API
├── tests/e2e              # Playwright 端到端冒烟测试
├── eslint.config.js       # ESLint 扁平配置
├── playwright.config.ts   # Playwright 配置
├── tsconfig.base.json     # TypeScript 基础配置
└── vitest.config.ts       # Vitest 配置
```

## 本地开发

```sh
pnpm install
pnpm hooks:install
pnpm test:e2e:install
pnpm dev
```

常用命令：

- `pnpm build`：构建工作区内可构建项目。
- `pnpm clean`：清理构建、测试和报告产物。
- `pnpm test`：运行 Vitest 冒烟测试。
- `pnpm test:e2e`：运行 Playwright 演示页面冒烟测试。
- `pnpm test:e2e:install`：安装本地 Playwright Chromium。
- `pnpm test:e2e:install:deps`：安装 Playwright Chromium 和 Linux 系统依赖。
- `pnpm test:packages`：验证已构建公开包的运行时导出与类型声明。
- `pnpm typecheck`：运行全仓 TypeScript 类型检查。
- `pnpm typecheck:packages`：逐个验证工作区项目声明的类型检查脚本。
- `pnpm lint`：运行 ESLint。
- `pnpm format`：格式化仓库文件。
- `pnpm format:check`：检查格式化状态。
- `pnpm check`：聚合格式检查、代码检查、类型检查、单测和构建。
- `pnpm check:all`：运行 `pnpm check` 和端到端冒烟测试。

## 质量门禁

本地提交前建议执行：

```sh
pnpm check
pnpm test:e2e
```

`pnpm check` 包含：

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm typecheck:packages`
- `pnpm test`
- `pnpm build`
- `pnpm test:packages`

执行 `pnpm hooks:install` 后：

- `pre-commit` 使用 lint-staged 检查暂存文件。
- `commit-msg` 使用 commitlint 校验 Conventional Commits。

## 暂不包含

- 协同编辑
- 权限系统
- 评论系统
- 复杂 history 合并策略
- 服务端历史版本
- 服务端存储

## 文档入口

- [完整文档中心](./docs/README.md)
- [工程结构](./docs/architecture/project-structure.md)
- [环境要求](./docs/development/environment.md)
- [初始化流程](./docs/development/initialization-flow.md)
- [脚手架补项清单](./docs/development/scaffold-checklist.md)
- [文档模型](./docs/features/model.md)
- [文字标记模型](./docs/features/marks.md)
- [文字属性 Mark](./docs/features/text-style.md)
- [Link Mark](./docs/features/link.md)
- [Block Type 设计](./docs/features/block-type.md)
- [多块 Block Type 切换规则](./docs/features/block-type-boundaries.md)
- [Heading 标题](./docs/features/heading.md)
- [Quote 引用块](./docs/features/quote.md)
- [CodeBlock 代码块](./docs/features/code-block.md)
- [Divider 分隔线](./docs/features/divider.md)
- [有序和无序列表](./docs/features/list.md)
- [选区](./docs/features/selection.md)
- [基础渲染](./docs/features/render.md)
- [选区双向同步](./docs/features/selection-sync.md)
- [组件 API](./docs/features/component-api.md)
- [Operation](./docs/features/operation.md)
- [输入事件](./docs/features/input.md)
- [中文输入法](./docs/features/ime.md)
- [编辑快捷键](./docs/features/shortcuts.md)
- [Markdown 输入规则](./docs/features/input-rules.md)
- [Command 系统](./docs/features/command.md)
- [History 记录与撤销重做](./docs/features/history.md)
- [工具栏](./docs/features/toolbar.md)
- [斜杠菜单](./docs/features/slash-menu.md)
- [图片](./docs/features/image.md)
- [粘贴](./docs/features/paste.md)
- [基础表格](./docs/features/table.md)
- [提交规范](./docs/development/commit-convention.md)
- [测试策略](./docs/qa/test-strategy.md)
- [脚手架验收基线](./docs/qa/scaffold-acceptance.md)
- [第 1 周 QA](./docs/qa/week-01.md)
- [第 2 周 QA](./docs/qa/week-02.md)
- [第 3 周 QA](./docs/qa/week-03.md)
- [第 4 周 QA](./docs/qa/week-04.md)
- [第 5 周 QA](./docs/qa/week-05.md)
- [第 6 周 QA](./docs/qa/week-06.md)
- [第 7 周 QA](./docs/qa/week-07.md)
- [第 8 周 QA](./docs/qa/week-08.md)
- [第 9 周 QA](./docs/qa/week-09.md)
- [第 10 周 QA](./docs/qa/week-10.md)
- [第 11 周 QA](./docs/qa/week-11.md)
- [第 12 周 QA](./docs/qa/week-12.md)
- [第 13 周 QA](./docs/qa/week-13.md)
- [第 14 周 QA](./docs/qa/week-14.md)
- [第 15 周 QA](./docs/qa/week-15.md)
- [第 16 周 QA](./docs/qa/week-16.md)
- [第 17 周 QA](./docs/qa/week-17.md)
- [第 18 周 QA](./docs/qa/week-18.md)
- [第 19 周 QA](./docs/qa/week-19.md)
- [第 20 周 QA](./docs/qa/week-20.md)
- [第 21 周 QA](./docs/qa/week-21.md)
- [第 22 周 QA](./docs/qa/week-22.md)
- [第 23 周 QA](./docs/qa/week-23.md)
- [第 24 周 QA](./docs/qa/week-24.md)
- [工具栏闭环验收](./docs/qa/toolbar.md)
- [斜杠菜单闭环验收](./docs/qa/slash-menu.md)
- [图片闭环验收](./docs/qa/image.md)
- [粘贴闭环验收](./docs/qa/paste.md)
- [基础表格闭环验收](./docs/qa/table-basic.md)
- [表格编辑闭环验收](./docs/qa/table-editing.md)
- [输入法、快捷键与输入规则闭环验收](./docs/qa/ime-shortcuts-input-rules.md)
- [0.1.0 全量回归](./docs/qa/full-regression.md)
- [0.1.0 发布验收](./docs/qa/release.md)
- [0.1.0 发布说明草稿](./docs/release-notes/0.1.0.md)
- [基础列表闭环验收](./docs/qa/list-basic.md)
- [列表增强闭环验收](./docs/qa/list-advanced.md)
- [代码块和分割线闭环验收](./docs/qa/code-block-divider.md)
- [标题和引用闭环 QA](./docs/qa/block-type.md)
- [模型 QA](./docs/qa/model.md)
- [文字标记 QA](./docs/qa/marks.md)
- [Bold/Italic 闭环验收](./docs/qa/bold-italic.md)
- [Underline/Strike 闭环验收](./docs/qa/underline-strike.md)
- [文字属性闭环验收](./docs/qa/text-style.md)
- [链接闭环验收](./docs/qa/link.md)
- [选区 QA](./docs/qa/selection.md)
- [基础渲染 QA](./docs/qa/render.md)
- [选区同步 QA](./docs/qa/selection-sync.md)
- [Operation QA](./docs/qa/operation.md)
- [输入事件 QA](./docs/qa/input.md)
- [Command QA](./docs/qa/command.md)
- [History QA](./docs/qa/history.md)
- [变更记录](./CHANGELOG.md)

## 反馈入口

- [贡献指南](./CONTRIBUTING.md)
- [缺陷报告](./.github/ISSUE_TEMPLATE/bug_report.yml)
- [需求建议](./.github/ISSUE_TEMPLATE/feature_request.yml)
- [工程任务](./.github/ISSUE_TEMPLATE/task.yml)
- [PR 模板](./.github/PULL_REQUEST_TEMPLATE.md)
- [安全策略](./SECURITY.md)
- [CODEOWNERS](./.github/CODEOWNERS)

## 许可证

[MIT](./LICENSE)
