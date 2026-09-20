# QA：跨节点与跨块选区编辑

## 范围

验证非折叠选区在同一文本容器内跨 text 节点、以及跨连续顶层文本块时，可以完成删除、输入替换、Enter 分段、选区恢复和 History 往返。

## 自动化覆盖

- 文本容器偏移：paragraph、heading、quote、列表项和表格段落共用偏移与 Point 映射。
- 同容器编辑：跨 marks text 节点执行输入、Backspace 和 Delete，删除后 selection 落在真实节点。
- 跨块 operation：`delete_range` 支持正向与反向范围，保留起始块类型，拼接边界内容并拒绝结构节点。
- CodeBlock 边界：作为起始块时移除拼接后缀的 marks，结果通过模型校验。
- Command：`insertTextCommand` 和 `deleteSelectionCommand` 按范围选择 `delete_text` 或 `delete_range`。
- Enter：`splitBlockCommand` 组合范围删除与当前位置的 Enter operation，并保留 CodeBlock、列表项和表格段落语义。
- React：浏览器 DOM Range 跨 text 节点或段落时，输入、Backspace 和 Delete 均更新模型而非直接修改 DOM。
- History：跨块替换记录为一个历史项，撤销恢复原块结构，重做恢复替换结果。
- Demo：中文“跨块选区编辑”样例提供三段、三种 marks 和预置跨块选区。

## 边界矩阵

| 范围                     | 删除 | 输入替换 | Enter | 结果 |
| ------------------------ | ---- | -------- | ----- | ---- |
| 同一 text 节点           | 支持 | 支持     | 支持  | 通过 |
| 同一文本容器跨 text 节点 | 支持 | 支持     | 支持  | 通过 |
| 连续顶层文本块           | 支持 | 支持     | 支持  | 通过 |
| 跨 Divider 或 Image      | 拒绝 | 拒绝     | 拒绝  | 通过 |
| 跨 List 或 Table 结构    | 拒绝 | 拒绝     | 拒绝  | 通过 |
| 列表项或表格段落内部     | 支持 | 支持     | 支持  | 通过 |

## 验证命令

```sh
pnpm --filter @crucialy-rich/core test
pnpm test:e2e
pnpm check:all
```

## 结论

跨节点与基础跨块编辑闭环已完成。当前边界刻意停在连续顶层文本块，结构节点之间的复杂删除需要独立设计文档模型变换规则后再扩展。
