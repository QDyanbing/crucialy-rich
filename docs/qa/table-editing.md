# QA：表格编辑闭环

## 验收范围

| 场景           | 预期                                                | 结果 |
| -------------- | --------------------------------------------------- | ---- |
| Cell Selection | 从文本选区定位 `[block, row, cell]`，非法路径被拒绝 | 通过 |
| 单元格输入     | 普通输入与字符删除只更新当前 paragraph              | 通过 |
| Enter          | 在当前 cell 内拆分 paragraph，不跳出表格            | 通过 |
| 段落合并       | Backspace/Delete 只合并同一 cell 的相邻 paragraph   | 通过 |
| 点击状态       | React 回调当前 cell path，受控状态只高亮一个 cell   | 通过 |
| Tab 导航       | Tab／Shift+Tab 按行换格，同步 DOM 光标和 cell 高亮  | 通过 |
| 导航保护       | 首尾不扩表，不新增 History，IME/宿主/多实例隔离     | 通过 |
| 单行 TSV       | 从当前 cell 向右写入多个 cell                       | 通过 |
| 多行 TSV       | 按行列写入且保持表格尺寸                            | 通过 |
| 越界降级       | 超出剩余行列时保留为当前 cell 普通文本              | 通过 |
| HTML 表格导入  | 分区按序导入、短行补齐、`th` 降级为普通 cell        | 通过 |
| HTML 内容保留  | cell 多段落、行内 mark 和安全链接进入表格模型       | 通过 |
| HTML 空表拒绝  | 空行或仅含过滤节点时不生成非法表格                  | 通过 |
| 多段落格式     | 同一 cell 内连续 paragraph 统一应用或取消文字格式   | 通过 |
| 格式状态       | 正反向范围统一读取 boolean mark 与 Link active 状态 | 通过 |
| 格式 History   | 多段落 operation 作为一条记录完成撤销与重做         | 通过 |
| 跨段落删除     | 合并同 cell 边界，保留 marks/link、邻格与行列数     | 通过 |
| 整格清空       | 删除全部段落文字后留下一个可编辑空 paragraph        | 通过 |
| 输入替换       | 普通文本与中文组合输入替换同 cell 跨段落选区        | 通过 |
| 选区 Enter     | 删除后在原 cell 分段，光标可继续在新段落输入        | 通过 |
| 编辑 History   | 删除、替换与 Enter 一次撤销/重做，恢复原选区        | 通过 |
| 范围粘贴       | 同 cell 跨段落纯文本/TSV 替换，保留邻格和后缀       | 通过 |
| TSV 选区策略   | 非折叠文本选区不填网格，折叠光标仍支持二维填充      | 通过 |
| 结构边界       | Core 拒绝跨 cell、进出表格与非法 Point 的范围操作   | 通过 |
| Demo           | 显示当前 cell path、选中态和 TSV 示例入口           | 通过 |
| 浏览器回归     | 编辑、TSV 和两条 HTML 表格粘贴路径完成后模型合法    | 通过 |

## 自动化覆盖

- 单元格导航：Core `cell-navigation*.test.ts`、`table-navigation-structure.test.ts`、`table-navigation-editing.test.ts` 共 23 项，验证相邻目标、正反向范围、非法点、路径隔离、结构更新、TSV/Enter 与输入 History；React `table-navigation.test.ts` 22 项验证受控选区、连续导航、ref 续编、cell 回调、边缘、只读、IME、修饰键、宿主接管、列表缩进和多实例隔离。
- Chromium 七条导航用例覆盖 Tab/Shift+Tab 与跨行、首尾默认行为、光标与高亮、同 cell 多段选区不删除、输入/TSV 后导航及撤销、组合输入/修饰键与外部编辑器选区；公开构建包同时验证运行时导出、类型声明、纯查询与后续输入撤销。
- 原生混合 MIME 在 cell 中降级到实际纯文本，选区只替换当前 cell，折叠光标保留 TSV 填格；富格式独占与跨 cell 范围取消默认写入，模型和 History 不变，后续编辑仍可继续。
- Vitest 覆盖 CellSelection、cell 定位、嵌套文本 operation、多段落格式与范围编辑 command、输入边界、renderer、TSV parser、HTML table parser、cell 内容替换、paste command 和 History 往返。
- React 测试覆盖可编辑语义表格、唯一 cell 选中态、跨段落格式快捷键、范围替换/删除/Enter/Composition 和原生 HTML Clipboard 事件；文本输入事件按 Chromium 的 React 18 `textInput` 路径模拟。
- Playwright 覆盖真实点击、文字输入、Enter、Backspace、同一 cell 多段落 Toolbar 格式化、跨段落编辑与 History、Composition 事件、2×2 TSV 粘贴、验收控制 HTML 表格粘贴和原生 HTML 表格 paste 事件。
- 完整质量门禁使用 `pnpm check:all`。
- 范围粘贴的 Core/React/Chromium 验证包含正反向选区、多行与 TSV、删除后插入点、邻格与尺寸不变、History、重做后的继续输入。

## 结论

第 22 周表格编辑范围已闭环，并补齐顶层 HTML 表格导入、同一 cell 多段落格式化及选区编辑。当前仍不支持跨 cell 或进出表格的范围编辑、合并单元格、表头语义、自动扩表、`colspan` 或 `rowspan`。Composition 自动化覆盖事件管线，不等同于各系统真实输入法兼容性验收。

2026-10-21 补齐表格 Tab／Shift+Tab 导航验收。首尾无目标时保留浏览器默认事件，不添加行列或导航事务；History 的 batch 合并策略保持既有契约。
