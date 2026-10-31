# 复制与剪切

复制从模型选区读取内容，剪切只在写入剪贴板成功后提交删除命令的事务。默认只写纯文本，宿主可显式启用保留文字格式与单张安全图片的 HTML；不导出 Markdown，不读取浏览器修改后的 DOM 内容。

## Core 纯文本 API

```ts
function getClipboardText(
  document: DocumentNode,
  selection: RangeSelection,
): string | undefined;
```

该函数不依赖 DOM，不修改文档或选区。正向、反向选区读取相同文字；折叠选区、非法端点或实际为空的文字范围返回 `undefined`，纯空白内容仍可复制。

- 同一段中的 text 节点直接拼接，不输出 marks、链接 URL 或 HTML 标签。
- 文本块、列表项、嵌套列表之间以换行分隔；不生成项目符号、编号或任务 checkbox。
- 表格 cell 之间使用制表符，行和 cell 内 paragraph 之间使用换行；多段 cell 文本不做 TSV 引号转义，不保证按原表格往返导入。
- CodeBlock 的字面标签、缩进和换行原样保留。
- 图片和 Divider 不输出内容或替代文字，但保留所在顶层块间的分隔换行。纯文本 API 仍只接受 RangeSelection，不接受 BlockSelection。
- 偏移与模型一致，使用 UTF-16 单元，不额外处理字素边界。

```ts
import { getClipboardText } from "@crucialy-rich/core";

const text = getClipboardText(document, selection);
if (text !== undefined) {
  // 在宿主自己的 copy 事件中写入同步 ClipboardData。
  event.preventDefault();
  event.clipboardData.setData("text/plain", text);
}
```

## 可选 HTML 导出

```ts
function getClipboardHtml(
  document: DocumentNode,
  selection: RangeSelection | BlockSelection,
): string | undefined;
```

该 API 不依赖 DOM，输出完整选区对应的安全 HTML 片段：

