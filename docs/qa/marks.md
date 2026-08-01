# QA：文字标记模型验收

当前文字标记范围覆盖 bold / italic / underline / strike 的 boolean schema、helper、校验、规范化和编辑保留，以及 Bold/Italic/Underline 的 command、renderer、demo 和同 paragraph 跨 text 切分合并。

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
- Bold/Italic command 支持同一个 paragraph 内跨 text selection。
- renderer 会把 bold text 渲染为 `<strong>`，italic text 渲染为 `<em>`，underline text 渲染为 `<u>`，并覆盖三种 mark 组合渲染。
- demo 操作区新增“加粗”“斜体”和“下划线”按钮，并记录 history。
- demo 文档 JSON 选区映射会展示当前 text marks。
- `insert_text`、`delete_text`、`split_block` 和 `merge_block` 已有 mark 保留测试。
- `createHistorySnapshot` 会深拷贝 text marks。
- Underline 已完成 command、renderer 和 demo；Strike 当前完成 schema、校验、规范化、Operation 与 History 保留。

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
- `packages/core/tests/operation/split-block.test.ts`
- `packages/core/tests/operation/merge-block.test.ts`
- `packages/core/tests/command/bold.test.ts`
- `packages/core/tests/command/italic.test.ts`
- `packages/core/tests/command/underline.test.ts`
- `packages/core/tests/command/integration.test.ts`
- `packages/core/tests/command/state.test.ts`
- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前限制

- 暂未实现 React 组件内置 toolbar。
- 暂未实现跨 paragraph 的 mark 应用策略。
- 暂未实现 Strike command、renderer 和 demo 控件。

## 结论

四种 boolean mark 的共存规则和 Underline 已完成，下一步进入第 10 周 Day 3「Strike」。
