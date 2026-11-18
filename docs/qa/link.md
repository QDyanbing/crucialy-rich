# QA：链接闭环

## 验收范围

- Link Mark 表达安全 href 和可选 target / rel。
- 设置、覆盖和取消链接使用 `set_link` operation 与默认 command registry。
- 安全链接渲染为 `<a>`，并可与 boolean marks、字号和颜色组合。
- 编辑态链接允许选择文字但不触发导航，只读态保留浏览器原生导航。
- 链接弹层获得焦点后仍使用打开前的模型选区，确认后恢复 DOM 范围。
- 链接 transaction 可进入 History，并在撤销/重做时恢复文档与选区。
- 链接 command 可跨连续 paragraph、heading、quote 创建、覆盖和取消，并作为一条 History 记录往返。

## 自动化覆盖

### 模型与安全

- `packages/core/tests/model/link.test.ts`
- `packages/core/tests/model/marks.test.ts`
- `packages/core/tests/model/validate.test.ts`
- `packages/core/tests/model/normalize.test.ts`

覆盖 HTTP、HTTPS、mailto、危险协议、target/rel 白名单、规范化、相等判断和模型校验。

### Operation 与 Command

- `packages/core/tests/operation/set-link.test.ts`
- `packages/core/tests/command/link.test.ts`
- `packages/core/tests/command/cross-block-link-boundary.test.ts`
- `packages/core/tests/clipboard/html.test.ts`
- `packages/core/tests/command/html-link-metadata-paste-history.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`

覆盖同段跨 text 与连续文本块设置、覆盖、取消、其他 marks 保留、正反向选区重映射、结构边界、command 状态、History 快照和 `core.link` 功能命名空间。

### 渲染与 React

- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/react/tests/public-api.test.ts`
- `packages/react/tests/html-link-metadata-paste.test.ts`

覆盖安全 `<a>` 属性、HTML 转义、组合 marks、模型路径、React 静态输出，以及 HTML Clipboard 中 href/target/rel 的规范化和原生粘贴。

### 浏览器交互

- `tests/e2e/demo-shell.spec.ts`

覆盖单块与跨块链接创建、编辑、取消、History 往返、危险地址禁用、编辑态选择、只读态导航、字段回填、pointer/键盘打开弹层后的选区恢复，以及 selection 丢失后的原范围应用。

## 弹层生命周期验收

2026-11-18 本地 `pnpm check:all` 全部通过，最新总数见[全量回归](./full-regression.md)。修复前已在浏览器复现正文变更后旧弹层不失效，以及临时光标使合法保存范围的确认按钮错误禁用；键盘进入沿用未完成指针范围也先复现后修复。

- `tests/smoke/link-selection.test.ts`：6 项，捕获和读取的 Range/path 独立、文档引用归属、无快照/非法端点拒绝、反向和折叠范围保留，以及原模型删节点后的再次校验。helper 仅为 Demo 内部实现，不进入公开包导出。
- `tests/e2e/link-session.spec.ts`：5 项，正文编辑、撤销、重做、规范化和切换示例使保存会话失效，不提交旧链接。
- `link-availability.spec.ts`：3 项，合法保存范围不因新光标禁用，折叠保存范围不借用后来扩大的选区，无效 URL 修正后仍应用原范围。
- `link-guards.spec.ts`：6 项，编辑器组合期间锁定入口/确认/取消，结束恢复；已取消打开/确认、pointercancel、非主指针和右键不残留旧范围，后续正常激活仍可执行。
- `link-focus.spec.ts`：3 项，打开只聚焦一次、关闭回入口，失效不抢新编辑焦点，确认恢复正文选区并可立即输入，链接和续编分别进入 History。
- `link-keyboard.spec.ts`：12 项，地址/rel 的 Enter 各执行一次，Escape 无模型变更，非法草稿保留修正，原生组合标记/keyCode 229/修饰键/宿主取消的 Enter 与 Escape 不被接管。
- `link-dialog-journey.spec.ts`：9 项，未完成指针手势后的 Enter/Space 使用当前范围；1280×844 与 390×844 的正反向跨块链接、单条 History、撤销恢复模型/DOM 方向与重做；非模态 Tab/Shift+Tab 原生进出；图片选择关闭旧草稿并禁用文字链接入口。该文件逐条检查无 pageerror。

共新增 38 条 Chromium，既有 371 条继续通过。桌面/手机弹层截图已检查，地址、打开方式、rel 和操作按钮完整可见，浏览器几何断言确认无横向溢出。图片用例只验证块选择与草稿清理，不宣称验证远端资源内容。

这轮仅完善 Demo 宿主：新文档引用即使内容相等也清理，不自动映射旧位置或检测等长原地文字变更；Tab 不锁焦点，没有 aria-modal、外部点击自动关闭、全局只读或权限管理。手机视口与合成组合事件不等于跨平台真机 IME 验收，Core 链接范围及 API 不变。

## Demo 手测

1. 启动 `pnpm dev`，在“模型示例”中选择“链接闭环”。
2. 默认选中“已有链接”，打开链接弹层检查 href、target 和 rel 回填。
3. 修改地址并确认，检查文档 JSON、最近 Transaction 和选中链接状态。
4. 点击“取消链接”，检查文字保留、链接元素移除和选区恢复。
5. 通过选区调试器选择“待创建链接”，设置新链接并检查模型合法状态。
6. 在“链接交互”区域分别检查编辑态不跳转和只读态原生跳转。

## 验收命令

```sh
pnpm check:all
```

该命令包含格式检查、lint、类型检查、全部单测、生产构建和 Playwright E2E。

## 当前边界

- 链接 command 当前支持连续顶层 paragraph、heading 和 quote，以及同一列表项或同一表格单元格段落中的非折叠文字选区。
- href 当前只接受绝对 HTTP、HTTPS 和 mailto 地址。
- DOM 选区恢复已由共享同步层保留 anchor/focus 方向；按序范围查询不变，最新验证见[选区同步验收](./selection-sync.md)。
- CodeBlock、Divider、Image、跨列表项、跨单元格、通用浮层组件和站内相对链接仍不在当前链接范围。

## 结论

第 12 周链接功能已形成模型、安全、operation、command、renderer、React、History、demo、文档和浏览器测试闭环。链接创建、编辑、取消与菜单选区恢复均具备独立验收路径。
