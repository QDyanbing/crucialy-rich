# QA：粘贴闭环

## 能力矩阵

| 场景          | 预期                                              | 状态 |
| ------------- | ------------------------------------------------- | ---- |
| Parser 调度   | Markdown、HTML、纯文本按顺序解析并可降级          | 通过 |
| 纯文本单行    | 在光标处插入且不拆块                              | 通过 |
| 纯文本多行    | 普通块分段、列表拆项，CodeBlock 保留内部换行      | 通过 |
| 替换选区      | 支持正反向及同块跨 mark 文本节点                  | 通过 |
| 顶层范围替换  | 纯文本、HTML、Markdown 替换连续文本块，恢复光标   | 通过 |
| cell 范围替换 | 纯文本及 TSV 替换同 cell 连续 paragraph，保留邻格 | 通过 |
| TSV 选区边界  | 折叠光标二维填充；有文本选区时只替换选区          | 通过 |
| 结构拒绝      | Core 拒绝跨列表、void、cell、进出表格和非法 Point | 通过 |
| HTML          | 保留 paragraph、文字标记、link、ul/ol/li          | 通过 |
| HTML 分隔线   | 将顶层与容器中的 hr 转换为 Divider                | 通过 |
| HTML 标记     | 规范化 b/i/u/s/strike/del 及其嵌套组合            | 通过 |
| HTML 行内样式 | 保留安全字号、文字色、背景色及嵌套覆盖            | 通过 |
| HTML mark CSS | 映射粗体、斜体、装饰线及合法重置值                | 通过 |
| HTML 行内代码 | 将 code 元素映射为 Inline Code mark               | 通过 |
| HTML 链接     | 保留安全 href、target、rel 并过滤非法元数据       | 通过 |
| HTML 嵌套列表 | 保留三层有序、无序、任务子列表及深层选区          | 通过 |
| HTML 起始编号 | 保留顶层与嵌套 ol 的安全整数 start                | 通过 |
| HTML 表格     | 导入分区、表头 cell、多段落和非等宽行             | 通过 |
| HTML 图片     | 导入安全 src、alt、正整数宽高和独立图片段落       | 通过 |
| HTML 任务项   | 导入 checkbox 列表、checked、marks 和链接         | 通过 |
| HTML 安全     | 丢弃脚本、事件属性、危险资源和非法样式值          | 通过 |
| Markdown      | 转换标题、引用、代码块、行内代码、列表和标记      | 通过 |
| React         | paste 事件生成 Transaction，不直接写 DOM          | 通过 |
| History       | 每次粘贴作为一次历史记录                          | 通过 |
| 中文 Demo     | 提供纯文本、HTML、Markdown 验收区                 | 通过 |

## 自动化覆盖

