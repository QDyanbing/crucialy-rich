# QA：输入事件（第一版）

## 范围

验证 `beforeinput insertText`、collapsed selection 下的 Backspace、collapsed selection 下的 Delete 和 collapsed selection 下的 Enter 能通过 transaction 更新模型，而不是直接信任浏览器 DOM 修改结果。

## 自动化测试

- `packages/core/tests/input/insert-text.test.ts`：输入文本转换为 `insert_text` transaction、反向 selection 规范化、通过 operation pipeline 应用、输入后 selection 落点。
- `packages/core/tests/input/backspace.test.ts`：Backspace 转换为 `delete_text` 或 `merge_block` transaction、段中删除、段首合并、空段删除、首段开头 no-op 和 selection 落点。
- `packages/core/tests/input/delete.test.ts`：Delete 转换为 `delete_text` 或 `merge_block` transaction、段中删除、段尾合并、空段删除、末段结尾 no-op 和 selection 落点。
- `packages/core/tests/input/enter.test.ts`：Enter 转换为 `split_block` transaction、段首/段中/段尾/空段分裂、非折叠 selection no-op 和 selection 落点。
- `packages/react/tests/public-api.test.ts`：可编辑状态会暴露为 `aria-readonly="false"`。
- `tests/e2e/demo-shell.spec.ts`：演示页真实输入单字符、连续输入、Backspace 段中删除、Backspace 段首合并、Backspace 合并后继续输入、Delete 段中删除、Delete 段尾合并、Enter 分段、Enter 后继续输入、输入/Enter/Delete 组合编辑和空段 Enter 后，文档 JSON 与选区 JSON 同步更新。

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
| 段中 Delete    | 光标在 text 节点中间按 Delete          | 删除光标后一个字符                | 通过 |
| 段尾 Delete    | 第一段结尾按 Delete                    | 下一段合并到当前段                | 通过 |
| 空段 Delete    | 非末段空段开头按 Delete                | 下一段被并入当前空段              | 通过 |
| Delete 选区    | Delete 后读取选区 JSON                 | selection 落到删除或合并后的落点  | 通过 |
| 段中 Enter     | 光标在 text 节点中间按 Enter           | 当前段分裂为两个段落              | 通过 |
| 段首 Enter     | 光标在段首按 Enter                     | 前方创建空段，文本进入下一段      | 通过 |
| 段尾 Enter     | 光标在段尾按 Enter                     | 后方创建空段                      | 通过 |
| 空段 Enter     | 空段内按 Enter                         | 创建新的空段                      | 通过 |
| Enter 后输入   | Enter 后继续输入文字                   | 文本进入新段开头                  | 通过 |
| 组合编辑       | 输入文字后 Enter，再输入并按 Delete    | 文档分段、删除和选区都稳定        | 通过 |
| 合并后输入     | 第二段段首 Backspace 后继续输入        | 合并段落保持合法并继续插入文本    | 通过 |

## 当前限制

- 仅支持普通 `insertText`、collapsed selection 下的 Backspace、collapsed selection 下的 Delete 和 collapsed selection 下的 Enter。
- 非折叠 selection 暂不替换选中内容。
- 粘贴和 IME composition 尚未接入。
- Backspace 暂不处理非折叠 selection、跨 text 删除或 inline text 节点合并。
- Delete 暂不处理非折叠 selection、跨 text 删除或 inline text 节点合并。
- Enter 暂不处理非折叠 selection，也不复制 marks 或 block attributes。
- 当前不记录 undo/redo 或 history。
- 输入行为暂只覆盖 paragraph 内 text 节点。

## 结论

`beforeinput insertText`、Backspace、Delete 和 Enter 第一版已经闭环：真实输入会转换为 transaction，更新模型并同步选区；基础编辑闭环验收已经完成，下一步进入第 7 周 Day 1「Command 基础接口」。
