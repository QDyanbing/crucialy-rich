# 粘贴

粘贴管线把浏览器 Clipboard 数据解析为受控模型 fragment，再通过 Command 和 Transaction 更新文档。React 集成不会直接写 DOM。

## 架构

`ClipboardDataSource` 只暴露 MIME types 与 `getData()`，`ClipboardParser` 把单一格式转换为 `ClipboardFragment`。`parseClipboardData` 先检查来源是否带 Office HTML 标记，普通来源按 parser 数组顺序调用，默认优先级为：

1. `text/markdown`
2. `text/html`
3. `text/plain`

第一个返回且被可选过滤器接受的 fragment 获胜；缺少数据、解析器拒绝或过滤器返回 false 时继续尝试后续 parser。不传过滤器时保持原有顺序和行为。

## 解析过滤 API

```ts
function parseClipboardData(
  source: ClipboardDataSource,
  parsers: readonly ClipboardParser[],
  acceptFragment?: (fragment: ClipboardFragment) => boolean,
): ClipboardFragment | undefined;
```

过滤器只在 parser 实际返回 fragment 后调用；缺失 MIME、空数据或 parser 返回 undefined 时不调用。存在匹配 parser 且来源提供 `text/html` 时，会先读取一次 HTML 做 Office 识别，之后复用该值；这一步发生在 Markdown parser 之前。候选一旦被接受就停止读取剩余格式，同 MIME 的自定义 parser 也可继续尝试。没有匹配 parser 时不读取任何数据。过滤器应使用无副作用的能力查询，而不是执行编辑命令；它不替代 HTML 安全白名单或文档校验。

例如，宿主可用当前 Registry 的 Paste Command 判断目标能力：

```ts
const fragment = parseClipboardData(source, DEFAULT_CLIPBOARD_PARSERS, (candidate) =>
  canExecuteCommand(registry, PASTE_COMMAND_NAME, {
    context: { document, selection },
    payload: { fragment: candidate },
  }),
);
```

只有剪贴板提供的格式才会参与降级，不会从已拒绝的 HTML/Markdown 片段临时生成纯文本。所有候选均被拒绝时返回 undefined，不生成 Transaction 或 History。

## 纯文本

`parsePlainText` 统一 CRLF、CR 和 LF，每一行生成一个 paragraph，连续换行保留为空 paragraph。`paste` 命令让首行衔接光标前文本、末行衔接光标后文本；CodeBlock 内合为一段带 LF 的纯文本，其他顶层块和 cell 按目标文本块类型分段，列表内按列表项拆分，支持各自范围内的选区替换。

在表格 cell 内的折叠光标处，带制表符的一行文本或多行纯文本会解析为二维网格，并从当前 cell 开始向右、向下写入。网格完整落在现有表格范围内时，每个目标 cell 会被一个 paragraph 替换；超出剩余行列时整次操作降级为当前 cell 内的普通文本粘贴，不扩表、不截断数据。

有文本选区时不执行二维填充：即使 TSV 网格能够完整落入表格，也只替换该 cell 内的选区，制表符保留为文字，换行保留为同 cell 段落边界，不覆盖邻格。

## Office 降级

与六个月计划的范围一致，Office 来源只做纯文本降级，不承诺 Word 排版或 Excel 表格的富格式保真。

通过 `parse5` 标准语法树识别以下标记，任一命中即跳过该来源的 HTML/Markdown parser（包括自定义 parser），只尝试 `text/plain` parser：

- class 中以 `Mso` 加字母开头的独立类名，例如 `MsoNormal`、`MsoListParagraph`，不区分大小写。
- 行内 style 或样式表中的 `mso-*:` 声明。
- `xmlns` / `xmlns:*` 的 Office、Word、Excel、PowerPoint `urn:schemas-microsoft-com:office:*` 命名空间。
- generator meta 的 Microsoft Word、Excel、PowerPoint 标记，可含 Office 前缀及版本号。

