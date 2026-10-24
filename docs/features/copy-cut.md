# 复制与剪切

复制从模型选区读取文字，剪切只在写入剪贴板成功后提交删除命令的事务。默认只写纯文本，宿主可显式启用保留文字格式的 HTML；不导出 Markdown，不读取浏览器修改后的 DOM 内容。

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
- 图片和 Divider 不输出内容或替代文字，但保留所在顶层块间的分隔换行。BlockSelection 复制不在本次范围内。
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
  selection: RangeSelection,
): string | undefined;
```

该 API 不依赖 DOM，输出完整选区对应的安全 HTML 片段：

- 支持单个文本容器、连续顶层 paragraph/heading/quote/codeBlock、同一 cell 内的连续 paragraph。
- 单个列表项的选中文字按 paragraph 输出，不复制列表外壳、编号、任务状态、子列表或邻项；单元格内文字也只输出 paragraph，不生成 table。
- 保留被选文字的五种 boolean mark、安全字号/颜色/背景色及规范化的链接 href/target/rel。链接与行内代码组合使用嵌套 `code` 标签，不把链接默认视觉下划线写成额外 underline mark。
- 首尾文字按模型 UTF-16 offset 裁剪，中间空段落保留；代码块保留字面文字和换行，不输出文字 marks。
- 复用模型 marks 规范化、语义渲染和 HTML 转义；仅输出链接白名单属性及安全样式，不包含编辑器 path、class、事件或其他内部 DOM 属性。
- 非法、折叠、实际为空的选区，或跨列表项、跨 cell、进出表格、穿越 void/list 等不支持的范围，均返回 `undefined`；不生成截断的部分 HTML。

React `clipboardFormat="html"` 会在有纯文本内容时写入 `text/plain`，并在该 API 可导出完整片段时追加 `text/html`；不支持 HTML 的范围只写完整纯文本。HTML 粘贴是否可用仍由目标 Command Registry 决定：正文可保留格式，当前列表和 cell 继续按已有规则回退实际纯文本。

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

复制不受 Command Registry 限制，不触发 `onChange`、`onSelectionChange` 或 `onTransaction`。剪切先用当前 Registry 执行 `deleteSelection`，要求返回成功、非空 transaction 和结果 selection；缺失、禁用、执行失败或空结果均不写入剪贴板，也不修改模型。自定义命令应遵守既有纯函数与合法 transaction 契约。

剪切成功后输出 `inputType: "deleteByCut"`，不带 batch；宿主按已有 `onTransaction` 流程记录为独立 History。受控模式由宿主回传新文档和选区；非受控模式更新内部文档。前后快照保留原始选区方向，撤销后恢复选中文字，重做后回到删除起点；之后输入是另一条记录。

## 范围边界

复制可跨文本块、列表项和表格 cell，输出纯文本视图。剪切范围更窄，与 `deleteSelection` 保持一致：同一文本容器、连续顶层文本块、同一 cell 内的连续 paragraph。跨列表项、跨 cell、进出表格或跨越图片／Divider 的范围不执行剪切，也不退回浏览器默认删除。

未实现完整列表/表格结构写出、Markdown 写出、图片块剪切、文件剪贴板或桌面 Office 专有格式复制。HTML 是块片段，粘贴到段落中遵循现有 block 插入规则，不保证任意部分选区的 HTML 剪切粘贴还原原始段落结构。同步 `setData` 成功代表事件写入完成，不承诺操作系统最终剪贴板提交结果；宿主仍需处理外部环境策略。

验收见[复制与剪切 QA](../qa/copy-cut.md)，粘贴能力见[粘贴](./paste.md)。
