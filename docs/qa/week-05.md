# QA：第 5 周 Operation 和 Transaction 闭环

## 当前进度

第 5 周 Day 1「insertText」已完成。

第 5 周 Day 2「deleteText」已完成。

下一步进入 Day 3「splitBlock 和 mergeBlock」。

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
- 文档和 QA 记录同步更新。

## 自动化覆盖

- `packages/core/tests/operation/insert-text.test.ts`
- `packages/core/tests/operation/delete-text.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前限制

- 尚未实现 `splitBlock` 或 `mergeBlock`。
- 尚未实现 transaction。
- 尚未接入真实 `beforeinput`。
- `deleteText` 暂不支持跨 text 节点或跨 paragraph 删除。

## 结论

`insertText` 和 `deleteText` 已按代码、测试、demo、文档和验收记录闭环；第 5 周剩余任务继续从分段和合并开始。
