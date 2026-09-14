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

## HTML

HTML 使用 `parse5` 读取标准语法树，不使用正则解析标签。当前支持：

- 块：`p`、`h1`–`h6`、`blockquote`、`pre`、`ul`、`ol`、`li`。
- 行内：`strong`、`em`、`a`、`code`、`br`。
- 属性：仅保留链接 `href`，并继续经过链接协议白名单。

`script`、`style`、事件属性、未知属性和危险链接不会进入模型。未支持但含可读文本的普通容器会降级为受支持节点。

## Markdown

Markdown 使用 `marked` 转换为 HTML，再复用同一 HTML 白名单映射。当前覆盖标题、引用、代码块、有序/无序列表、bold 和 italic；原始 HTML 同样受白名单限制。

## React 接入

`RichTextEditor` 监听 `onPaste`，将 `DataTransfer` 包装为 `ClipboardDataSource`，解析后执行 `PASTE_COMMAND_NAME`。成功时阻止浏览器默认写入，并通过 `onChange`、`onSelectionChange` 和 `onTransaction` 返回模型结果；外部 `onPaste` 先执行，并可通过 `preventDefault()` 接管行为。

## 当前边界

- 结构化粘贴只在同一顶层文本块内的选区执行。
- HTML 暂不支持表格、图片、任务列表、复杂嵌套列表和 CSS 样式。
- Markdown 暂不支持扩展语法的完整保真映射。
- 剪贴板图片上传不属于本阶段范围。

完整结果见[粘贴闭环 QA](../qa/paste.md)。
