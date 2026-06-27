# 初始化流程

这份流程用于新机器、新成员或新 CI 环境第一次跑通项目。

## 1. 准备工具链

推荐先安装 Volta，让仓库自动选择固定版本：

- Node.js：`22.14.0`
- pnpm：`8.6.11`

如果不用 Volta，也必须满足：

- Node.js：`>=22.14.0 <23`
- pnpm：`>=8.6.11 <9`

## 2. 安装依赖

```sh
pnpm install
```

安装前会自动执行 `scripts/verify-package-manager.mjs`，校验包管理器和版本范围。

## 3. 启用 Git Hooks

```sh
pnpm hooks:install
```

启用后：

- `pre-commit` 会检查 staged 文件格式和 lint。
- `commit-msg` 会校验 Conventional Commits。

## 4. 安装浏览器依赖

第一次本地运行 e2e 前执行：

```sh
pnpm test:e2e:install
```

CI 会自动安装 Playwright Chromium，本地需要手动执行一次。

Linux 新机器如果缺少浏览器系统依赖，可以执行：

```sh
pnpm test:e2e:install:deps
```

## 5. 验证工程链路

基础验证：

```sh
pnpm check
```

完整验证：

```sh
pnpm check:all
```

`pnpm check:all` 会运行 `pnpm check` 和 `pnpm test:e2e`。

## 6. 启动 Demo

```sh
pnpm dev
```

默认地址：

```text
http://127.0.0.1:5173/
```

当前 demo 提供文档模型 JSON、React 组件渲染示例、selection 调试入口和浏览器 selection 同步验证；仍不包含真实编辑行为。

## 7. 清理生成产物

```sh
pnpm clean
```

会清理 demo 构建产物、package 构建产物、Playwright 报告和测试结果。

## 常见问题

| 问题                             | 处理方式                                                             |
| -------------------------------- | -------------------------------------------------------------------- |
| `pnpm install` 被阻止            | 确认使用 pnpm，且版本满足 `>=8.6.11 <9`                              |
| Node.js 版本不匹配               | 使用 Volta 或 nvm 切到 Node.js `22.14.0`                             |
| `pnpm test:e2e` 提示浏览器不存在 | 先执行 `pnpm test:e2e:install`                                       |
| Linux 浏览器系统依赖缺失         | 执行 `pnpm test:e2e:install:deps`                                    |
| 提交信息被拒绝                   | 按 `docs/development/commit-convention.md` 使用 Conventional Commits |
| lint 扫到构建产物                | 执行 `pnpm clean` 后重试                                             |
