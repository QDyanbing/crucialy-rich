# QA：输入事件闭环

## 范围

验证输入、Backspace、Delete 和 Enter 通过 command/transaction 更新模型，同时覆盖 CodeBlock 换行/退出与 Divider 前后删除。

## 自动化测试

- `packages/core/tests/input/insert-text.test.ts`：输入文本转换为 `insert_text` transaction、反向 selection 规范化、通过 operation pipeline 应用、输入后 selection 落点。
- `packages/core/tests/input/backspace.test.ts`：Backspace 转换为 `delete_text` 或 `merge_block` transaction、段中删除、段首合并、空段删除、首段开头 no-op 和 selection 落点。
- `packages/core/tests/input/delete.test.ts`：Delete 转换为 `delete_text` 或 `merge_block` transaction、段中删除、段尾合并、空段删除、末段结尾 no-op 和 selection 落点。
- `packages/core/tests/input/enter.test.ts`：Enter 转换为 `split_block` transaction、段首/段中/段尾/空段分裂、非折叠 selection no-op 和 selection 落点。
- CodeBlock 与 Divider 测试：代码块换行/退出、void block 相邻 Backspace/Delete 和选区 path 调整。
- `packages/core/tests/command/insert-text.test.ts`：collapsed 插入和同一 text range 替换。
- `packages/core/tests/command/delete-selection.test.ts`：同一 text range 的 Backspace/Delete 共用删除命令。
- `packages/core/tests/command/block-type-interaction.test.ts`：Block Type 切换后继续输入，文字、marks 和选区保持稳定。
- `packages/react/tests/public-api.test.ts`：可编辑语义、输入 transaction 与组件回调契约。
- `tests/e2e/demo-shell.spec.ts`：真实输入、range 删除、Backspace/Delete 合并、Enter 分段、Quote 内输入/删除/换行、History 和组合编辑。

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
| 选区替换       | 同一 text 内选中文字后输入             | 先删除选区，再插入输入文字        | 通过 |
| 选区删除       | 同一 text 内选中文字后按删除键         | 删除选区并折叠到起点              | 通过 |
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
| Quote 输入     | Quote 内输入、删除并按 Enter           | Quote 类型、文字和选区保持稳定    | 通过 |
| CodeBlock 输入 | 输入、Enter 换行、连续 Enter 退出      | 纯文本和后续 paragraph 稳定       | 通过 |
| Divider 删除   | 从前后文本边界按 Delete/Backspace      | Divider 删除且选区保持合法        | 通过 |
| 列表 Enter     | 非空项分裂，空项退出                   | 项目和三层选区保持合法            | 通过 |
| History        | 执行真实输入后撤销和重做               | 文档、Block Type 和选区正确往返   | 通过 |

## 当前限制

- 普通 `insertText` 和 Backspace/Delete 的非折叠 selection 当前要求落在同一 text 节点内。
- 粘贴和 IME composition 尚未接入。
- Backspace/Delete 暂不处理跨 text 或跨 block range 删除。
- Enter 暂不处理非折叠 selection；collapsed Enter 会继承当前 Block Type、heading level 和 text marks。
- React 组件通过 `onTransaction` 暴露记录入口，但 History 状态仍由宿主维护。
- 空 Quote 自动退出、粘贴解析和 IME composition 完整生命周期仍未实现。

## 结论

输入已接入 Command、Transaction、History 和文本/void block 流程。当前已验证普通文本块、CodeBlock 与 Divider 边界，后续集中在跨节点删除、粘贴和 IME。
