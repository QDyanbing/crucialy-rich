# QA：第 12 周链接闭环

## 当前进度

第 12 周 Day 1「Link Mark 设计」已完成。

☑️ 当前指针：第 12 周 Day 2「设置和取消链接」待开始。

## 已完成范围

- `TextMarks` 新增结构化 `link`，包含 href 和可选 target / rel。
- `LINK_PROTOCOLS` 只允许 HTTP、HTTPS 和 mailto。
- `sanitizeLinkHref` 使用 URL parser 规范化绝对 URL，并拒绝危险协议、相对路径、控制字符和畸形输入。
- `LINK_TARGETS` 只允许 `_self` 与 `_blank`。
- `LINK_REL_TOKENS` 只允许 nofollow、noopener 与 noreferrer，并提供去重和固定顺序规范化。
- 新增 Link Mark 规范化、校验、相等判断和 get/set/remove helper。
- `validateDocument` 会拒绝不安全 href、错误 target/rel 和未知链接字段。
- `normalizeDocument` 会修复可规范化链接，并移除不安全 Link Mark。
- 文本编辑、boolean mark 切换、段落拆分和 History snapshot 会保留 Link Mark。
- 新增 `docs/features/link.md`，记录模型、安全规则、公共 API 和当前边界。

## 自动化覆盖

- `packages/core/tests/model/types.test.ts`
- `packages/core/tests/model/link.test.ts`
- `packages/core/tests/model/factories.test.ts`
- `packages/core/tests/model/marks.test.ts`
- `packages/core/tests/model/validate.test.ts`
- `packages/core/tests/model/normalize.test.ts`
- `packages/core/tests/operation/insert-text.test.ts`
- `packages/core/tests/operation/split-block.test.ts`
- `packages/core/tests/operation/toggle-mark.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`

## 当前边界

- 尚未提供设置或取消链接 command。
- renderer 和 React 组件尚未输出或处理 `<a>`。
- demo 尚未提供链接输入弹层。
- 编辑态点击、只读态跳转和弹层 selection 恢复留在后续功能日。

## 结论

第 12 周 Day 1 已达到“非法链接不会进入文档模型”的验收要求。下一步实现设置、覆盖和取消链接 command，并接入 demo 输入入口。
