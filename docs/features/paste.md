# 粘贴

粘贴管线把浏览器 Clipboard 数据解析为受控模型 fragment，再通过 Command 和 Transaction 更新文档。React 集成不会直接写 DOM。

## 架构

`ClipboardDataSource` 只暴露 MIME types 与 `getData()`，`ClipboardParser` 把单一格式转换为 `ClipboardFragment`。`parseClipboardData` 按 parser 数组顺序调用，默认优先级为：

1. `text/markdown`
2. `text/html`
3. `text/plain`

第一个返回 fragment 的 parser 获胜；缺少数据或解析器拒绝时继续降级。

## 纯文本

`parsePlainText` 统一 CRLF、CR 和 LF，每一行生成一个 paragraph，连续换行保留为空 paragraph。`paste` 命令让首行衔接光标前文本、末行衔接光标后文本，并支持替换同一文本块内跨 mark 的选区。

在表格 cell 内，带制表符的一行文本或多行纯文本会解析为二维网格，并从当前 cell 开始向右、向下写入。网格完整落在现有表格范围内时，每个目标 cell 会被一个 paragraph 替换；超出剩余行列时整次操作降级为当前 cell 内的普通文本粘贴，不扩表、不截断数据。

## HTML

HTML 使用 `parse5` 读取标准语法树，不使用正则解析标签。当前支持：

- 块：`p`、`h1`–`h6`、`blockquote`、`pre`、`ul`、`ol`、`li`、`img`、`table`、`tr`、`td`、`th`。
- 行内：`strong` / `b`、`em` / `i`、`u`、`s` / `strike` / `del`、`a`、`code`、`br`。
- 属性：保留链接 `href`、`target`、`rel`，有序列表 `start`，图片 `src`、`alt`、`width`、`height`，以及行内 `style` 中受支持的文字属性；URL、编号和样式值继续经过各自白名单。

语义标签别名会统一映射到模型已有的 `bold`、`italic`、`underline` 和 `strike` 标记。别名可以嵌套组合，也可以与安全链接共存；危险链接会被移除，但其中的文字和合法标记仍会保留。

HTML 链接复用 Link Mark 的安全规则：`target` 只保留 `_self`、`_blank`，`rel` 只保留 `nofollow`、`noopener`、`noreferrer` 并按固定顺序去重。非法可选属性会被省略，不会连同安全 `href`、文字和其他 mark 一起丢弃。

HTML 行内样式只映射模型已有的 `fontSize`、`textColor` 和 `backgroundColor`。`font-size` 接受 `8px`–`72px` 的整数，`color` 与 `background-color` 只接受 `#RGB` / `#RRGGBB`，并规范化为小写六位色值。样式遵循元素嵌套继承与内层合法值覆盖规则，可以和 boolean mark、安全链接、列表项及表格单元格组合；非法值只丢弃对应属性，不影响文字或其他合法 mark。

HTML 列表会保留每个 `li` 的第一个直接 `ul` 或 `ol` 子列表，支持有序、无序和任务列表逐层组合，并按模型上限保留三层。每层 `ol[start]` 只接受安全整数，非法值回到默认编号；父子项的 mark、安全链接和任务 checked 状态独立映射。Paste Command 把选区移动到最深的最后项末尾。

HTML 任务列表要求顶层为 `ul`，且每个直属 `li` 的首个有效内容都是 `input[type="checkbox"]`。checkbox 可包在开头的 `label`、`p`、`div` 或 `span` 中；`checked` 映射为 taskItem 状态，任务文字继续保留行内 mark 和安全链接。混合列表、后置 checkbox、radio 和有序列表会降级为普通列表。

HTML 图片支持顶层 `img`，以及除空白外只包含一个 `img` 的 `p`。`src` 只接受绝对 HTTP、HTTPS 和 blob 地址；`alt` 保留为纯文本，宽高仅接受正整数字符串。危险地址、事件属性、CSS 尺寸和其他未知属性不会进入模型。

HTML 表格会按 `thead`、`tbody`、`tfoot` 的 DOM 顺序导入；`th` 降级为普通 `tableCell`，较短的行用空 cell 补齐到最宽行。cell 中的直接 `p` 会保留为多个 paragraph，行内 mark 和安全链接继续复用白名单。空表、空行和只含被过滤节点的表格会被拒绝，不会生成非法模型。

`script`、`style`、事件属性、未知属性和危险链接不会进入模型。未支持但含可读文本的普通容器会降级为受支持节点。

## Markdown

Markdown 使用 `marked` 转换为 HTML，再复用同一 HTML 白名单映射。当前覆盖标题、引用、代码块、有序/无序列表、bold 和 italic；原始 HTML 同样受白名单限制。

## React 接入

`RichTextEditor` 监听 `onPaste`，将 `DataTransfer` 包装为 `ClipboardDataSource`，解析后执行 `PASTE_COMMAND_NAME`。成功时阻止浏览器默认写入，并通过 `onChange`、`onSelectionChange` 和 `onTransaction` 返回模型结果；外部 `onPaste` 先执行，并可通过 `preventDefault()` 接管行为。

## 当前边界

- HTML/Markdown 结构化粘贴只在同一顶层文本块内的选区执行。
- 现有表格内的二维填充仍只接受 `text/plain` TSV，不自动新增行列，也不支持跨 cell range 替换。
- HTML 表格不保留 `colspan`、`rowspan` 和表头语义，不支持嵌套表格。
- HTML 暂不支持图文混排、单个列表项内的多个并列子列表和非直接子列表；内联 CSS 不会通过 `font-weight`、`font-style` 或 `text-decoration` 推断 boolean mark，也不接受命名色、`rgb()`、背景简写或非 px 字号。
- Markdown 暂不支持扩展语法的完整保真映射。
- data URL、剪贴板二进制图片上传和图片资源持久化不属于本阶段范围。

完整结果见[粘贴闭环 QA](../qa/paste.md)。
