# QA：表格编辑闭环

## 验收范围

| 场景           | 预期                                                | 结果 |
| -------------- | --------------------------------------------------- | ---- |
| Cell Selection | 从文本选区定位 `[block, row, cell]`，非法路径被拒绝 | 通过 |
| 单元格输入     | 普通输入与字符删除只更新当前 paragraph              | 通过 |
| Enter          | 在当前 cell 内拆分 paragraph，不跳出表格            | 通过 |
| 段落合并       | Backspace/Delete 只合并同一 cell 的相邻 paragraph   | 通过 |
| 点击状态       | React 回调当前 cell path，受控状态只高亮一个 cell   | 通过 |
| 单行 TSV       | 从当前 cell 向右写入多个 cell                       | 通过 |
| 多行 TSV       | 按行列写入且保持表格尺寸                            | 通过 |
| 越界降级       | 超出剩余行列时保留为当前 cell 普通文本              | 通过 |
| HTML 表格导入  | 分区按序导入、短行补齐、`th` 降级为普通 cell        | 通过 |
| HTML 内容保留  | cell 多段落、行内 mark 和安全链接进入表格模型       | 通过 |
| HTML 空表拒绝  | 空行或仅含过滤节点时不生成非法表格                  | 通过 |
| Demo           | 显示当前 cell path、选中态和 TSV 示例入口           | 通过 |
| 浏览器回归     | 编辑、TSV 和两条 HTML 表格粘贴路径完成后模型合法    | 通过 |

## 自动化覆盖

- Vitest 覆盖 CellSelection、cell 定位、嵌套文本 operation、输入边界、renderer、TSV parser、HTML table parser、cell 内容替换、paste command 和 History 往返。
- React 测试覆盖可编辑语义表格、唯一 cell 选中态和原生 HTML Clipboard 事件。
- Playwright 覆盖真实点击、文字输入、Enter、Backspace、2×2 TSV 粘贴、验收控制 HTML 表格粘贴和原生 HTML 表格 paste 事件。
- 完整质量门禁使用 `pnpm check:all`。

## 结论

第 22 周表格编辑范围已闭环，并补齐顶层 HTML 表格导入。当前仍不支持跨 cell range、合并单元格、表头语义、自动扩表、`colspan` 或 `rowspan`。