- Office：`clipboard/office.test.ts`、`history/office-paste.test.ts` 与 React `office-paste.test.ts` 验证完整文档/片段的标记识别、误判边界、无匹配 parser 不读取、自定义 parser 降级、空纯文本拒绝、正反向选区、单条 History、代码换行、列表编号/checked、cell TSV、宿主接管及只读。Chromium 六条用例覆盖正文与代码续编、cell TSV/选区、History 和 rich-only 拒绝；构建产物公开入口同时验证。
- CodeBlock：Core/History 与 React 覆盖单块多行、CRLF、缩进、空行、UTF-16 offset、正反向跨 text/跨块替换、归一化光标、富格式降级和空纯文本拒绝；Chromium 六条用例检查精确 textContent、换行不退出、History 与继续输入。
- 纯文本片段契约：paragraph、CodeBlock、列表和 cell 的能力查询与 execute 一致拒绝非 paragraph blocks；自定义同 MIME parser 的无效候选被跳过，后续有效候选仍可接受。
- 候选过滤：`clipboard/filter.test.ts` 和 `clipboard/parse.test.ts` 覆盖可选过滤器、普通来源默认优先级、自定义同 MIME parser、缺失/空/拒绝结果及停止后续格式读取；提供 HTML 且有匹配 parser 时先做 Office 来源预检。
- 按目标降级：`command/clipboard-target.test.ts`、`history/clipboard-fallback.test.ts` 覆盖顶层富格式优先、列表/cell 使用实际纯文本、无纯文本时拒绝、跨 cell 拒绝及单条 History 恢复。
- React `clipboard-fallback.test.ts` 覆盖混合 MIME、只读、宿主接管、自定义 Registry、禁用/缺失/失败命令、无效选区、无可用格式和组合输入；失败后不重复执行其他格式。
- Chromium 七条降级与拒绝用例覆盖有序/任务列表、cell 跨段落、折叠 TSV、跨项/跨 cell 和富格式独占；检查默认事件取消、History、邻格、任务状态与继续输入。
- `pnpm test:packages` 直接调用构建后公开 API 验证默认优先级、目标过滤和 cell 粘贴结果，导出与声明检查同时通过。
- 同一列表项纯文本：Core 覆盖三种列表、最多三层嵌套、正反向跨 mark 选区、空行、start/checked、原子树、History 与拒绝边界；React 与 Chromium 覆盖原生事件及继续输入。
- Clipboard parser：`packages/core/tests/clipboard`。
- Paste command：`packages/core/tests/command/paste.test.ts`，HTML/Markdown 行内代码、分隔线、行内 mark CSS 及其他结构的 History 往返见对应的 `*-paste-history.test.ts`。
- 范围粘贴：`paste-block-range.test.ts`、`paste-cell-range.test.ts`、`paste-range-boundary.test.ts` 覆盖三种格式、正反向范围、空行、删除后 text 索引映射、CodeBlock 纯文本约束及结构边界。
- 范围 History：`packages/core/tests/history/range-paste.test.ts` 覆盖一次撤销/重做、marks/link 与反向选区恢复，以及撤销后新粘贴清空 redo。
- React：`packages/react/tests/*-paste.test.ts` 覆盖 HTML/Markdown 行内代码、分隔线、行内 mark CSS 及其他原生 Clipboard 事件。
- 浏览器：`tests/e2e/demo-shell.spec.ts` 覆盖原生纯文本、HTML/Markdown 行内代码与分隔线、行内 mark CSS、结构化 HTML paste 事件，以及 HTML、Markdown 验收控制。
- React `range-paste.test.ts` 和 Chromium 的五条范围粘贴用例验证原生 Clipboard 事件、块与格式保留、cell 内多行/TSV 替换、邻格不变、History 和继续输入；原有折叠 TSV 填表用例同时通过。
- 全量入口：`pnpm check:all`。

## 安全结论

Clipboard 原始内容不会直接注入编辑器 DOM。HTML 先由标准 parser 建树，再映射到白名单模型；链接继续使用已有协议清洗，最终文档还会经过 Transaction 规范化。

React 可编辑编辑器接管后即取消 paste 默认写入；无法处理、命令失败或组合输入期间不修改模型、不新增 History。只读与宿主 `onPaste` 接管保持独立。自动化验证 Clipboard 事件管线与取消标记，不等同于所有操作系统剪贴板来源的兼容性验收。

## 结论

第 20 周粘贴能力已完成代码、测试、中文 Demo、文档和浏览器验收闭环，并在对应模型完成后补齐了 HTML/Markdown 行内代码与分隔线、HTML 文字标记别名、行内 mark CSS、安全文字属性、链接元数据、有序列表起始编号、嵌套列表、顶层表格、安全图片与任务列表导入。

范围粘贴已扩展到连续顶层文本块、同 cell 连续 paragraph 及同一列表项内的纯文本。结构化 HTML/Markdown fragment 仍不插入现有 cell 或 item；跨列表项、跨 cell 及进出列表/表格的范围粘贴仍未支持。

已补齐计划中的 Office 纯文本降级策略。当前使用构造的 Office HTML 和浏览器 Clipboard 事件验证，不代表真实桌面 Office、各操作系统与全部 Office 版本均已验收；无已知标记的 HTML 仍按普通来源处理。
