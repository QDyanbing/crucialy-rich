# QA：第 6 周 输入事件和基础编辑闭环

## 当前进度

第 6 周 Day 1「beforeinput 插入文本」已完成。

第 6 周 Day 2「Backspace」已完成。

第 6 周 Day 3「Delete」已完成。

第 6 周 Day 4「Enter」已完成。

第 6 周 Day 5「基础编辑闭环验收」已完成。

下一步进入第 7 周 Day 1「Command 基础接口」。

## 已完成范围

- 新增 core 输入 helper。
- 实现 `createInsertTextInputTransaction`。
- 实现 `createSelectionAfterInsertTextInput`。
- `RichTextEditor` 监听 `beforeinput` 文本输入。
- `RichTextEditor` 使用 transaction 更新 model，不直接信任 DOM 修改。
- `RichTextEditor` 支持输入后的 `onChange`。
- `RichTextEditor` 支持输入后的 `onSelectionChange`。
- 演示页主编辑区支持真实文本输入。
- 演示页输入后同步文档 JSON、渲染预览和选区 JSON。
- 实现 `createBackspaceInputTransaction`。
- 实现 `createSelectionAfterBackspaceInput`。
- `RichTextEditor` 支持 collapsed selection 下的 Backspace。
- 段中 Backspace 删除前一个字符。
- 段首 Backspace 合并上一段。
- 空段 Backspace 合并上一段。
- Backspace 后同步文档 JSON、渲染预览和选区 JSON。
- 实现 `createDeleteInputTransaction`。
- 实现 `createSelectionAfterDeleteInput`。
- `RichTextEditor` 支持 collapsed selection 下的 Delete。
- 段中 Delete 删除后一个字符。
- 段尾 Delete 合并下一段。
- 空段 Delete 合并下一段。
- Delete 后同步文档 JSON、渲染预览和选区 JSON。
- 实现 `createEnterInputTransaction`。
- 实现 `createSelectionAfterEnterInput`。
- `RichTextEditor` 支持 collapsed selection 下的 Enter。
- 段首、段中、段尾和空段 Enter 分裂 paragraph。
- Enter 后可以继续在新 paragraph 输入文本。
- Enter 后同步文档 JSON、渲染预览和选区 JSON。
- 清理 React 输入事件中的 DOM selection 读取和输入结果提交逻辑。
- 补齐基础编辑组合验收，覆盖输入、Enter、Delete 和 Backspace 合并后继续输入。
- 新增输入事件功能文档和 QA 记录。

## 自动化覆盖

- `packages/core/tests/input/insert-text.test.ts`
- `packages/core/tests/input/backspace.test.ts`
- `packages/core/tests/input/delete.test.ts`
- `packages/core/tests/input/enter.test.ts`
- `packages/core/tests/public-api.test.ts`
- `packages/react/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前限制

- 仅支持 `insertText`、collapsed selection 下的 Backspace、collapsed selection 下的 Delete 和 collapsed selection 下的 Enter。
- 暂不处理粘贴、拖拽或 IME composition。
- 暂不替换非折叠 selection 内容。
- Backspace 暂不处理跨 text 删除或 inline text 节点合并。
- Delete 暂不处理跨 text 删除或 inline text 节点合并。
- Enter 暂不处理非折叠 selection，也不复制 marks 或 block attributes。
- 暂不包含 history 或 undo/redo。

## 结论

真实文本输入、Backspace、Delete 和 Enter 已经接入 operation/transaction 管线；输入后 `onChange` 输出最新文档模型，选区会落到对应操作后的稳定位置。第 6 周输入事件和基础编辑闭环已经完成，下一步进入 Command 系统。
