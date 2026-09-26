# 表格

第 21 周完成表格结构和行列命令，第 22 周完成单元格选区、输入和 TSV 粘贴。所有模型修改均通过 Operation、Command 和 Transaction 完成。

## 模型

表格使用固定层级：

```text
document
└── table
    └── tableRow
        └── tableCell
            └── paragraph
                └── text
```

- `table.children` 至少包含一个 `tableRow`。
- 每个 `tableRow` 至少包含一个 `tableCell`，且所有行的单元格数量必须一致。
- `tableCell` 至少包含一个 `paragraph`，不接受其他块类型。
- paragraph 继续使用现有 text 与 marks 规则。

`createTable()` 默认创建 3×3 表格；也可传入行列数。非正数或非有限尺寸会收敛为至少 1×1。

## 路径

表格文本路径为 `[block, row, cell, paragraph, text]`。`getNodeAtPath` 和 `hasNodeAtPath` 可定位 table、row、cell、paragraph 与 text 各层节点。

`CellSelection` 使用 `[block, row, cell]` 路径。`getCellPathFromPoint`、`getCellSelectionFromRange` 和 `isRangeInSameCell` 可从文本选区定位当前 cell；`isValidCellSelection` 用于校验外部传入的选中态。

## 校验与修复

`validateDocument` 会报告空表、空行、非法 row/cell、cell 内非 paragraph、paragraph 内非 text 和行列不齐，并返回对应模型路径。

`normalizeDocument` 会：

- 把空表修复为 1×1。
- 移除非法 row、cell 和 cell 子节点。
- 用空单元格把较短行补齐到最宽行。
- 规范化 paragraph 的 text 与 marks，并为空 cell 补空 paragraph。

## 命令

| 命令              | Payload                 | 行为                                    |
| ----------------- | ----------------------- | --------------------------------------- |
| `insertTable`     | 无                      | 在折叠文本选区处分段并插入默认 3×3 表格 |
| `deleteTable`     | `{ path }`              | 删除顶层表格                            |
| `addRowBefore`    | `{ path, rowIndex }`    | 在目标行前插入同列数空行                |
| `addRowAfter`     | `{ path, rowIndex }`    | 在目标行后插入同列数空行                |
| `deleteRow`       | `{ path, rowIndex }`    | 删除目标行；最后一行被删时移除整表      |
| `addColumnBefore` | `{ path, columnIndex }` | 在目标列前为每行插入空 cell             |
| `addColumnAfter`  | `{ path, columnIndex }` | 在目标列后为每行插入空 cell             |
| `deleteColumn`    | `{ path, columnIndex }` | 删除每行目标列；最后一列被删时移除整表  |

`path` 当前必须指向顶层 table。删表后优先把选区移动到后方文本块，其次移动到前方文本块；文档没有可编辑文本时自动补空段落。

## 渲染

renderer 输出 `table > tbody > tr > td > p` 语义结构，并为模型节点写入 `data-crucialy-path`。cell 额外带有 `data-crucialy-table-cell="true"`，React 受控选中态使用 `data-selected="true"`。

## 单元格编辑

- 普通输入和字符删除复用 `insert_text` / `delete_text`。
- Enter 把当前 paragraph 拆成同一 cell 内的两个 paragraph。
- paragraph 开头的 Backspace 与结尾的 Delete 只合并同一 cell 内的相邻 paragraph。
- 表格文本范围读取以制表符分隔 cell、换行分隔 row，供调试器和选区工具使用。
- `set_table_cell_text` 用一个 paragraph 替换目标 cell 内容，主要供二维粘贴事务复用。

## TSV 粘贴

`getPlainTextTableGrid` 把纯文本 fragment 解析为二维字符串数组。`paste` command 从当前 cell 开始生成多个 `set_table_cell_text` operation；只有整个网格都能落入现有行列时才执行，否则退回 cell 内普通文本粘贴。粘贴不会新增或删除行列。

## HTML 表格粘贴

`parseHtml` 可把顶层 HTML `table` 转换为模型表格，支持直接 `tr` 和 `thead`、`tbody`、`tfoot` 分区。`th` 以普通 cell 导入，行宽不一致时按最宽行补空 cell；每个 cell 至少生成一个 paragraph，并保留其中的多个直接 paragraph、行内 mark 和安全链接。

解析后的表格继续通过 `paste` command 作为结构化 block 插入，整个操作进入一个 Transaction 和一条 History 记录。React 原生 `paste` 事件和 Demo 粘贴验收控制共用这条路径。

## 当前限制

- 暂不支持跨 cell 范围选择、合并单元格和表头。
- HTML 导入不保留 `colspan`、`rowspan`、`th` 语义或嵌套表格结构。
- TSV 超出当前表格范围时不会自动扩表。

验收结果见[基础表格 QA](../qa/table-basic.md)和[表格编辑 QA](../qa/table-editing.md)。
