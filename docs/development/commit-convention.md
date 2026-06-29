# 提交规范

提交信息使用 Conventional Commits。

格式：

```text
<type>: <subject>
```

允许的 `type`：

- `build`
- `chore`
- `ci`
- `docs`
- `feat`
- `fix`
- `perf`
- `refactor`
- `revert`
- `style`
- `test`

规则：

- 标题最长 100 个字符。
- 标题必须包含允许的 `type`。
- `subject` 使用英文或中文均可；创建 PR 时标题按仓库协作规则使用英文。
- 提交前建议运行 `pnpm check`。

示例：

```text
chore: 配置工作区脚本
test: 增加演示冒烟测试
docs: 记录工程结构
```

执行 `pnpm hooks:install` 后，`.githooks/commit-msg` 会使用 commitlint 校验提交信息。
