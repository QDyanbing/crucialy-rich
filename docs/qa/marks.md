# QA：文字标记模型验收

当前文字标记范围覆盖 bold / italic 的模型表达、helper、校验、规范化、`toggle_mark`、Bold command、Italic command、基础编辑保留和 history 快照保留。

## 已完成范围

- `TextNode` 支持可选 `marks` 字段。
- `TEXT_MARK_TYPES` 固定为 `bold` 和 `italic`。
- `createText(text, marks)` 支持创建带 marks 的 text 节点，并复制 marks 对象。
- 新增 `normalizeTextMarks`、`hasTextMark`、`addTextMark`、`removeTextMark`、`toggleTextMark` 和 `areTextMarksEqual`。
- `validateDocument` 会拒绝非对象、未知 mark 和非 `true` mark 值。
- `normalizeDocument` 会保留合法 marks，丢弃未知或未启用 marks。
- 新增 `toggle_mark` operation，支持同一个 text 节点内切换 mark。
- 新增 `boldCommand`，支持选区加粗、取消加粗和 collapsed 后续输入继承 bold。
- 新增 `italicCommand`，支持选区斜体、取消斜体、collapsed 后续输入继承 italic，并覆盖 bold+italic 叠加。
- renderer 会把 bold text 渲染为 `<strong>`，把 italic text 渲染为 `<em>`，并覆盖 bold+italic 组合渲染。
- demo 操作区新增“加粗”和“斜体”按钮，并记录 history。
- demo 文档 JSON 选区映射会展示当前 text marks。
- `insert_text`、`delete_text`、`split_block` 和 `merge_block` 已有 mark 保留测试。
- `createHistorySnapshot` 会深拷贝 text marks。

## 自动化覆盖

- `packages/core/tests/model/types.test.ts`
- `packages/core/tests/model/factories.test.ts`
- `packages/core/tests/model/marks.test.ts`
- `packages/core/tests/model/validate.test.ts`
- `packages/core/tests/model/normalize.test.ts`
- `packages/core/tests/operation/insert-text.test.ts`
- `packages/core/tests/operation/delete-text.test.ts`
- `packages/core/tests/operation/toggle-mark.test.ts`
- `packages/core/tests/operation/split-block.test.ts`
- `packages/core/tests/operation/merge-block.test.ts`
- `packages/core/tests/command/bold.test.ts`
- `packages/core/tests/command/italic.test.ts`
- `packages/core/tests/command/integration.test.ts`
- `packages/core/tests/command/state.test.ts`
- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前限制

- 暂未实现 React 组件内置 toolbar。
- 暂未实现跨 text/range 的 mark 应用、拆分与合并策略。

## 结论

文字标记模型、Bold 第一版和 Italic 第一版已完成，可以支撑下一步继续开发 Mark 切分与合并。
