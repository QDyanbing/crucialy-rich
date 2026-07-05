# QA：第 6 周 输入事件和基础编辑闭环

## 当前进度

第 6 周 Day 1「beforeinput 插入文本」已完成。

下一步进入 Day 2「Backspace」。

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
- 新增输入事件功能文档和 QA 记录。

## 自动化覆盖

- `packages/core/tests/input/insert-text.test.ts`
- `packages/core/tests/public-api.test.ts`
- `packages/react/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前限制

- 仅支持 `insertText`。
- 暂不处理 Backspace、Delete、Enter、粘贴、拖拽或 IME composition。
- 暂不替换非折叠 selection 内容。
- 暂不包含 history 或 undo/redo。

## 结论

真实文本输入已经接入 operation/transaction 管线；输入后 `onChange` 输出最新文档模型，选区会落到插入文本后。第 6 周下一步进入 Backspace。
