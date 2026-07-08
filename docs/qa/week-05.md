# QA：第 5 周 Operation 和 Transaction 闭环

## 当前进度

第 5 周 Day 1「insertText」已完成。

第 5 周 Day 2「deleteText」已完成。

第 5 周 Day 3「splitBlock 和 mergeBlock」已完成。

第 5 周 Day 4「Transaction」已完成。

第 5 周 Day 5「Operation 闭环验收」已完成。

下一步进入第 6 周 Day 1「beforeinput 插入文本」。

## 已完成范围

- 定义 operation 基础类型。
- 实现 `insert_text` 操作创建。
- 实现 `applyInsertText`。
- 实现插入后的折叠选区计算。
- 演示页增加插入文本调试入口。
- 实现 `delete_text` 操作创建。
- 实现同一 text 节点内的 `applyDeleteText`。
- 实现删除后的折叠选区计算。
- 演示页增加删除选区调试入口。
- 实现 `split_block` 操作创建。
- 实现 `applySplitBlock`。
- 实现分段后的折叠选区计算。
- 演示页增加分段调试入口。
- 实现 `merge_block` 操作创建。
- 实现 `applyMergeBlock`。
- 实现合并后的折叠选区计算。
- 演示页增加合并段落调试入口。
- 实现 transaction 数据结构。
- 实现 `applyOperation` 分发器。
- 实现 `applyTransaction` 批量应用。
- transaction 结束后自动执行 normalize。
- 演示页展示最近 transaction。
- 实现 operation 类型注册、text/block 分类和只读摘要。
- 实现 transaction 摘要。
- 实现 transaction 闭环验收报告。
- 演示页展示最近 transaction 验收报告。
- 文档和 QA 记录同步更新。

## 自动化覆盖

- `packages/core/tests/operation/insert-text.test.ts`
- `packages/core/tests/operation/delete-text.test.ts`
- `packages/core/tests/operation/split-block.test.ts`
- `packages/core/tests/operation/merge-block.test.ts`
- `packages/core/tests/operation/transaction.test.ts`
- `packages/core/tests/operation/summary.test.ts`
- `packages/core/tests/operation/acceptance.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前限制

- 普通 `beforeinput insertText`、Backspace、Delete 和 Enter 已在第 6 周接入。
- `deleteText` 暂不支持跨 text 节点或跨 paragraph 删除。
- `mergeBlock` 暂不支持批量跨多段合并。
- transaction 当前不包含 inverse、撤销重做或 history 记录。

## 结论

`insertText`、`deleteText`、`splitBlock`、`mergeBlock` 和 `Transaction` 已按代码、测试、demo、文档、摘要和验收报告完成综合闭环；第 5 周 Operation 和 Transaction 阶段完成，下一步进入真实输入事件。
