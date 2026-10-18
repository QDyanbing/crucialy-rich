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

## 粘贴行为

- CodeBlock 目标只接受纯文本 fragment。React 原生剪贴板同时含 HTML/Markdown 与 `text/plain` 时回退到实际纯文本；没有非空纯文本候选时阻止默认写入，不修改模型或 History。
- CRLF/CR 统一为 LF，缩进、制表符、连续空行、末尾换行及标签/反引号字面值原样保留在同一个 CodeBlock 中，不生成 paragraph 或多个代码块。
- 粘贴不复用 Enter 的双换行退出规则；只有换行的内容仍是代码文本，空字符串则没有可用 fragment。
- 支持同 CodeBlock 内跨 text 的正反向选区替换；连续顶层范围以规范化选区的起始文本块确定粘贴策略，起点为 CodeBlock 时结果保留为纯代码，跨结构节点仍拒绝。
- 范围删除和一次文本插入组成一条 Transaction。结束 normalize 合并 code text 后，光标按原起点的文本偏移加插入长度映射到合并节点，使用 UTF-16 offset。
- 一次撤销恢复原结构和选区，重做恢复代码与光标，随后可继续输入；构建产物也执行对应公开 API 冒烟检查。

## 渲染

CodeBlock 使用 `pre > code` 语义结构：

- `pre` 保存 block path。
- `code` 保存 text path，DOM 与模型选区映射继续使用同一协议。
- 文本和 HTML 特殊字符由 serializer 安全转义，换行原样保留。

## Demo 与验收

Demo 提供“代码块”和“代码块与分隔线”中文样例，可验证多行输入、退出、active 状态、marks 禁用、Divider 相邻行为和 History 记录。完整验收见 [代码块和分割线闭环](../qa/code-block-divider.md)。