- 支持单个文本容器、连续顶层 paragraph/heading/quote/codeBlock、同一 cell 内的连续 paragraph。
- 两端都在顶层文本块时，可保留中间完整选中的列表、表格、Divider 和安全图片引用，见[顶层混合片段](#顶层混合片段)。
- 也接受指向顶层安全图片的 BlockSelection，仅输出该图片，不扩大到其他块类型，见[图片块选区](#图片块选区)。
- 单个列表项的选中文字按 paragraph 输出，不复制列表外壳、编号、任务状态、子列表或邻项；单元格内文字也只输出 paragraph，不生成 table。
- 同一列表内、同一层级的跨项范围保留 bulletList、orderedList 或 taskList 结构；同一表格的同一行跨 cell 片段或完整连续行保留 table 结构，具体裁剪规则见下文。
- 保留被选文字的五种 boolean mark、安全字号/颜色/背景色及规范化的链接 href/target/rel。链接与行内代码组合使用嵌套 `code` 标签，不把链接默认视觉下划线写成额外 underline mark。
- 首尾文字按模型 UTF-16 offset 裁剪，中间空段落保留；代码块保留字面文字和换行，不输出文字 marks。
- 复用模型 marks 规范化、语义渲染和 HTML 转义；仅输出链接白名单属性、有序列表 `start`、checkbox `type`/`checked`、图片 `src`/`alt`/`width`/`height` 及安全样式，不包含编辑器 path、class、事件或其他内部 DOM 属性。
- 非法、折叠、实际为空的选区，或跨不同列表内部/层级、部分跨行、从表格或列表内部进出正文、含不支持图片等范围，均返回 `undefined`；不生成截断的部分 HTML。

React `clipboardFormat="html"` 会在有纯文本内容时写入 `text/plain`，并在该 API 可导出完整片段时追加 `text/html`；不支持 HTML 的范围只写完整纯文本。HTML 粘贴是否可用仍由目标 Command Registry 决定：正文可保留格式，当前列表和 cell 继续按已有规则回退实际纯文本。

## 同层列表片段

两个端点必须位于同一个列表节点的不同直属项文字中。列表可以在顶层，也可以是已有嵌套列表；正向和反向选择输出相同片段。嵌套列表单独复制时以自身为根，不带祖先项文字或祖先任务状态。

- 首尾项按文字 offset 裁剪，中间项完整保留。选中项间换行而没有首尾文字时，仍保留对应的空边界项。
- 起点项和中间项的子列表处于线性选区内，保留其类型、编号、文字样式和任务状态；终点位于最后项文字中，因此不带最后项之后的子列表。
- 有序列表的 `start` 为原模型的起始编号（缺省为 1）加第一个选中项的索引；仅接受安全整数，起始编号或加法溢出时整个 HTML 片段回退，不悄悄重编号。
- 任务列表保留所选项的 checked 状态，使用每个 `li` 起始位置的 checkbox 表达，不复制组件的只读属性、可访问标签或内部 data 属性。
- 跨父子层级、跨不同根列表或不同父项的子列表不拼接为部分列表，仍回退完整纯文本。所选直属项混用普通项/任务项时，也不导出被规范化后缺项的 HTML。

只改变复制能力：单项片段仍按 paragraph 输出；跨项剪切、跨项删除和列表内富片段粘贴依然不支持。Demo 的“列表复制”样例包含首尾文字、可复制子列表、未选后代、有序起始编号和不同任务状态。

## 表格片段

使用已有 `RangeSelection`，不是矩形单元格选区。两个端点必须在同一张合法模型表格中、且位于不同 cell；正向和反向选区输出相同内容。单 cell 片段继续按 paragraph 输出，不增加表格外壳。

- 同一行：只导出起止 cell 之间的连续列。首 cell 从起点 paragraph/text/UTF-16 offset 开始，末 cell 到终点为止；中间 cell、选中的空段落和多段内容完整保留。只选中制表分隔时，保留两个空边界 cell。
- 跨行：只支持完整连续行。起点必须是首选中行第一个 cell 的第一个 paragraph/text 的 offset 0；终点必须是末选中行最后一个 cell 的最后 paragraph/text 末尾。选中行以自身为表格根，不复制前后未选行；单列表格同样支持。
- 部分跨行范围不按矩形解释，也不补造未选 cell；返回 `undefined`，React 回退完整纯文本。不同表格、进出表格及源表格校验失败（含行列不齐或非法 marks）也回退，不借规范化静默修复源结构。
- 输出 `table > tbody > tr > td > p`，保留文字 marks 和安全链接，不写出内部路径、cell 高亮、类名、事件、列宽或其他编辑器属性。导出不修改源文档，不共享可变片段对象。

粘贴到正文时复用已有 HTML 表格 parser 和 `paste` 命令，产生一次 History；粘贴到现有 cell、列表或代码块仍只尝试实际提供的纯文本。纯文本中的段落换行与行分隔不做 TSV 引号转义，不承诺多段 cell 的二维往返。跨 cell 剪切、删除、任意矩形选择、合并单元格和表格内富片段粘贴均未扩大。Demo 提供中文“表格复制”样例。

## 顶层混合片段

规范化选区的两端都必须位于顶层 paragraph、heading、quote 或 codeBlock 的 text 中；中间块可包含完整文本块、普通/有序/任务列表、表格、Divider 和符合下一节规则的图片引用，按原顺序导出。正向和反向结果相同。

- 首尾文字按 UTF-16 offset 裁剪，保留块类型和选中的 marks；空边界和中间空段落不省略，代码块仍保留字面文字，不输出 marks。
- 中间列表保留完整嵌套内容、原始有序编号和任务 checked；中间表格保留完整行列与多段 cell，不把首尾文字裁剪应用到结构内部。Divider 输出无编辑器属性的 `hr`。
- 此路径要求所选源块通过模型校验；非法编号、marks、行列不齐等整段回退完整纯文本，不静默删除或修复结构。含不支持的图片也整段回退，不只输出剩余可支持块。
- 端点在列表或表格内部时，仍只使用已有同层列表/同一行或完整行规则；不支持把内部片段与外部正文拼接。混合范围路径不处理结构 BlockSelection，也不扩大跨结构剪切。

正文目标复用既有 parser、`paste` 命令和单条 History；列表、代码块及 cell 目标仍只能使用同时提供的实际纯文本。复制不修改源模型或 History，Demo 提供“混合结构复制”样例。

## 图片引用

完整图片可来自两端为顶层文本块的混合范围，也可来自独立图片 BlockSelection。混合范围允许多张连续图片或与列表/表格混排；未选图片不参与检查或导出。两种路径共用以下安全规则。

- 源模型必须合法且 `status === "ready"`，URL 必须是绝对 HTTP/HTTPS，且不能带 username/password。`loading`、`error`、临时 blob、相对路径、data URL 或带凭据的地址使整个 HTML 片段回退。
- `src` 规范化后输出，`alt` 作为纯文本转义；宽高分别保留正安全整数。合法模型中的小数或超安全整数尺寸只省略相应属性，不修改源模型；负数、零或非有限尺寸属于非法模型，整段回退。
- 仅保留 `src`、`alt`、`width`、`height`，不复制 status、内部路径、选中态、事件、CSS 或宿主附加字段。纯文本仍不输出图片 alt，只保留所在块的分隔换行。
- 这是 URL 引用，不是图片文件/字节复制；复制不读取文件、不下载、不上传、不验证远端可访问性，也不获取剪贴板权限。`ready` 是模型状态，不保证浏览器已加载该 URL；实际资源能否显示由目标环境决定。

正文粘贴复用现有图片 parser 和单条 History；列表/代码块/cell 仍只尝试实际纯文本。外部 HTML 图片导入仍遵循已有 blob 规则，不代表这些临时引用可再次写出。未新增跨图片剪切或文件 MIME。Demo 提供中文“图文复制”样例。

## 图片块选区

```ts
const html = getClipboardHtml(document, createBlockSelection([imageIndex]));
```

Core 只接受指向完整顶层图片的合法 BlockSelection，输出独立 `img`；其他块类型、非法路径及不支持的图片返回 `undefined`，不回退到其他文字。仍沿用同一 URL、状态、alt 和尺寸安全规则，不改变 RangeSelection 行为。

React 使用已有受控 `blockSelection`。可编辑模式点击图片会聚焦根节点并通知 `onBlockSelectionChange`，宿主须回传选区。复制时根节点必须聚焦；若 DOM Selection 存在，其两个端点必须都属于当前根。没有 DOM Range 也可复制，根内遗留的文字选区不会覆盖显式图片块选区。

- HTML 模式写入 `text/html` 和空字符串 `text/plain`，不把 alt 或 URL 作为纯文本，不触发模型/选区回调、Transaction 或 History。
- 默认 plain 模式、非法块选区或不支持的图片会取消默认复制，但不写入任何格式，也不使用遗留文字选区。根未聚焦或 DOM 选区在根外时不接管复制。
- 宿主 `onCopy`/`onCut` 仍优先，组合输入期间不导出图片。HTML 写入失败不修改模型或块选区，空纯文本可能已写入事件数据。
- 可编辑 HTML 模式支持单图剪切，见下一节；其他块选区不回退遗留文字删除。只读 cut 仍交还浏览器。只读点击不产生块选区；宿主可回传块选区，通过 ref 根元素设置 `tabIndex` 并聚焦后使用复制。

正文粘贴独立图片生成一次 History，并把光标放在图片后的文本块。列表/代码块/cell 拒绝该 HTML 时，空纯文本不会参与降级，不猜造替代文字，不删除目标选区。Demo 复用“图文复制”样例，格式选择后须点击图片使根重新聚焦。

## 单图剪切

可编辑且 `clipboardFormat="html"` 时，受控图片 BlockSelection 可剪切单张安全图片；焦点与 DOM 选区归属规则和图片复制一致。先生成安全 HTML，再通过当前 Registry 执行 `deleteImage`，仅当结果成功、带 selection 和非空 transaction 且 ClipboardData 全部写入成功后提交删除。只注册 `deleteSelection` 不足以剪切图片；不新增命令或图片文件 MIME。

- 写入空 `text/plain` 与图片 `text/html`；不读取、剪切或回退遗留文字。默认 plain、非法选区、blob/loading/error/凭据图片均取消默认剪切但不写出、不删除。
- 宿主取消事件、输入法组合期、根未聚焦、DOM 端点越界、命令缺失/禁用/执行失败/缺结果及剪贴板不可用均不修改模型或选区。清空或任一格式写入抛错也不删除，后续 HTML 失败可能留下空纯文本，不承诺回滚系统剪贴板。
- 成功后输出一次无 batch 的 `deleteByCut` 事务与文字光标，并通知 `onBlockSelectionChange(undefined)`。受控宿主须回传新 value、文字选区和清除后的块选区；组件不私自修改受控值。
- 光标复用 `deleteImage`：优先后方文字，其次前方；没有可编辑文字时补空 paragraph，仍为同一条 History。单独粘贴是另一条记录，剪切和粘贴可分别撤销/重做。
- 事务 `beforeSelection` 只保存合法旧文字选区，没有时省略，接入方须判空；另外提供 `beforeBlockSelection`。宿主传给快照第三参数并回传撤销结果的块选区后，可恢复图片及高亮；Demo 已接入。重做后的快照不带块选区，宿主须清除旧高亮。此规则也适用于 Backspace/Delete 图片删除，详见[块选区恢复](./history.md#块选区恢复)。

只读剪切仍交给宿主/浏览器。跨越图片的文字范围、多个图片块和其他类型 BlockSelection 不支持剪切；此能力不扩展列表/cell/代码块的富片段粘贴。Demo 继续复用“图文复制”样例：选择 HTML、点击图片，再使用剪切事件。

## React 行为

`RichTextEditor` 自动监听原生 `copy` 和 `cut`，无需额外按钮或 History 配置。系统复制、剪切快捷键和菜单操作进入相同事件链路。可选 prop `clipboardFormat` 默认为 `"plain"`，也可设为 `"html"`；不改变剪切范围、只读、IME 或宿主接管契约。Demo 主编辑器提供中文“复制格式”选择，默认纯文本，切换不修改文档或 History。

| 场景                             | 复制                          | 剪切                                   |
| -------------------------------- | ----------------------------- | -------------------------------------- |
| 合法非折叠文字范围               | 写入 `text/plain`，不产生事务 | 支持删除时写入纯文本并执行删除         |
| 只读模式                         | 支持模型纯文本复制            | 交还浏览器，不执行模型编辑             |
| 输入法组合期                     | 交还浏览器，不读取模型文字    | 取消默认行为，不导出、不删除           |
| 折叠、空范围或当前根节点外的选区 | 不接管默认复制                | 可编辑状态取消默认剪切，不写入、不删除 |
| 剪贴板写入抛错或不可用           | 取消默认行为，不修改模型      | 取消默认行为，不提交删除               |

事件先调用宿主 `onCopy` / `onCut`。宿主调用 `preventDefault()` 后组件不再读取选区、写入剪贴板或执行命令；宿主可由此实现自定义格式。组件实际写入前会清空该事件的 ClipboardData，按模式写入纯文本和可选 HTML；这不会发起异步 Clipboard API 请求或申请系统权限。

启用 HTML 时，只有全部所需格式写入成功才提交剪切删除；HTML 写入失败时纯文本可能已经写入事件数据，组件不承诺回滚剪贴板，但文档和 History 保持不变。

复制不受 Command Registry 限制，不触发 `onChange`、`onSelectionChange` 或 `onTransaction`。文字剪切先用当前 Registry 执行 `deleteSelection`，图片块剪切使用 `deleteImage`，均要求返回成功、非空 transaction 和结果 selection；缺失、禁用、执行失败或空结果均不写入剪贴板，也不修改模型。自定义命令应遵守既有纯函数与合法 transaction 契约。

剪切成功后输出 `inputType: "deleteByCut"`，不带 batch；宿主按已有 `onTransaction` 流程记录为独立 History。受控模式由宿主回传新文档和选区；非受控模式更新内部文档。前后快照保留原始选区方向，撤销后恢复选中文字，重做后回到删除起点；之后输入是另一条记录。

## 范围边界

复制可跨文本块、列表项和表格 cell，输出纯文本视图。文字剪切范围更窄，与 `deleteSelection` 保持一致：同一文本容器、连续顶层文本块、同一 cell 内的连续 paragraph。跨列表项、跨 cell、进出表格或跨越图片／Divider 的文字范围不执行剪切，也不退回浏览器默认删除；单图块剪切仅按上一节的独立规则处理。

未实现任意跨层级列表选区、部分跨行表格结构写出、Markdown 写出、多图片块剪切、文件剪贴板或桌面 Office 专有格式复制。HTML 是块片段，粘贴到段落中遵循现有 block 插入规则，不保证任意部分选区的 HTML 剪切粘贴还原原始段落结构。同步 `setData` 成功代表事件写入完成，不承诺操作系统最终剪贴板提交结果；宿主仍需处理外部环境策略。

验收见[复制与剪切 QA](../qa/copy-cut.md)，粘贴能力见[粘贴](./paste.md)。
