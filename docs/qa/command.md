# QA：Command 闭环验收

## 验收范围

Command 验收覆盖注册、查询、状态读取、执行结果、文本编辑、四种 boolean mark、三种文字属性、Link、Heading、Quote、CodeBlock、Divider、Block 编辑、快捷键配置查询、React 输入层复用和 demo 调试区。

当前内置 command：

- `insertTextCommand`
- `deleteSelectionCommand`
- `boldCommand`
- `italicCommand`
- `underlineCommand`
- `strikeCommand`
- `setFontSizeCommand`
- `setTextColorCommand`
- `setBackgroundColorCommand`
- `setLinkCommand`
- `unsetLinkCommand`
- `setHeadingCommand`
- `toggleQuoteCommand`
- `setCodeBlockCommand`
- `insertDividerCommand`
- `splitBlockCommand`
- `mergeBlockCommand`

## 自动化覆盖

- `packages/core/tests/command/result.test.ts`：成功、失败、跳过结果。
- `packages/core/tests/command/registry.test.ts`：注册、覆盖和列表读取。
- `packages/core/tests/command/can-execute.test.ts`：可执行判断。
- `packages/core/tests/command/execute.test.ts`：按名称执行和异常保护。
- `packages/core/tests/command/insert-text.test.ts`：插入和 range 替换。
- `packages/core/tests/command/delete-selection.test.ts`：range 删除和反向 range 规范化。
- `packages/core/tests/command/bold.test.ts`：选区加粗、取消加粗、collapsed 后续输入继承和 active 状态。
- `packages/core/tests/command/italic.test.ts`：选区斜体、取消斜体、collapsed 后续输入继承、active 状态和 bold+italic 叠加。
- `packages/core/tests/command/underline.test.ts`：选区下划线、取消下划线、collapsed 后续输入继承、跨 text 和 active 状态。
- `packages/core/tests/command/strike.test.ts`：选区删除线、取消删除线、collapsed 后续输入继承、跨 text、active 状态和多 mark 叠加。
- `packages/core/tests/command/mark-interaction.test.ts`：四种 boolean mark 在混合选区中的独立切换。
- `packages/core/tests/command/text-style-interaction.test.ts`：字号、文字颜色、背景色与 boolean mark 组合应用。
- `packages/core/tests/command/link.test.ts`：链接设置、覆盖、取消、状态读取和安全 payload。
- `packages/core/tests/command/heading.test.ts`：1–6 级标题、恢复正文、多块范围和状态读取。
- `packages/core/tests/command/quote.test.ts`：引用切换、取消、多块范围和状态读取。
- `packages/core/tests/command/code-block.test.ts`：代码块切换、恢复正文、marks 清理和状态读取。
- `packages/core/tests/command/divider.test.ts`：分隔线插入、两侧内容保留和选区落点。
- `packages/core/tests/command/block-type-interaction.test.ts`：Heading/Quote 连续切换与 marks 保留。
- `packages/core/tests/command/shortcut.test.ts`：默认映射、配置查询、按键匹配、自定义映射和边界输入。
- `packages/core/tests/command/split-block.test.ts`：段落分裂 command。
- `packages/core/tests/command/merge-block.test.ts`：段落合并 command。
- `packages/core/tests/command/state.test.ts`：状态读取和默认命令状态矩阵。
- `packages/core/tests/command/integration.test.ts`：默认注册表综合执行闭环。
- `tests/e2e/demo-shell.spec.ts`：demo 操作区、真实键盘输入和 Command 状态面板。

## 手测场景

