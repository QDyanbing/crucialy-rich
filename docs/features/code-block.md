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
- 文本中的 `\n` 作为代码块内部换行保留。

## 当前边界

当前提交只建立模型契约；语义渲染、切换命令、输入行为和 Demo 在后续提交接入。
