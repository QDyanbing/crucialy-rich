# QA：输入事件（第一版）

## 范围

验证 `beforeinput insertText` 和 collapsed selection 下的 Backspace 能通过 transaction 更新模型，而不是直接信任浏览器 DOM 修改结果。

## 自动化测试

- `packages/core/tests/input/insert-text.test.ts`：输入文本转换为 `insert_text` transaction、反向 selection 规范化、通过 operation pipeline 应用、输入后 selection 落点。
- `packages/core/tests/input/backspace.test.ts`：Backspace 转换为 `delete_text` 或 `merge_block` transaction、段中删除、段首合并、空段删除、首段开头 no-op 和 selection 落点。
- `packages/react/tests/public-api.test.ts`：可编辑状态会暴露为 `aria-readonly="false"`。
- `tests/e2e/demo-shell.spec.ts`：演示页真实输入单字符、连续输入、Backspace 段中删除和 Backspace 段首合并后，文档 JSON 与选区 JSON 同步更新。

命令：

```sh
pnpm test
pnpm test:e2e
```

## 手测场景

| 场景           | 操作                                   | 期望                              | 结果 |
| -------------- | -------------------------------------- | --------------------------------- | ---- |
| 单字符输入     | 在主编辑区光标处输入一个字符           | 文档 JSON 插入该字符              | 通过 |
| 连续输入       | 在主编辑区连续输入多个字符             | 字符按顺序插入，光标持续前进      | 通过 |
| 模型更新来源   | 输入时触发 `beforeinput`               | 通过 transaction 更新 model       | 通过 |
| 输入后选区     | 输入后读取选区 JSON                    | selection 折叠到插入文本后        | 通过 |
| 外部事件拦截   | 外部 `onBeforeInput` 已 preventDefault | 内部不再创建 transaction          | 通过 |
| 非可编辑渲染   | 不传 `contentEditable`                 | 不处理输入，保持只读语义          | 通过 |
| 可编辑语义     | 传入 `contentEditable`                 | 根节点 `aria-readonly` 为 `false` | 通过 |
| 连续输入稳定性 | 输入两个中文字符                       | 第二个字符插入到第一个字符之后    | 通过 |
| 段中 Backspace | 光标在 text 节点中间按 Backspace       | 删除光标前一个字符                | 通过 |
| 段首 Backspace | 第二段开头按 Backspace                 | 当前段合并到上一段                | 通过 |
| 空段 Backspace | 空段开头按 Backspace                   | 空段被并入上一段                  | 通过 |
| Backspace 选区 | Backspace 后读取选区 JSON              | selection 落到删除或合并后的落点  | 通过 |

## 当前限制

- 仅支持普通 `insertText` 和 collapsed selection 下的 Backspace。
- 非折叠 selection 暂不替换选中内容。
- Delete、Enter、粘贴和 IME composition 尚未接入。
- Backspace 暂不处理非折叠 selection、跨 text 删除或 inline text 节点合并。
- 当前不记录 undo/redo 或 history。
- 输入行为暂只覆盖 paragraph 内 text 节点。

## 结论

`beforeinput insertText` 和 Backspace 第一版已经闭环：真实输入会转换为 transaction，更新模型并同步选区；下一步进入第 6 周 Day 3「Delete」。
