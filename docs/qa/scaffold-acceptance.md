# 脚手架验收

本次初始化的验收目标：

- workspace 目录存在。
- `packages/core` 和 `packages/react` 有可构建入口，但不包含编辑器实现逻辑。
- `apps/demo` 可以启动调试页面。
- TypeScript、Vitest、Playwright、ESLint、Prettier 和 commitlint 配置存在。
- `pnpm check` 可以作为本地质量门禁。
- `pnpm test:e2e:install` 可以安装本地 e2e 浏览器依赖。
- `pnpm test:e2e:install:deps` 可以安装 Linux e2e 系统依赖。
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

最终结果以最近一次执行记录为准。