完整文档的 `html`、`head` 元数据与正文片段都参与识别；注释、脚本文字、普通正文、title/data 属性中的相同字样不作为来源标记。Office 命名空间的背景可参考 [Microsoft Word 文档](https://learn.microsoft.com/en-us/archive/msdn-magazine/2003/november/the-xml-files-xml-in-microsoft-office-word-2003)。这是有限标记识别，不是通用 Office 文件检测器；不含这些标记的来源仍按普通 HTML 策略处理。

降级只使用剪贴板实际提供的非空 `text/plain`，不从 HTML 猜测文字、编号或表格结构。没有纯文本、纯文本为空，或目标拒绝纯文本时，不删除选区、不新增 History；可编辑 React 接管事件后仍阻止默认 DOM 写入。直接调用 `parseHtml` 或向 `parseMarkdown` 传入包含这些标记的原始 HTML 时，返回 undefined，不自行生成纯文本。

纯文本继续复用目标规则：正文按换行分段，CodeBlock 保留 LF、缩进和字面标签，列表拆项并保留编号/checked，cell 的折叠光标允许范围内的 TSV 二维填充，有选区则只替换该 cell 内文字。成功粘贴为一次 Transaction/History，可撤销、重做和继续输入。来源降级不扩展原有跨项、跨 cell 等选区能力边界。

## 范围替换

- 纯文本支持同一顶层文本块或连续顶层 paragraph、heading、quote、codeBlock 的选区替换；HTML/Markdown 要求规范化选区的起点不在 CodeBlock 内。
- CodeBlock 多行粘贴用一条 `insert_text` 保存 LF，不拆块、不执行 Enter 退出规则，保留缩进、空行、制表符和字面标签。选区删除后仍按代码起点处理，归一化光标映射到合并后的 text 节点。
- 同一 cell 内支持纯文本替换单段或连续多段 paragraph；HTML/Markdown block fragment 不直接插入 cell。
- 同一普通、有序或任务列表项内支持纯文本插入与选区替换，包括最多三层嵌套路径和跨 mark 的正反向选区；换行使用 `split_list_item`，连续空行保留为空项，不套用 Enter 的退出或反缩进规则。
- 多行列表粘贴保留原编号、前后文字与格式；原任务项保留 checked，新项默认为未完成，已有子列表随保留后缀移到最后一个拆分项。
- 正向和反向选区共用范围删除计划：单容器生成 `delete_text`，跨顶层块或同 cell 跨段落生成 `delete_range`，再从删除后映射的光标处粘贴。
- 结构化内容仍作为独立 block 插入起始块的前后边界之间，保留 fragment 的文字样式与块类型；纯文本继承目标位置的格式。
- 删除与粘贴组成一个 transaction、一条 History；撤销恢复原文档和原选区，重做恢复粘贴结果和光标，之后可继续输入。

所有目标的 `text/plain` fragment 都只接受 paragraph blocks；伪装为纯文本的 heading、table 等片段会在 `canExecutePasteCommand` 和 execute 中一致拒绝，过滤器可继续尝试有效候选。

## HTML

HTML 使用 `parse5` 读取标准语法树，不使用正则解析标签。当前支持：

- 块：`p`、`h1`–`h6`、`blockquote`、`pre`、`hr`、`ul`、`ol`、`li`、`img`、`table`、`tr`、`td`、`th`。
- 行内：`strong` / `b`、`em` / `i`、`u`、`s` / `strike` / `del`、`a`、`code`、`br`。
- 属性：保留链接 `href`、`target`、`rel`，有序列表 `start`，图片 `src`、`alt`、`width`、`height`，以及行内 `style` 中受支持的文字属性；URL、编号和样式值继续经过各自白名单。

语义标签别名会统一映射到模型已有的 `bold`、`italic`、`underline` 和 `strike` 标记。别名可以嵌套组合，也可以与安全链接共存；危险链接会被移除，但其中的文字和合法标记仍会保留。

HTML 链接复用 Link Mark 的安全规则：`target` 只保留 `_self`、`_blank`，`rel` 只保留 `nofollow`、`noopener`、`noreferrer` 并按固定顺序去重。非法可选属性会被省略，不会连同安全 `href`、文字和其他 mark 一起丢弃。

HTML 行内样式只映射模型已有的文字属性和 boolean mark。`font-size` 接受 `8px`–`72px` 的整数，`color` 与 `background-color` 只接受 `#RGB` / `#RRGGBB`，并规范化为小写六位色值。

boolean mark 的 CSS 白名单如下：

- `font-weight`：`bold`、`bolder` 和 `600`–`1000` 映射为 bold；`normal`、`lighter` 和 `1`–`599` 显式清除 bold。
- `font-style`：`italic`、`oblique` 映射为 italic；`normal` 显式清除 italic。
- `text-decoration` / `text-decoration-line`：识别 `underline` 与 `line-through`，`none` 清除两种装饰线。

样式遵循元素嵌套继承与内层合法值覆盖规则，同一元素上的合法 CSS 声明可以覆盖 `strong`、`em`、`u`、`s` 等语义标签。boolean mark 可以和字号、颜色、安全链接、列表项及表格单元格组合；非法值只丢弃对应声明，不影响文字、继承 mark 或其他合法属性。

HTML `<hr>` 映射为无子节点的 Divider，来源属性全部丢弃。它可以和其他受支持块按原顺序导入；当 Divider 是粘贴内容的最后一块时，Paste Command 把选区放到其后的可编辑段落起点。

HTML 列表会保留每个 `li` 的第一个直接 `ul` 或 `ol` 子列表，支持有序、无序和任务列表逐层组合，并按模型上限保留三层。每层 `ol[start]` 只接受安全整数，非法值回到默认编号；父子项的 mark、安全链接和任务 checked 状态独立映射。Paste Command 把选区移动到最深的最后项末尾。

HTML 任务列表要求顶层为 `ul`，且每个直属 `li` 的首个有效内容都是 `input[type="checkbox"]`。checkbox 可包在开头的 `label`、`p`、`div` 或 `span` 中；`checked` 映射为 taskItem 状态，任务文字继续保留行内 mark 和安全链接。混合列表、后置 checkbox、radio 和有序列表会降级为普通列表。

HTML 图片支持顶层 `img`、独立图片段落及 `p` 内的图文混排。混排按原顺序转为文字 paragraph 和块级 Image；`span`、粗体、链接等行内包装中的图片同样可提升为块。图片前后文字分别保留各自的 marks、安全链接、空白和 `br` 换行；只有实际存在的文字片段才生成 paragraph，连续图片不会凭空补空段落。原有独立图片段落外围的排版空白仍被省略。

`src` 只接受绝对 HTTP、HTTPS 和 blob 地址；`alt` 保留为纯文本，宽高仅接受正整数字符串。危险地址、事件属性、CSS 尺寸和其他未知属性不会进入模型。无效混排图片直接省略，不分断或吞掉相邻文字；图片本身不继承文字 marks、包装链接或行内环绕样式。

一次混排粘贴仍复用顶层富片段插入规则，保留目标前后边界，不把首尾文本强行合并进目标段落。片段以文字结尾时光标停在该文字末尾，以图片结尾时停在图片后的可编辑段落起点；范围删除和全部插入作为一条 History，可撤销、重做并继续输入。CodeBlock、列表和 cell 的富格式限制不变，可降级到实际提供的纯文本；Office 来源策略也不变。

HTML 表格会按 `thead`、`tbody`、`tfoot` 的 DOM 顺序导入；`th` 降级为普通 `tableCell`，较短的行用空 cell 补齐到最宽行。cell 中的直接 `p` 会保留为多个 paragraph，行内 mark 和安全链接继续复用白名单。空表、空行和只含被过滤节点的表格会被拒绝，不会生成非法模型。

`script`、`style`、事件属性、未知属性和危险链接不会进入模型。未支持但含可读文本的普通容器会降级为受支持节点。

## Markdown

Markdown 使用 `marked` 转换为 HTML，再复用同一 HTML 白名单映射。当前覆盖标题、引用、代码块、行内代码、水平分隔线、有序/无序列表、bold 和 italic，以及段落中的独立、连续和混排图片（含引用式图片语法）；原始 HTML 同样受白名单限制。代码中的图片语法保持字面文字，图片 URL 和属性继续复用 HTML 白名单。

## React 接入

`RichTextEditor` 监听 `onPaste`，将 `DataTransfer` 包装为 `ClipboardDataSource`，用当前 Registry 的 `canExecuteCommand` 过滤候选，再执行一次 `PASTE_COMMAND_NAME`。普通顶层目标仍优先 Markdown/HTML；CodeBlock、列表与 cell 拒绝富片段后，可继续读取剪贴板实际提供的 `text/plain`，分别保留代码换行、列表拆项、cell 选区与 TSV 规则。

组件自身的 HTML 复制可输出同层跨项列表片段，保留所选无序/有序/任务列表、编号和嵌套内容；粘贴到正文时复用既有列表 parser，不创建新命令。复制来源支持列表结构，并不表示列表目标可插入富片段：列表和 cell 仍按原有能力使用同时提供的实际纯文本，跨项目标范围仍不写入。见[列表复制规则](./copy-cut.md#同层列表片段)。

可编辑编辑器接管事件后即阻止默认写入；没有有效选区、没有可用片段、命令未注册/禁用/失败或正在组合输入时，不把未处理内容交给浏览器修改 DOM，也不新增 History。成功时通过 `onChange`、`onSelectionChange` 和 `onTransaction` 返回模型结果；命令执行失败后不会再尝试执行其他格式。

外部 `onPaste` 始终先执行，可通过 `preventDefault()` 完全接管，组件随后不读取候选或执行命令；只读组件不主动阻止宿主的默认粘贴行为。自定义 Registry 的 `canExecute` 决定候选是否可用，而不是由 React 硬编码 cell 或列表的 MIME 选择。

自身复制的同一行跨 cell 片段或完整连续行也可作为 HTML 表格粘贴到正文，保留多段 cell 和安全文字格式，并形成一条 History。该来源能力不改变现有 cell 的富片段拒绝与 TSV 降级规则；多段 cell 的纯文本换行不保证二维往返，见[表格复制规则](./copy-cut.md#表格片段)。

## 当前边界

- 范围粘贴不跨越 Divider、Image、不同列表项、不同 cell 或进出列表/表格的结构边界。
- 列表项内只接受 `text/plain` fragment；不导入 HTML/Markdown block。React 原生粘贴可回退到剪贴板提供的纯文本，但不会自行把富片段转为纯文本；只有富格式时阻止粘贴并保持模型不变。
- 现有表格内的二维填充只在折叠光标下接受 `text/plain` TSV，不自动新增行列，也不支持跨 cell range 替换。
- HTML 表格不保留 `colspan`、`rowspan` 和表头语义，不支持嵌套表格。
- 图文混排提升只作用于普通 `p`，不扩展 heading、quote、CodeBlock、列表项或 cell 的内部模型；图片仍是顶层 void block，不支持行内图片、图片链接和文字环绕。
- HTML 暂不支持单个列表项内的多个并列子列表和非直接子列表；内联 CSS 不接受命名色、`rgb()`、背景简写、非 px 字号，以及 boolean mark 白名单之外的值。
- Markdown 暂不支持扩展语法的完整保真映射。
- Office 未做真实桌面 Word/Excel/PowerPoint 的跨操作系统剪贴板兼容性验收；目前自动化验证的是显式 Office 标记与混合 MIME 事件管线。
- data URL、剪贴板二进制图片上传和图片资源持久化不属于本阶段范围。

完整结果见[粘贴闭环 QA](../qa/paste.md)。
