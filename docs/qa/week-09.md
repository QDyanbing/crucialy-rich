# QA：第 9 周 Bold 和 Italic 闭环

## 当前进度

第 9 周 Day 1「Mark 机制」已完成。

☑️ 当前指针：第 9 周 Day 2「Bold 命令」待开始。

## 已完成范围

- 新增 text marks 类型，当前支持 `bold` 和 `italic`。
- `TextNode` 可表达 `{ marks: { bold: true } }` 和 `{ marks: { italic: true } }`。
- `createText` 支持传入 marks，并避免共享外部 marks 对象引用。
- 新增 marks helper，覆盖规范化、判断、添加、移除、切换和比较。
- `validateDocument` 已覆盖 text marks 合法性。
- `normalizeDocument` 已覆盖 text marks 收敛。
- `createHistorySnapshot` 已覆盖 marks 深拷贝。
- 基础 text/block operation 已补 marks 保留测试。
- 新增 `docs/features/marks.md` 和 `docs/qa/marks.md`。

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

- 暂未实现 Bold / Italic command。
- 暂未接入 renderer 标签输出。
- 暂未接入 React 组件和 demo 工具栏。
- 暂未实现跨 range 的 mark 应用策略。

## 结论

第 9 周已进入 Bold 和 Italic 阶段，当前完成的是 mark 数据层地基；下一步可以实现 Bold 命令。
