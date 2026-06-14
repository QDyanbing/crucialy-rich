# 脚手架验收

本次初始化的验收目标：

- workspace 目录存在。
- `packages/core` 和 `packages/react` 有可构建入口，但不包含编辑器实现逻辑。
- `apps/demo` 可以启动空壳页面。
- TypeScript、Vitest、Playwright、ESLint、Prettier 和 commitlint 配置存在。
- `pnpm check` 可以作为本地质量门禁。

建议验收命令：

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

最终结果以最近一次执行记录为准。

