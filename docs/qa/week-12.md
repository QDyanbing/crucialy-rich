# QA：第 12 周链接闭环

## 当前进度

第 12 周 Day 1「Link Mark 设计」、Day 2「设置和取消链接」、Day 3「链接交互」、Day 4「选区恢复」与 Day 5「链接闭环验收」已全部完成。

后续进度见 [第 13 周 QA](./week-13.md)。

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
- renderer 将安全 Link Mark 输出为 `<a>`，保留规范化的 href、target、rel 和模型路径。
- 链接与 boolean mark、字号及颜色组合时复用同一个路径元素。
- 新增 `getSelectedLinkMark`，支持读取折叠光标所在链接和非折叠选区的统一链接状态。
- React 编辑态拦截链接默认跳转并保留文字选择能力，只读态保留浏览器原生链接行为。
- 中文 demo 新增选中链接状态、弹层字段回填以及编辑态/只读态链接样例。
- 新增 `cloneRangeSelection`，用于保存不共享 path 引用的菜单选区快照。
- 链接弹层在按钮获得焦点前保存选区，确认时使用原选区执行 command 并记录 History。
- 链接 command 完成后通过受控 selection 恢复 DOM 范围；关闭弹层或切换示例会清理快照。
- 新增 `core.link` 功能命名空间，集中导出链接模型、安全、operation 和 command API，并保留原有平铺导出。
- 中文 demo 新增“链接闭环”模型样例，提供已有链接与待创建链接文本。
- 创建、编辑、取消和键盘打开弹层均有独立浏览器验收，取消和确认后会检查 DOM 选区恢复。
- `docs/features/link.md` 已记录完整协议，`docs/qa/link.md` 已记录独立验收范围、命令和手测流程。

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
- `packages/core/tests/render/attributes.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/selection/range.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`
- `packages/react/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前边界

- 链接范围当前不支持跨 paragraph 选区。
- 相对 URL、复杂跨 block 链接和反向 DOM selection 恢复留待后续设计。

## 结论

第 12 周已达到“link 测试全过，demo 可手测”的闭环要求，覆盖模型安全、设置/覆盖/取消、渲染、React、编辑/只读交互、History、菜单选区恢复、功能命名空间和独立 QA 记录。后续标题与引用进度由第 13 周 QA 持续记录。
