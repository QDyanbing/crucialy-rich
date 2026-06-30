# QA：Operation insertText（第一版）

## 范围

验证 `insert_text` operation 的创建、应用、边界处理、插入后选区计算和演示调试入口。

## 自动化测试

- `packages/core/tests/operation/insert-text.test.ts`：operation 创建、path 复制、段首/段中/段尾插入、非法 point、空文本 no-op 和插入后 selection。
- `packages/core/tests/public-api.test.ts`：确认 operation API 通过 `@crucialy-rich/core` 入口导出。
- `tests/e2e/demo-shell.spec.ts`：演示操作控件可插入文本，并更新文档 JSON、最近 operation 和选区 JSON。

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

## 当前限制

- 当前只覆盖 `insert_text`，尚未实现 delete、split、merge。
- 非折叠选区不会替换选中内容。
- 真实键盘输入尚未接入 operation。
- 暂无 transaction，失败回滚和批量操作留到后续任务。

## 结论

`insert_text` 的核心模型操作、测试、演示调试和 QA 记录已闭环，下一步可以继续推进 `deleteText`。
