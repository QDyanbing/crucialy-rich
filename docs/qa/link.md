# QA：链接闭环

## 验收范围

- Link Mark 表达安全 href 和可选 target / rel。
- 设置、覆盖和取消链接使用 `set_link` operation 与默认 command registry。
- 安全链接渲染为 `<a>`，并可与 boolean marks、字号和颜色组合。
- 编辑态链接允许选择文字但不触发导航，只读态保留浏览器原生导航。
- 链接弹层获得焦点后仍使用打开前的模型选区，确认后恢复 DOM 范围。
- 链接 transaction 可进入 History，并在撤销/重做时恢复文档与选区。

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
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`

覆盖同段跨 text 设置、覆盖、取消、其他 marks 保留、选区重映射、command 状态、History 快照和 `core.link` 功能命名空间。

### 渲染与 React

- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/react/tests/public-api.test.ts`

覆盖安全 `<a>` 属性、HTML 转义、组合 marks、模型路径和 React 静态输出。

### 浏览器交互

- `tests/e2e/demo-shell.spec.ts`

覆盖链接创建、编辑、取消、危险地址禁用、编辑态选择、只读态导航、字段回填、pointer/键盘打开弹层后的选区恢复，以及 selection 丢失后的原范围应用。

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

- 链接范围当前要求同一 block 内的非折叠文字选区，当前支持 paragraph、heading 和 quote。
- href 当前只接受绝对 HTTP、HTTPS 和 mailto 地址。
- DOM 选区恢复使用规范化后的正向范围，不保留反向选择方向。
- 通用浮层组件、站内相对链接和复杂跨 block 链接不在本周范围。

## 结论

第 12 周链接功能已形成模型、安全、operation、command、renderer、React、History、demo、文档和浏览器测试闭环。链接创建、编辑、取消与菜单选区恢复均具备独立验收路径。
