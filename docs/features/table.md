# 基础表格

第 21 周提供只读结构展示和行列级命令，为下一周的单元格选区与编辑建立稳定模型。所有修改均通过 Command 和 Transaction 完成。

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

renderer 输出 `table > tbody > tr > td > p` 语义结构，并为模型节点写入 `data-crucialy-path`。本阶段 table 标记为 `contentEditable=false`，避免在单元格编辑协议完成前由浏览器直接改写 DOM。

## 当前限制

- 暂不支持单元格光标、Cell Selection、合并单元格和表头。
- 暂不支持单元格内输入、删除、换行和 TSV 粘贴。
- 暂不支持通过 HTML Clipboard parser 导入表格。
- 单元格真实编辑与选中态属于第 22 周范围。

验收结果见[基础表格 QA](../qa/table-basic.md)。
