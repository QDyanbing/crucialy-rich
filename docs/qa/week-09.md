# QA：第 9 周 Bold 和 Italic 闭环

## 当前进度

第 9 周 Day 1「Mark 机制」已完成。

第 9 周 Day 2「Bold 命令」已完成第一版。

第 9 周 Day 3「Italic 命令」已完成第一版。

第 9 周 Day 4「Mark 切分与合并」已完成第一版。

第 9 周 Day 5「Bold/Italic 闭环验收」已完成。

后续进度已迁移至 `docs/qa/week-10.md`。

## 已完成范围

- 新增 text marks 类型，当前支持 `bold` 和 `italic`。
- `TextNode` 可表达 `{ marks: { bold: true } }` 和 `{ marks: { italic: true } }`。
- `createText` 支持传入 marks，并避免共享外部 marks 对象引用。
- 新增 marks helper，覆盖规范化、判断、添加、移除、显式设值、切换和比较。
- `validateDocument` 已覆盖 text marks 合法性。
- `normalizeDocument` 已覆盖 text marks 收敛和相邻同 marks text 合并。
- `createHistorySnapshot` 已覆盖 marks 深拷贝。
- 基础 text/block operation 已补 marks 保留测试。
- 新增 `toggle_mark` operation，支持同一个 paragraph 内切换 mark。
- 新增 paragraph text offset helper，用于 mark 合并后的 selection 映射。
- 新增 `boldCommand`，并接入默认 command registry。
- 新增 `italicCommand`，并接入默认 command registry。
- Bold/Italic command 支持同一个 paragraph 内跨 text selection。
- 混合 marks 选区会统一添加目标 mark，全部激活时会统一移除。
- mark command 通用创建、可执行判断和 active 状态 helper 已公开。
- renderer 已把 bold text 输出为 `<strong>`。
- renderer 已把 italic text 输出为 `<em>`，并覆盖 bold+italic 组合渲染。
- demo 操作区新增“加粗”和“斜体”按钮，并会记录 history。
- demo 文档 JSON 选区映射会展示当前 text 节点 marks。
- demo 新增“文字标记”多节点中文验收样例，按钮通过 `aria-pressed` 暴露 active 状态。
- 新增 `docs/features/marks.md`、`docs/qa/marks.md` 和 `docs/qa/bold-italic.md`。

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
- `packages/core/tests/command/mark-interaction.test.ts`
- `packages/core/tests/command/integration.test.ts`
- `packages/core/tests/command/state.test.ts`
- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前限制

- 暂未接入 React 组件内置 toolbar。
- 暂未实现跨 paragraph 的 mark 应用策略。

## 结论

第 9 周 Mark 机制、Bold、Italic、Mark 切分与合并和 Bold/Italic 闭环验收均已完成；下一步进入第 10 周 Underline 和 Strike 闭环。
