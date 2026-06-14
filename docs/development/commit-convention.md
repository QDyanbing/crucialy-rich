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
- `subject` 使用英文或中文均可，但 PR 标题按仓库协作规则使用英文。
- 提交前建议运行 `pnpm check`。

示例：

```text
chore: configure workspace scripts
test: add demo smoke test
docs: document project structure
```

执行 `pnpm hooks:install` 后，`.githooks/commit-msg` 会使用 commitlint 校验提交信息。

