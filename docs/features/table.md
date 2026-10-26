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
- 同一 cell 内跨连续 paragraph 的非折叠选区可通过 Backspace/Delete 删除、普通输入或中文组合输入替换；共用 `delete_range` 合并边界，保留范围之外的文字、marks 和邻格内容。
- 选区 Enter 先删除范围，再在起点分段；两个 operation 组成一个 transaction，光标落在同一 cell 的新 paragraph 开头。
- 跨段落删除支持正向和反向选区；整格文字被删后保留一个可编辑空 paragraph，撤销恢复原段落及原选区，重做恢复结果及光标。
- 表格文本范围读取以制表符分隔 cell、换行分隔 row，供调试器和选区工具使用。
- `set_table_cell_text` 用一个 paragraph 替换目标 cell 内容，主要供二维粘贴事务复用。

## 键盘导航

可编辑 React 编辑器在表格内接管不带 Ctrl/Meta/Alt 的 Tab 和 Shift+Tab：按行优先移动到下一个／上一个 cell，跨行时连接当前行与相邻行，目标总是该 cell 第一个 paragraph 的第一个 text 起点。源选区可折叠，也可为同 cell 内正向／反向多段范围；导航只折叠并移动选区，不删除选中文字。

Core 提供纯查询 `getAdjacentCellSelection(document, selection, direction?)`，`direction` 为 `"next" | "previous"`，默认 `"next"`。它基于当前文档计算合法的折叠 `RangeSelection`，anchor/focus 的路径互不共享；非法源 Point、跨 cell／跨表范围、非矩形表格、无有效目标或超出首尾时返回 undefined，不修改文档或扩表。

成功导航会立即回写当前编辑器的 DOM Selection，并调用 `onSelectionChange`、`onCellSelectionChange`，同时清除旧图片块选中态。它不依赖 Command Registry，也不产生 `onChange`、Transaction 或 History。受控宿主应回传新的 selection/cellSelection；未传 selection 的非受控用法也能继续从 DOM 光标导航或输入。

导航不会重置宿主的输入 batch。History 默认仍按相同非空 batch 合并；需要换格后分开撤销不同 cell 的 typing 时，可在 `recordHistory` 中启用 `mergePolicy: "adjacent"`。Demo 已启用，导航本身仍不生成记录；更复杂的边界可由宿主调整 batch，参见[History](./history.md#可选的相邻输入策略)。

首格 Shift+Tab、末格 Tab 不取消浏览器默认行为，不新增行列；组合输入期间、原生 `isComposing`、只读、宿主 `onKeyDown` 已取消事件或浏览器选区不完整位于当前编辑器内时，不执行导航。跨 cell 选区也不被导航改写。列表原有的 Tab 缩进规则不变。

## TSV 粘贴

`getPlainTextTableGrid` 把纯文本 fragment 解析为二维字符串数组。`paste` command 在折叠光标下从当前 cell 开始生成多个 `set_table_cell_text` operation；只有整个网格都能落入现有行列时才执行，否则退回 cell 内普通文本粘贴。粘贴不会新增或删除行列。

同 cell 有文本选区时，纯文本或 TSV 只替换选中文字：单段范围先执行 `delete_text`，跨连续 paragraph 范围先执行 `delete_range`，再插入并按换行分段。即使 TSV 能填入现有表格也不会覆盖邻格；撤销与重做恢复段落结构和选区。

React 原生剪贴板同时提供 HTML/Markdown 和纯文本时，会跳过 cell 不接受的富片段并回退到实际纯文本；折叠光标可继续做 TSV 填格，文本选区则只做 cell 内替换。只有富片段或跨 cell 选区时阻止默认写入，不猜造纯文本，也不新增 History。

## HTML 表格粘贴

`parseHtml` 可把顶层 HTML `table` 转换为模型表格，支持直接 `tr` 和 `thead`、`tbody`、`tfoot` 分区。`th` 以普通 cell 导入，行宽不一致时按最宽行补空 cell；每个 cell 至少生成一个 paragraph，并保留其中的多个直接 paragraph、行内 mark 和安全链接。

解析后的表格继续通过 `paste` command 作为结构化 block 插入，整个操作进入一个 Transaction 和一条 History 记录。React 原生 `paste` 事件和 Demo 粘贴验收控制共用这条路径。

## HTML 表格复制

显式开启 `clipboardFormat="html"` 后，同一行跨 cell 范围及完整连续行可导出结构化表格，保留多段文字、marks 和安全链接。首尾按文字范围裁剪；单 cell 仍按 paragraph 输出，部分跨行、跨表或进出表格回退完整纯文本，不解释为矩形选区。详细端点要求见[表格复制规则](./copy-cut.md#表格片段)。

复制不新增 Transaction 或 History，只读同样支持；不扩大跨 cell 剪切、删除或 cell 内富片段粘贴范围。Demo 的“表格复制”样例包含未选前后内容、多段 cell、文字样式和完整行。

## 当前限制

- 同一 cell 内的连续 paragraph 支持 boolean mark、文字属性、链接和清除格式，并作为一个 transaction 进入 History；暂不支持跨 cell 的格式化选区。
- 暂不支持跨 cell 或进出表格的范围编辑、合并单元格和表头；同 cell 跨段落编辑不会新增或删除行列。
- HTML 导入不保留 `colspan`、`rowspan`、`th` 语义或嵌套表格结构。
- TSV 超出当前表格范围时不会自动扩表。

验收结果见[基础表格 QA](../qa/table-basic.md)和[表格编辑 QA](../qa/table-editing.md)。