| 场景         | 操作                                            | 预期                                            | 状态 |
| ------------ | ----------------------------------------------- | ----------------------------------------------- | ---- |
| 文本插入     | 在 demo 操作区输入文本后点击“插入”              | 文档 JSON 更新，最近 transaction 包含 insert    | 通过 |
| 选区删除     | 设置非折叠选区后点击“删除选区”                  | 文档 JSON 更新，selection 折叠到删除起点        | 通过 |
| 加粗         | 设置同 text 选区后点击“加粗”                    | 文档 JSON 出现 bold marks，渲染输出 strong      | 通过 |
| 斜体         | 设置同 text 选区后点击“斜体”                    | 文档 JSON 出现 italic marks，渲染输出 em        | 通过 |
| 下划线       | 设置同 text 选区后点击“下划线”                  | 文档 JSON 出现 underline marks，渲染输出 u      | 通过 |
| 删除线       | 设置同 text 选区后点击“删除线”                  | 文档 JSON 出现 strike marks，渲染输出 s         | 通过 |
| 文字属性     | 设置字号、文字颜色和背景色                      | 属性独立更新并保留其他 marks                    | 通过 |
| 链接         | 创建、编辑或取消当前选区链接                    | 安全链接更新，选区与其他 marks 保持             | 通过 |
| 标题         | 选择正文或 1–6 级标题                           | 选中 block 统一切换并保留文字                   | 通过 |
| 引用         | 点击“引用”                                      | 选中 block 统一切换 Quote 或恢复正文            | 通过 |
| 代码块       | 点击“代码块”，输入多行后再次关闭                | CodeBlock 保持纯文本并可恢复正文                | 通过 |
| 分隔线       | 在段落中间点击“分隔线”                          | 当前块分裂，Divider 插入两侧文本之间            | 通过 |
| 跨 text 加粗 | 设置同 block 跨 text 选区后执行 `boldCommand`   | 选中文本被切分加粗并合并同 marks text           | 通过 |
| 跨 text 斜体 | 设置同 block 跨 text 选区后执行 `italicCommand` | 选中文本被切分斜体并合并同 marks text           | 通过 |
| 扩展块 Mark  | 在 heading/quote 内执行 Mark command            | 保留 block 类型并更新选中文字                   | 通过 |
| 分段         | 设置 collapsed selection 后点击“分段”           | 文档新增 paragraph，最近 transaction 包含 split | 通过 |
| 合并段落     | 设置第二段段首 collapsed selection 后点击“合并” | 两段合并，最近 transaction 包含 merge           | 通过 |
| 状态读取     | 调整 selection 的 anchor/focus                  | Command 状态面板在可用/不可用/激活之间同步切换  | 通过 |
| React 输入   | 在编辑器中输入、Enter、Backspace、Delete        | 输入层优先复用 command，文档和 selection 同步   | 通过 |
| 默认注册表   | demo 和 React 使用默认 command registry         | 两侧内置 command 顺序和可执行状态保持一致       | 通过 |
| 快捷键查询   | 查询 Bold、Italic、Underline 和 Strike 配置     | 前三种有默认映射，Strike 默认返回空             | 通过 |
| 快捷键匹配   | 传入 Ctrl/Meta + B/I/U 和边界组合               | 返回对应 command name，非法组合不匹配           | 通过 |

## 当前限制

- 文本 command 当前只支持同一 text 节点内的 range selection。
- Mark command 当前支持 paragraph、heading、quote 中同一 block 内的 selection。
- `splitBlockCommand` / `mergeBlockCommand` / `insertDividerCommand` 当前只支持 collapsed selection。
- Heading/Quote command 支持连续顶层 block 范围，不支持非连续多选。
- collapsed Backspace/Delete 的单字符删除仍保留 input helper；跨段合并路径会优先复用 block command。
- 当前还没有 React 内置 toolbar；mark 快捷键只提供配置和匹配，不绑定编辑器事件。

## 结论

Command 系统已经完成默认注册表、文本与 Block 编辑、四种 boolean mark、三种文字属性、Link、Heading、Quote、CodeBlock、Divider 和快捷键占位：demo 和 React 复用同一套 registry，状态面板可验证 command 可用性和 active 状态，自动化测试覆盖默认注册、状态矩阵、综合执行和浏览器交互。
