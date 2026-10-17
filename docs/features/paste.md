# 粘贴

粘贴管线把浏览器 Clipboard 数据解析为受控模型 fragment，再通过 Command 和 Transaction 更新文档。React 集成不会直接写 DOM。

## 架构

`ClipboardDataSource` 只暴露 MIME types 与 `getData()`，`ClipboardParser` 把单一格式转换为 `ClipboardFragment`。`parseClipboardData` 按 parser 数组顺序调用，默认优先级为：

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

过滤器只在 parser 实际返回 fragment 后调用；缺失 MIME、空数据或 parser 返回 undefined 时不调用。候选一旦被接受就停止读取后续格式，同 MIME 的自定义 parser 也可继续尝试。过滤器应使用无副作用的能力查询，而不是执行编辑命令；它不替代 HTML 安全白名单或文档校验。

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

`parsePlainText` 统一 CRLF、CR 和 LF，每一行生成一个 paragraph，连续换行保留为空 paragraph。`paste` 命令让首行衔接光标前文本、末行衔接光标后文本；顶层和 cell 内按目标文本块类型分段，列表内按列表项拆分，支持同一文本块、连续顶层文本块、同一 cell 连续 paragraph 及同一列表项内的选区替换。

在表格 cell 内的折叠光标处，带制表符的一行文本或多行纯文本会解析为二维网格，并从当前 cell 开始向右、向下写入。网格完整落在现有表格范围内时，每个目标 cell 会被一个 paragraph 替换；超出剩余行列时整次操作降级为当前 cell 内的普通文本粘贴，不扩表、不截断数据。

有文本选区时不执行二维填充：即使 TSV 网格能够完整落入表格，也只替换该 cell 内的选区，制表符保留为文字，换行保留为同 cell 段落边界，不覆盖邻格。

## 范围替换

- 纯文本、HTML 和 Markdown 支持同一顶层文本块或连续顶层 paragraph、heading、quote、codeBlock 的选区替换。
- 同一 cell 内支持纯文本替换单段或连续多段 paragraph；HTML/Markdown block fragment 不直接插入 cell。
- 同一普通、有序或任务列表项内支持纯文本插入与选区替换，包括最多三层嵌套路径和跨 mark 的正反向选区；换行使用 `split_list_item`，连续空行保留为空项，不套用 Enter 的退出或反缩进规则。
- 多行列表粘贴保留原编号、前后文字与格式；原任务项保留 checked，新项默认为未完成，已有子列表随保留后缀移到最后一个拆分项。
- 正向和反向选区共用范围删除计划：单容器生成 `delete_text`，跨顶层块或同 cell 跨段落生成 `delete_range`，再从删除后映射的光标处粘贴。
- 结构化内容仍作为独立 block 插入起始块的前后边界之间，保留 fragment 的文字样式与块类型；纯文本继承目标位置的格式。
- 删除与粘贴组成一个 transaction、一条 History；撤销恢复原文档和原选区，重做恢复粘贴结果和光标，之后可继续输入。

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

HTML 图片支持顶层 `img`，以及除空白外只包含一个 `img` 的 `p`。`src` 只接受绝对 HTTP、HTTPS 和 blob 地址；`alt` 保留为纯文本，宽高仅接受正整数字符串。危险地址、事件属性、CSS 尺寸和其他未知属性不会进入模型。

HTML 表格会按 `thead`、`tbody`、`tfoot` 的 DOM 顺序导入；`th` 降级为普通 `tableCell`，较短的行用空 cell 补齐到最宽行。cell 中的直接 `p` 会保留为多个 paragraph，行内 mark 和安全链接继续复用白名单。空表、空行和只含被过滤节点的表格会被拒绝，不会生成非法模型。

`script`、`style`、事件属性、未知属性和危险链接不会进入模型。未支持但含可读文本的普通容器会降级为受支持节点。

## Markdown

Markdown 使用 `marked` 转换为 HTML，再复用同一 HTML 白名单映射。当前覆盖标题、引用、代码块、行内代码、水平分隔线、有序/无序列表、bold 和 italic；原始 HTML 同样受白名单限制。

## React 接入

`RichTextEditor` 监听 `onPaste`，将 `DataTransfer` 包装为 `ClipboardDataSource`，解析后执行 `PASTE_COMMAND_NAME`。成功时阻止浏览器默认写入，并通过 `onChange`、`onSelectionChange` 和 `onTransaction` 返回模型结果；外部 `onPaste` 先执行，并可通过 `preventDefault()` 接管行为。

## 当前边界

- 范围粘贴不跨越 Divider、Image、不同列表项、不同 cell 或进出列表/表格的结构边界。
- 列表项内只接受 `text/plain` fragment；不导入 HTML/Markdown block，也不把优先解析出的富 fragment 自动转为纯文本。
- 现有表格内的二维填充只在折叠光标下接受 `text/plain` TSV，不自动新增行列，也不支持跨 cell range 替换。
- HTML 表格不保留 `colspan`、`rowspan` 和表头语义，不支持嵌套表格。
- HTML 暂不支持图文混排、单个列表项内的多个并列子列表和非直接子列表；内联 CSS 不接受命名色、`rgb()`、背景简写、非 px 字号，以及 boolean mark 白名单之外的值。
- Markdown 暂不支持扩展语法的完整保真映射。
- data URL、剪贴板二进制图片上传和图片资源持久化不属于本阶段范围。

完整结果见[粘贴闭环 QA](../qa/paste.md)。
