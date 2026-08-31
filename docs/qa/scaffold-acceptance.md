# 脚手架验收基线

本文记录仓库初始化阶段的历史验收基线，不代表当前功能范围。初始化时的验收目标：

- 工作区目录存在。
- `packages/core` 和 `packages/react` 有可构建入口，初始化阶段不包含编辑器实现逻辑。
- `apps/demo` 可以启动调试页面。
- TypeScript、Vitest、Playwright、ESLint、Prettier 和 commitlint 配置存在。
- `pnpm check` 可以作为本地质量门禁。
- `pnpm test:e2e:install` 可以安装本地端到端浏览器依赖。
- `pnpm test:e2e:install:deps` 可以安装 Linux 端到端系统依赖。
- `pnpm clean` 可以清理本地生成产物。

建议验收命令：

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e:install
pnpm test:e2e
```

当前累计能力与最新质量门禁以根目录 README、功能文档和对应 QA 文档为准。
