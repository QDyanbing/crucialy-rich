# Contributing

感谢参与 `crucialy-rich`。当前阶段已完成工程脚手架、文档模型第一版和 model selection 第一版，贡献内容应继续保持代码、测试、demo、文档和 QA 记录同步更新。

## 开发流程

1. 使用符合仓库规则的分支名，例如 `aaa-bbb-ccc`。
2. 安装依赖并启用 hooks。

   ```sh
   pnpm install
   pnpm hooks:install
   pnpm test:e2e:install
   ```

   Linux 新机器如果缺少浏览器系统依赖，可以改用：

   ```sh
   pnpm test:e2e:install:deps
   ```

3. 修改前先确认当前阶段边界：除非任务明确进入对应阶段，不实现 DOM 映射、浏览器 selection 同步或真实编辑行为。
4. 提交前运行质量门禁。

   ```sh
   pnpm check
   ```

5. 涉及 demo 或浏览器行为时额外运行：

   ```sh
   pnpm test:e2e
   ```

完整初始化流程见 [初始化流程](./docs/development/initialization-flow.md)。

## 提交信息

提交信息遵循 Conventional Commits：

```text
<type>: <subject>
```

允许的 `type` 以 `commitlint.config.cjs` 为准。常用示例：

- `docs: update README tooling guide`
- `test: add Playwright smoke`
- `chore: configure workspace scripts`

## PR 要求

- PR 标题使用英文。
- PR 内容使用中文。
- PR 描述需要说明变更范围、验证结果和风险。
- 对应的文档、测试或 QA 记录应随变更一起更新。

## Issue 要求

- 缺陷优先使用缺陷报告模板，并提供复现步骤。
- 需求优先写清楚背景问题、建议方案和验收标准。
- 工程任务应包含完成清单。
