# QA：第 10 周 Underline 和 Strike 闭环

## 当前进度

第 10 周 Day 1「样式叠加规则」已完成。

第 10 周 Day 2「Underline」已完成。

第 10 周 Day 3「Strike」已完成。

第 10 周 Day 4「快捷键占位」已完成。

第 10 周 Day 5「Underline/Strike 闭环验收」已完成。

☑️ 当前指针：第 11 周 Day 1「属性 Mark 设计」待开始。

## 已完成范围

- `TextMarkType` 新增 `underline` 和 `strike`。
- `TEXT_MARK_TYPES` 统一包含 bold、italic、underline 和 strike。
- 同一个 text 节点可以同时启用四种 boolean mark。
- 工厂函数会复制完整 marks 对象。
- mark helper 可以独立添加、移除和设置四种 mark。
- 校验会接受四种 mark，并继续拒绝未知 mark 和非 `true` 值。
- 规范化会保留四种合法 mark，并丢弃未知或未启用 mark。
- `toggle_mark` 可以修改 underline/strike，同时保留其他已启用 mark。
- History 快照会深拷贝四种 boolean mark。
- 功能文档已记录四种 mark 的叠加与合并规则。
- 新增 `underlineCommand`，并接入默认 command registry。
- Underline 支持选区应用、取消、collapsed 输入继承、跨 text 和 active 状态。
- renderer 会输出 `<u>`，并支持 underline 与 bold/italic 组合渲染。
- demo 新增“下划线”按钮、active 状态和中文验收样例。
- 新增 `strikeCommand`，并接入默认 command registry。
- Strike 支持选区应用、取消、collapsed 输入继承、跨 text 和 active 状态。
- renderer 会输出 `<s>`，underline 与 strike 会合并为同一组 `text-decoration`。
- demo 新增“删除线”按钮、active 状态和中文验收样例。
- 新增 Bold、Italic 和 Underline 默认快捷键映射表。
- 新增按 command 查询快捷键配置和按键盘输入匹配 command name 的纯函数。
- 四种 boolean mark command 已整理为 `BOOLEAN_MARK_COMMANDS`，默认注册表统一复用。
- 补齐 Underline/Strike 混合选区、组合渲染和 Demo 浏览器验收。
- 新增 `docs/qa/underline-strike.md` 闭环验收文档。

## 自动化覆盖

- `packages/core/tests/model/types.test.ts`
- `packages/core/tests/model/factories.test.ts`
- `packages/core/tests/model/marks.test.ts`
- `packages/core/tests/model/validate.test.ts`
- `packages/core/tests/model/normalize.test.ts`
- `packages/core/tests/operation/toggle-mark.test.ts`
- `packages/core/tests/command/underline.test.ts`
- `packages/core/tests/command/strike.test.ts`
- `packages/core/tests/command/mark-interaction.test.ts`
- `packages/core/tests/command/shortcut.test.ts`
- `packages/core/tests/command/integration.test.ts`
- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前边界

- React 组件仍未提供内置 toolbar。
- mark 快捷键只提供配置查询与匹配，不绑定编辑器事件。
- mark 应用范围仍限制在同一个 paragraph 内。

## 结论

第 10 周已完成四种 boolean mark 的数据、命令、渲染、Demo、快捷键占位和 QA 闭环。下一步进入第 11 周属性 Mark 设计。
