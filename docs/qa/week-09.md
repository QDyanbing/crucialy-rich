# QA：第 9 周 Bold 和 Italic 闭环

## 当前进度

第 9 周 Day 1「Mark 机制」已完成。

第 9 周 Day 2「Bold 命令」已完成第一版。

☑️ 当前指针：第 9 周 Day 3「Italic 命令」待开始。

## 已完成范围

- 新增 text marks 类型，当前支持 `bold` 和 `italic`。
- `TextNode` 可表达 `{ marks: { bold: true } }` 和 `{ marks: { italic: true } }`。
- `createText` 支持传入 marks，并避免共享外部 marks 对象引用。
- 新增 marks helper，覆盖规范化、判断、添加、移除、切换和比较。
- `validateDocument` 已覆盖 text marks 合法性。
- `normalizeDocument` 已覆盖 text marks 收敛。
- `createHistorySnapshot` 已覆盖 marks 深拷贝。
- 基础 text/block operation 已补 marks 保留测试。
- 新增 `toggle_mark` operation，支持同一个 text 节点内切换 mark。
- 新增 `boldCommand`，并接入默认 command registry。
- renderer 已把 bold text 输出为 `<strong>`。
- demo 操作区新增“加粗”按钮，并会记录 history。
- 新增 `docs/features/marks.md` 和 `docs/qa/marks.md`。

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
- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前限制

- 暂未实现 Italic command。
- 暂未接入 renderer 的 `<em>` 输出。
- 暂未接入 React 组件内置 toolbar。
- 暂未实现跨 range 的 mark 应用策略。

## 结论

第 9 周已完成 Mark 机制和 Bold 第一版；下一步可以实现 Italic 命令。
