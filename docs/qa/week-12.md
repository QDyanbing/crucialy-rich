# QA：第 12 周链接闭环

## 当前进度

第 12 周 Day 1「Link Mark 设计」与 Day 2「设置和取消链接」已完成。

☑️ 当前指针：第 12 周 Day 3「链接交互」待开始。

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
- 新增专用 `set_link` operation，支持设置、覆盖、取消、同段跨 text 处理和选区重映射。
- `set_link` operation 会隔离 range/link 引用，并在 apply 阶段再次拒绝危险 href。
- 新增 `setLink` 与 `unsetLink` command，要求非折叠、同 paragraph 文本选区。
- `setLink` 接受 href、target、rel，统一经过 Link Mark sanitize 后再创建 transaction。
- `unsetLink` 仅在选区覆盖 Link Mark 时可用，取消链接不会移除其他 marks。
- 两条链接 command 已进入默认 registry，并支持 command 状态读取。
- 链接 transaction 已覆盖摘要、验收报告和 History 撤销重做生命周期。
- 中文 demo 新增链接样例和输入弹层，可设置、覆盖、取消链接，并禁用危险 href。
- `docs/features/link.md` 已记录模型、安全规则、operation/command API、demo 入口和当前边界。

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
- `packages/core/tests/operation/set-link.test.ts`
- `packages/core/tests/command/link.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前边界

- renderer 和 React 组件尚未输出或处理 `<a>`。
- 编辑态点击拦截、链接 hover/选中状态和只读态跳转留在 Day 3。
- 弹层打开前保存浏览器 selection、确认后恢复 selection 留在 Day 4；当前 demo 使用受控模型选区执行 command。

## 结论

第 12 周 Day 2 已达到“选中文字可设置和取消链接”的验收要求，并覆盖旧链接替换、危险地址拦截、History 和 demo 浏览器流程。下一步实现 `<a>` 渲染以及编辑态/只读态链接交互。
