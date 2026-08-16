# QA：文字标记模型验收

当前文字标记范围覆盖 bold / italic / underline / strike 的完整 boolean 闭环，以及 fontSize / textColor / backgroundColor 三种属性 Mark 闭环。

## 已完成范围

- `TextNode` 支持可选 `marks` 字段。
- `TEXT_MARK_TYPES` 固定为 `bold`、`italic`、`underline` 和 `strike`。
- 同一个 text 节点可以同时启用四种 boolean mark。
- `createText(text, marks)` 支持创建带 marks 的 text 节点，并复制 marks 对象。
- 新增 `normalizeTextMarks`、`hasTextMark`、`addTextMark`、`removeTextMark`、`setTextMark`、`toggleTextMark` 和 `areTextMarksEqual`。
- 新增 `mergeAdjacentTextNodes`，用于合并相邻同 marks text 节点。
- `validateDocument` 会拒绝非对象、未知 mark 和非 `true` mark 值。
- `normalizeDocument` 会保留合法 marks，丢弃未知或未启用 marks，并合并相邻同 marks text 节点。
- 新增 `toggle_mark` operation，支持同一个 paragraph 内切换 mark。
- mark 切换后 selection 会按 paragraph text offset 映射到合并后的 text 节点。
- 新增 `boldCommand`，支持选区加粗、取消加粗和 collapsed 后续输入继承 bold。
- 新增 `italicCommand`，支持选区斜体、取消斜体、collapsed 后续输入继承 italic，并覆盖 bold+italic 叠加。
- 新增 `underlineCommand`，支持选区下划线、取消、collapsed 输入继承、跨 text 切换和 active 状态。
- 新增 `strikeCommand`，支持选区删除线、取消、collapsed 输入继承、跨 text 切换和 active 状态。
- Bold/Italic command 支持同一个 paragraph 内跨 text selection。
- renderer 会把 bold text 渲染为 `<strong>`，italic text 渲染为 `<em>`，underline text 渲染为 `<u>`，strike text 渲染为 `<s>`，并覆盖四种 mark 组合渲染。
- demo 操作区新增“加粗”“斜体”“下划线”和“删除线”按钮，并记录 history。
- demo 文档 JSON 选区映射会展示当前 text marks。
- `insert_text`、`delete_text`、`split_block` 和 `merge_block` 已有 mark 保留测试。
- `createHistorySnapshot` 会深拷贝 text marks。
- Underline 与 Strike 均已完成 command、renderer 和 demo。
- 四种 mark command 已由 `BOOLEAN_MARK_COMMANDS` 统一组织。
- Bold、Italic 和 Underline 已提供可查询的默认快捷键配置。
- `TextMarks` 支持 `fontSize`、`textColor` 和 `backgroundColor`，并可与四种 boolean mark 共存。
- 属性 Mark 已接入基础值校验、helper、规范化、合并判断、编辑保留和 History 快照。
- core 公共入口已导出属性类型、常量和 helper。
- `fontSize` 已限制为 `8–72` 的整数，并完成 operation、Command、安全渲染、中文 demo 与 E2E 闭环。
- `textColor` 已限制为安全十六进制颜色，并完成规范化、operation、Command、安全渲染、中文 demo 与 E2E 闭环。
- `backgroundColor` 已限制为安全十六进制颜色，并完成规范化、operation、Command、安全渲染、中文 demo 与 E2E 闭环。

## 自动化覆盖

- `packages/core/tests/model/types.test.ts`
- `packages/core/tests/model/factories.test.ts`
- `packages/core/tests/model/marks.test.ts`
- `packages/core/tests/model/validate.test.ts`
- `packages/core/tests/model/normalize.test.ts`
- `packages/core/tests/selection/paragraph-offset.test.ts`
- `packages/core/tests/operation/insert-text.test.ts`
- `packages/core/tests/operation/delete-text.test.ts`
- `packages/core/tests/operation/toggle-mark.test.ts`
- `packages/core/tests/operation/set-mark-attribute.test.ts`
- `packages/core/tests/operation/split-block.test.ts`
- `packages/core/tests/operation/merge-block.test.ts`
- `packages/core/tests/command/bold.test.ts`
- `packages/core/tests/command/italic.test.ts`
- `packages/core/tests/command/strike.test.ts`
- `packages/core/tests/command/underline.test.ts`
- `packages/core/tests/command/mark-interaction.test.ts`
- `packages/core/tests/command/shortcut.test.ts`
- `packages/core/tests/command/integration.test.ts`
- `packages/core/tests/command/font-size.test.ts`
- `packages/core/tests/command/text-color.test.ts`
- `packages/core/tests/command/background-color.test.ts`
- `packages/core/tests/command/text-style-interaction.test.ts`
- `packages/core/tests/command/state.test.ts`
- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前限制

- 暂未实现 React 组件内置 toolbar。
- mark 快捷键尚未绑定编辑器键盘事件。
- 暂未实现跨 paragraph 的 mark 应用策略。
- 三种文字属性 command 尚未支持跨 paragraph 选区。

## 结论

四种 boolean mark 与三种文字属性已分别闭环，下一步完成文字属性综合验收。
