# QA：文字标记模型验收

当前文字标记范围覆盖 bold / italic 的模型表达、helper、校验、规范化、基础编辑保留和 history 快照保留。

## 已完成范围

- `TextNode` 支持可选 `marks` 字段。
- `TEXT_MARK_TYPES` 固定为 `bold` 和 `italic`。
- `createText(text, marks)` 支持创建带 marks 的 text 节点，并复制 marks 对象。
- 新增 `normalizeTextMarks`、`hasTextMark`、`addTextMark`、`removeTextMark`、`toggleTextMark` 和 `areTextMarksEqual`。
- `validateDocument` 会拒绝非对象、未知 mark 和非 `true` mark 值。
- `normalizeDocument` 会保留合法 marks，丢弃未知或未启用 marks。
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
- `packages/core/tests/operation/split-block.test.ts`
- `packages/core/tests/operation/merge-block.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`

## 当前限制

- 暂未实现 `boldCommand` 和 `italicCommand`。
- 暂未实现 renderer 的 `<strong>` / `<em>` 输出。
- 暂未实现 demo 工具栏按钮。
- 暂未实现跨 text/range 的 mark 应用、拆分与合并策略。

## 结论

文字标记模型基础已完成，可以支撑下一步继续开发 Bold 命令。
