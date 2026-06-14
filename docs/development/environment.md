# 环境要求

本仓库默认使用 Volta 固定工具链。

## 版本

- Node.js：`>=22.14.0 <23`
- pnpm：`>=8.6.11 <9`
- Volta pin：Node.js `22.14.0`，pnpm `8.6.11`

## 安装

```sh
pnpm install
pnpm hooks:install
```

安装前会执行 `scripts/verify-package-manager.mjs`：

- 阻止 npm、yarn 等非 pnpm 安装。
- 校验 Node.js 版本范围。
- 校验 pnpm 版本范围。

## 包管理约束

- `packageManager` 固定为 `pnpm@8.6.11`。
- `.npmrc` 开启 `engine-strict` 和 `package-manager-strict`。
- `.npmrc` 开启 `save-exact`，新增依赖默认写入精确版本。

