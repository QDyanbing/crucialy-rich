# QA：Operation（第一版）

## 范围

验证 `insert_text`、`delete_text`、`split_block` 和 `merge_block` operation 的创建、应用、边界处理、操作后选区计算和演示调试入口。

## 自动化测试

- `packages/core/tests/operation/insert-text.test.ts`：operation 创建、path 复制、段首/段中/段尾插入、非法 point、空文本 no-op 和插入后 selection。
- `packages/core/tests/operation/delete-text.test.ts`：operation 创建、path 复制、段首/段中/段尾删除、反向 range、非法 range、折叠 range no-op 和删除后 selection。
- `packages/core/tests/operation/split-block.test.ts`：operation 创建、path 复制、段首/段中/段尾分段、多 text children、非法 point 和分段后 selection。
- `packages/core/tests/operation/merge-block.test.ts`：operation 创建、path 复制、普通段落合并、空段落合并、非法 point 和合并后 selection。
- `packages/core/tests/public-api.test.ts`：确认 operation API 通过 `@crucialy-rich/core` 入口导出。
- `tests/e2e/demo-shell.spec.ts`：演示操作控件可插入、删除、分段或合并文本，并更新文档 JSON、最近 operation 和选区 JSON。

命令：

```sh
pnpm test
pnpm test:e2e
```

## 手测场景

| 场景             | 操作                                  | 期望                                  | 结果 |
| ---------------- | ------------------------------------- | ------------------------------------- | ---- |
| 创建 insert 操作 | 调用 `createInsertTextOperation`      | 返回 `type: "insert_text"` 的操作对象 | 通过 |
| 段首插入         | offset 为 `0`                         | 文本插入到 text 开头                  | 通过 |
| 段中插入         | offset 位于 text 中间                 | 文本按 offset 切分后插入              | 通过 |
| 段尾插入         | offset 等于 `text.length`             | 文本追加到 text 末尾                  | 通过 |
| 非法 point       | path 不指向 text 或 offset 越界       | 抛出 `RangeError`                     | 通过 |
| 空文本插入       | `text` 为空字符串                     | 返回原文档引用                        | 通过 |
| 插入后选区       | 调用 `createSelectionAfterInsertText` | selection 折叠到插入文本后面          | 通过 |
| 演示插入         | 在演示中填写“插入文本”并点击“插入”    | 文档 JSON、渲染预览和最近操作同步更新 | 通过 |
| 创建 delete 操作 | 调用 `createDeleteTextOperation`      | 返回 `type: "delete_text"` 的操作对象 | 通过 |
| 段首删除         | range 从 offset `0` 开始              | 删除 text 开头内容                    | 通过 |
| 段中删除         | range 位于 text 中间                  | 删除 range 内文本并拼接前后内容       | 通过 |
| 段尾删除         | range 结束于 `text.length`            | 删除 text 末尾内容                    | 通过 |
| 反向删除         | anchor 在 focus 后面                  | 先规范化 range 再删除                 | 通过 |
| 非法 range       | point 越界或跨 text 节点              | 抛出 `RangeError`                     | 通过 |
| 折叠删除         | anchor 和 focus 相同                  | 返回原文档引用                        | 通过 |
| 删除后选区       | 调用 `createSelectionAfterDeleteText` | selection 折叠到删除范围起点          | 通过 |
| 演示删除         | 设置选区后点击“删除选区”              | 文档 JSON、渲染预览和最近操作同步更新 | 通过 |
| 创建 split 操作  | 调用 `createSplitBlockOperation`      | 返回 `type: "split_block"` 的操作对象 | 通过 |
| 段中分段         | point 位于 text 中间                  | paragraph 拆成前后两个 paragraph      | 通过 |
| 段首分段         | offset 为 `0`                         | 前一段为空，后一段保留原文本          | 通过 |
| 段尾分段         | offset 等于 `text.length`             | 前一段保留原文本，后一段为空          | 通过 |
| 多 text 分段     | point 位于 paragraph 的中间 text      | point 左右 children 分配到两侧        | 通过 |
| 分段后选区       | 调用 `createSelectionAfterSplitBlock` | selection 折叠到新 paragraph 开头     | 通过 |
| 演示分段         | 设置光标后点击“分段”                  | 文档 JSON、渲染预览和最近操作同步更新 | 通过 |
| 创建 merge 操作  | 调用 `createMergeBlockOperation`      | 返回 `type: "merge_block"` 的操作对象 | 通过 |
| 普通段落合并     | 第二段段首执行 merge                  | 第二段并入第一段                      | 通过 |
| 空段落合并       | 空段落和非空段落执行 merge            | 去掉无意义空 text                     | 通过 |
| 非法 merge       | 首段或非段首 point 执行 merge         | 抛出 `RangeError`                     | 通过 |
| 合并后选区       | 调用 `createSelectionAfterMergeBlock` | selection 折叠到原上一段末尾          | 通过 |
| 演示合并         | 第二段段首点击“合并段落”              | 文档 JSON、渲染预览和最近操作同步更新 | 通过 |

## 当前限制

- 当前覆盖 `insert_text`、同 text 节点内的 `delete_text`、paragraph 级 `split_block` 和 `merge_block`。
- 非折叠选区不会替换选中内容。
- 删除暂不支持跨 text 节点或跨 paragraph range。
- 合并暂不支持批量跨多段合并。
- 真实键盘输入尚未接入 operation。
- 暂无 transaction，失败回滚和批量操作留到后续任务。

## 结论

`insert_text`、`delete_text`、`split_block` 和 `merge_block` 的核心模型操作、测试、演示调试和 QA 记录已闭环，下一步可以继续推进 transaction。
