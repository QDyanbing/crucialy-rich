# crucialy-rich

自研富文本编辑内核与 React 富文本组件工程。

## 目标

- 自研富文本编辑内核，不依赖 ProseMirror、Tiptap、Lexical、Slate 作为运行时内核。
- 提供可集成的 React 富文本组件包。
- 建立可持续迭代的工程质量基础：构建、测试、类型检查、Lint、格式化和提交规范。

## 当前阶段

本次初始化只搭建工程架子，不编写编辑器内核逻辑，也不实现富文本组件逻辑。

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
- `pnpm check`：聚合格式检查、Lint、类型检查、单测和构建。

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
