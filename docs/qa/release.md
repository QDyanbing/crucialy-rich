# QA：0.1.0 发布验收

## 交付物

- `@crucialy-rich/core@0.1.0`：ESM 运行时、source map、TypeScript 声明和包 README。
- `@crucialy-rich/react@0.1.0`：ESM 运行时、source map、TypeScript 声明和包 README。
- React peer dependencies：`react`、`react-dom >=18 <20`。
- Node.js：`>=22.14.0 <23`。
- 中文 Demo、功能文档、专项 QA、历周进度和发布说明草稿。

## 发布检查

- [x] 包版本已更新为 `0.1.0`。
- [x] `exports`、`types`、`main`、`module`、`sideEffects` 和 `files` 已配置。
- [x] React 到 core 使用 `workspace:^`，打包时生成兼容版本范围。
- [x] `pnpm check:all` 全部通过。
- [x] 公开包构建产物可以被 Node.js 导入。
- [x] 安装、构建、组件 API 和已知边界已有中文说明。
- [x] `0.1.0` Release Notes 草稿已生成。
- [ ] 创建 Git tag。
- [ ] 发布 npm 包。
- [ ] 创建 GitHub Release。

## 最终结论

代码、测试、Demo、文档和验收记录已达到发布候选状态。本次没有擅自创建 tag 或发布包，后续发布操作需要维护者明确触发。
