# CodeBlock 代码块

CodeBlock 用于表达多行纯文本代码。模型类型为 `codeBlock`，属于可编辑文本 block。

## 模型结构

```ts
interface CodeBlockNode {
  type: "codeBlock";
  children: TextNode[];
}
```

`createCodeBlock(children?)` 创建代码块；未传 children 时包含一个空 text。

## Marks 规则

- CodeBlock 只保存纯文本，不支持 boolean mark、文字属性或 Link Mark。
- `createCodeBlock` 会移除传入 text 的 marks。
- `validateDocument` 会拒绝带 marks 的 CodeBlock text。
- `normalizeDocument` 会移除 CodeBlock 中的全部 marks，并合并相邻 text。
- boolean mark、文字属性和链接 Operation/Command 会拒绝 CodeBlock 选区。
- 文本中的 `\n` 作为代码块内部换行保留。

## History

History 快照会按 CodeBlock 类型深拷贝文本和选区，撤销、重做不会把代码块降级为 paragraph。

## Command

`setCodeBlockCommand` 注册名为 `setCodeBlock`：

- 默认或 `{ enabled: true }` 把连续选中的 block 转为 CodeBlock。
- `{ enabled: false }` 把连续选中的 CodeBlock 恢复为 paragraph。
- 转换时保留文字和选区方向，进入 CodeBlock 时移除 rich marks。
- `isCodeBlockCommandActive` 仅在选中 block 全部为 CodeBlock 时返回 `true`。

## 输入行为

- 普通文字输入复用 `insertTextCommand`，换行字符作为 CodeBlock text 的一部分保存。
- Enter 在代码块内插入 `\n`，光标移动到换行后。
- 光标位于代码块末尾且文本已经以 `\n` 结尾时，再次 Enter 会在后方创建 paragraph 并退出代码块。
- `splitBlockCommand` 与 React `RichTextEditor` 共用上述规则。

## 渲染

CodeBlock 使用 `pre > code` 语义结构：

- `pre` 保存 block path。
- `code` 保存 text path，DOM 与模型选区映射继续使用同一协议。
- 文本和 HTML 特殊字符由 serializer 安全转义，换行原样保留。

## 当前边界

Demo 在后续提交接入。
