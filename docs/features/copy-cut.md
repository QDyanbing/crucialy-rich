# 纯文本复制与剪切

复制从模型选区读取文字，剪切只在写入剪贴板成功后提交删除命令的事务。两者都不依赖浏览器修改后的 DOM 内容，不导出 HTML 或 Markdown。

## Core API

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

## React 行为

`RichTextEditor` 自动监听原生 `copy` 和 `cut`，无需额外按钮或 History 配置。系统复制、剪切快捷键和菜单操作进入相同事件链路。

| 场景                             | 复制                          | 剪切                                   |
| -------------------------------- | ----------------------------- | -------------------------------------- |
| 合法非折叠文字范围               | 写入 `text/plain`，不产生事务 | 支持删除时写入纯文本并执行删除         |
| 只读模式                         | 支持模型纯文本复制            | 交还浏览器，不执行模型编辑             |
| 输入法组合期                     | 交还浏览器，不读取模型文字    | 取消默认行为，不导出、不删除           |
| 折叠、空范围或当前根节点外的选区 | 不接管默认复制                | 可编辑状态取消默认剪切，不写入、不删除 |
| 剪贴板写入抛错或不可用           | 取消默认行为，不修改模型      | 取消默认行为，不提交删除               |

事件先调用宿主 `onCopy` / `onCut`。宿主调用 `preventDefault()` 后组件不再读取选区、写入剪贴板或执行命令；宿主可由此实现富格式复制。组件实际写入前会清空该事件的 ClipboardData，只保留纯文本；这不会发起异步 Clipboard API 请求或申请系统权限。

复制不受 Command Registry 限制，不触发 `onChange`、`onSelectionChange` 或 `onTransaction`。剪切先用当前 Registry 执行 `deleteSelection`，要求返回成功、非空 transaction 和结果 selection；缺失、禁用、执行失败或空结果均不写入剪贴板，也不修改模型。自定义命令应遵守既有纯函数与合法 transaction 契约。

剪切成功后输出 `inputType: "deleteByCut"`，不带 batch；宿主按已有 `onTransaction` 流程记录为独立 History。受控模式由宿主回传新文档和选区；非受控模式更新内部文档。前后快照保留原始选区方向，撤销后恢复选中文字，重做后回到删除起点；之后输入是另一条记录。

## 范围边界

复制可跨文本块、列表项和表格 cell，输出纯文本视图。剪切范围更窄，与 `deleteSelection` 保持一致：同一文本容器、连续顶层文本块、同一 cell 内的连续 paragraph。跨列表项、跨 cell、进出表格或跨越图片／Divider 的范围不执行剪切，也不退回浏览器默认删除。

未实现富格式剪贴板写出、图片块剪切、文件剪贴板或桌面 Office 格式复制。同步 `setData` 成功代表事件写入完成，不承诺操作系统最终剪贴板提交结果；宿主仍需处理外部环境策略。

验收见[复制与剪切 QA](../qa/copy-cut.md)，粘贴能力见[粘贴](./paste.md)。
