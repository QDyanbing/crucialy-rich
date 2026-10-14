# QA：跨节点与跨块选区编辑

## 范围

验证非折叠选区在同一文本容器内跨 text 节点、跨连续顶层文本块，以及同一表格单元格内跨连续 paragraph 时，可以完成删除、输入替换、Enter 分段、选区恢复和 History 往返。

## 自动化覆盖

- 文本容器偏移：paragraph、heading、quote、列表项和表格段落共用偏移与 Point 映射。
- 同容器编辑：跨 marks text 节点执行输入、Backspace 和 Delete，删除后 selection 落在真实节点。
- 跨块 operation：`delete_range` 支持正向与反向范围，保留起始块类型，拼接边界内容并拒绝结构节点。
- CodeBlock 边界：作为起始块时移除拼接后缀的 marks，结果通过模型校验。
- 同 cell operation：正反向范围、整格删空、仅删除段落换行、边界 marks/link 保留、非法 offset、跨 cell 和进出表格的拒绝规则均通过。
- Command：`insertTextCommand` 和 `deleteSelectionCommand` 按范围选择 `delete_text` 或 `delete_range`。
- Enter：`splitBlockCommand` 组合范围删除与当前位置的 Enter operation，并保留 CodeBlock、列表项和表格段落语义。
- React：浏览器 DOM Range 跨 text 节点或段落时，输入、Backspace 和 Delete 均更新模型而非直接修改 DOM。
- History：跨块替换记录为一个历史项，撤销恢复原块结构，重做恢复替换结果。
- 同 cell History：删除、替换和 Enter 各自记录一项，恢复反向选区，重做恢复光标；撤销后新编辑清空 redo。
- 同 cell 输入：React 事件与 Chromium 覆盖普通替换、中文组合输入、Backspace/Delete、选区 Enter、继续输入和 History，邻格与行列数不变。
- 范围粘贴：顶层连续文本块接受纯文本/HTML/Markdown，同 cell 连续 paragraph 接受纯文本及 TSV；复用删除计划恢复插入位置，有文本选区时不做二维填充。
- 粘贴 History 与原生事件：Core、React 和 Chromium 覆盖一次撤销/重做、原选区恢复、邻格保留与粘贴后继续输入。
- Demo：中文“跨块选区编辑”样例提供三段、三种 marks 和预置跨块选区。

## 边界矩阵

| 范围                      | 删除 | 输入替换 | Enter | 结果 |
| ------------------------- | ---- | -------- | ----- | ---- |
| 同一 text 节点            | 支持 | 支持     | 支持  | 通过 |
| 同一文本容器跨 text 节点  | 支持 | 支持     | 支持  | 通过 |
| 连续顶层文本块            | 支持 | 支持     | 支持  | 通过 |
| 同 cell 连续 paragraph    | 支持 | 支持     | 支持  | 通过 |
| 跨 Divider 或 Image       | 拒绝 | 拒绝     | 拒绝  | 通过 |
| 跨列表项、cell 或进出表格 | 拒绝 | 拒绝     | 拒绝  | 通过 |
| 列表项或表格段落内部      | 支持 | 支持     | 支持  | 通过 |

## 验证命令

```sh
pnpm --filter @crucialy-rich/core test
pnpm test:e2e
pnpm check:all
```

## 结论

跨节点、基础跨块与同 cell 连续段落编辑闭环已完成。跨列表项、不同 cell 或进出表格的复杂删除仍需独立设计文档模型变换规则后再扩展。
