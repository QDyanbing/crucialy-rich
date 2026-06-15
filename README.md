# crucialy-rich

自研富文本编辑内核与 React 富文本组件工程。

## 目标

- 自研富文本编辑内核，不依赖 ProseMirror、Tiptap、Lexical、Slate 作为运行时内核。
- 提供可集成的 React 富文本组件包。
- 建立可持续迭代的工程质量基础：构建、测试、类型检查、Lint、格式化和提交规范。

## 当前阶段

本次初始化只搭建工程架子，不编写编辑器内核逻辑，也不实现富文本组件逻辑。

## 技术栈

| 分类      | 工具                               | 用途                                                    |
| --------- | ---------------------------------- | ------------------------------------------------------- |
| 运行时    | Node.js 22.14.0                    | 本地开发、脚本和 CI 运行时                              |
| 包管理    | pnpm 8.6.11                        | workspace 依赖管理                                      |
| 版本钉定  | Volta                              | 固定 Node.js 和 pnpm 版本                               |
| 语言      | TypeScript 5.8                     | packages 和 demo 类型系统                               |
| 包构建    | tsup 8.5                           | `packages/core`、`packages/react` 的 ESM 和类型声明构建 |
| Demo 构建 | Vite 6.3                           | `apps/demo` 的开发服务和生产构建                        |
| Demo UI   | React 18.3                         | demo 空壳页面运行时                                     |
| 单元测试  | Vitest 3.2                         | workspace 和包入口 smoke 测试                           |
| E2E 测试  | Playwright 1.52                    | demo 页面浏览器 smoke 测试                              |
| Lint      | ESLint 9、typescript-eslint        | TypeScript、脚本和配置文件检查                          |
| 格式化    | Prettier 3.5                       | 统一代码、文档和配置格式                                |
| 提交检查  | commitlint、lint-staged、git hooks | 提交信息和 staged 文件质量门禁                          |
| CI        | GitHub Actions                     | 安装、检查、构建和 e2e smoke                            |

## 工程结构

```text
.
├── apps/demo              # Vite + React demo 空壳
├── docs                   # 架构、开发和 QA 文档
├── packages/core          # 富文本内核包占位
├── packages/react         # React 集成包占位
├── tests/e2e              # Playwright e2e smoke
├── eslint.config.js       # ESLint flat config
├── playwright.config.ts   # Playwright 配置
├── tsconfig.base.json     # TypeScript 基础配置
└── vitest.config.ts       # Vitest 配置
```

## 本地开发

```sh
pnpm install
pnpm hooks:install
pnpm dev
```

常用命令：

- `pnpm build`：构建 workspace 内可构建项目。
- `pnpm test`：运行 Vitest smoke 测试。
- `pnpm test:e2e`：运行 Playwright demo smoke 测试。
- `pnpm typecheck`：运行 TypeScript 项目引用类型检查。
- `pnpm lint`：运行 ESLint。
- `pnpm format`：格式化仓库文件。
- `pnpm format:check`：检查格式化状态。
- `pnpm check`：聚合格式检查、Lint、类型检查、单测和构建。

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

- `pre-commit` 使用 lint-staged 检查 staged 文件。
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
- [提交规范](./docs/development/commit-convention.md)
- [测试策略](./docs/qa/test-strategy.md)
- [脚手架验收](./docs/qa/scaffold-acceptance.md)

## License

[MIT](./LICENSE)
