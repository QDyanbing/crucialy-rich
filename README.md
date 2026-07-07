# crucialy-rich

自研富文本编辑内核与 React 富文本组件工程。

## 目标

- 自研富文本编辑内核，不依赖 ProseMirror、Tiptap、Lexical、Slate 作为运行时内核。
- 提供可集成的 React 富文本组件包。
- 建立可持续迭代的工程质量基础：构建、测试、类型检查、代码检查、格式化和提交规范。

## 当前阶段

已完成工程初始化、文档模型第一版、模型选区第一版、基础模型渲染第一版、DOM 与模型位置映射第一版、选区双向同步第一版、React 组件 API 第一版、渲染闭环验收、`insertText`、`deleteText`、`splitBlock`、`mergeBlock` operation 第一版、Transaction 第一版、Operation 闭环验收、`beforeinput insertText` 第一版、Backspace 第一版和 Delete 第一版。

当前 React 组件已支持通过 `value` / `defaultValue` 展示文档模型，演示页可以通过 transaction 驱动 operation 控件插入、删除、分段和合并段落，并支持在主编辑区真实输入普通文本、使用 Backspace 和使用 Delete，但尚未接入 Enter。

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
- `pnpm typecheck`：运行 TypeScript 项目引用类型检查。
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
- `pnpm test`
- `pnpm build`

执行 `pnpm hooks:install` 后：

- `pre-commit` 使用 lint-staged 检查暂存文件。
- `commit-msg` 使用 commitlint 校验 Conventional Commits。

## 暂不包含

- 协同编辑
- 权限系统
- 评论系统
- 历史版本
- 服务端存储

## 文档入口

- [工程结构](./docs/architecture/project-structure.md)
- [环境要求](./docs/development/environment.md)
- [初始化流程](./docs/development/initialization-flow.md)
- [脚手架补项清单](./docs/development/scaffold-checklist.md)
- [文档模型](./docs/features/model.md)
- [选区](./docs/features/selection.md)
- [基础渲染](./docs/features/render.md)
- [选区双向同步](./docs/features/selection-sync.md)
- [组件 API](./docs/features/component-api.md)
- [Operation](./docs/features/operation.md)
- [输入事件](./docs/features/input.md)
- [提交规范](./docs/development/commit-convention.md)
- [测试策略](./docs/qa/test-strategy.md)
- [脚手架验收](./docs/qa/scaffold-acceptance.md)
- [第 1 周 QA](./docs/qa/week-01.md)
- [第 2 周 QA](./docs/qa/week-02.md)
- [第 3 周 QA](./docs/qa/week-03.md)
- [第 4 周 QA](./docs/qa/week-04.md)
- [第 5 周 QA](./docs/qa/week-05.md)
- [第 6 周 QA](./docs/qa/week-06.md)
- [模型 QA](./docs/qa/model.md)
- [选区 QA](./docs/qa/selection.md)
- [基础渲染 QA](./docs/qa/render.md)
- [选区同步 QA](./docs/qa/selection-sync.md)
- [Operation QA](./docs/qa/operation.md)
- [输入事件 QA](./docs/qa/input.md)
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
