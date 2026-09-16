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
| Demo           | 显示当前 cell path、选中态和 TSV 示例入口           | 通过 |
| 浏览器回归     | 输入、Enter、Backspace、选中和 TSV 组合后模型合法   | 通过 |

## 自动化覆盖

- Vitest 覆盖 CellSelection、cell 定位、嵌套文本 operation、输入边界、renderer、TSV parser、cell 内容替换和 paste command。
- React 静态渲染测试覆盖可编辑语义表格和唯一 cell 选中态。
- Playwright 覆盖真实点击、文字输入、Enter、Backspace 与 2×2 TSV 粘贴。
- 完整质量门禁使用 `pnpm check:all`。

## 结论

第 22 周表格编辑范围已闭环。当前没有提前实现跨 cell range、合并单元格、表头、自动扩表或第 23 周 IME 协议。
