# 文档模型（第一版）

文档模型是富文本内核的数据基础。第一版只支持三层结构，后续功能在此基础上扩展。

## 节点结构

当前支持 `document → text/void block → text` 和 `document → list → listItem → text` 两种层级。

```ts
interface TextNode {
  type: "text";
  text: string;
  marks?: TextMarks;
}

type TextMarks = Partial<Record<"bold" | "italic" | "underline" | "strike", true>> &
  Partial<{
    fontSize: number;
    textColor: string;
    backgroundColor: string;
  }> & {
    link?: {
      href: string;
      rel?: string;
      target?: "_self" | "_blank";
    };
  };

interface ParagraphNode {
  type: "paragraph";
  children: TextNode[];
}

interface HeadingNode {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: TextNode[];
}

interface QuoteNode {
  type: "quote";
  children: TextNode[];
}

interface CodeBlockNode {
  type: "codeBlock";
  children: TextNode[];
}

interface DividerNode {
  type: "divider";
  children: [];
}

type TextBlockNode = ParagraphNode | HeadingNode | QuoteNode | CodeBlockNode;
type VoidBlockNode = DividerNode;
type BlockNode = TextBlockNode | VoidBlockNode;

interface DocumentNode {
  type: "document";
  children: BlockNode[];
}
```

`HeadingNode.level` 只允许 1–6。paragraph、heading、quote 和 codeBlock 是文本块；Divider 是 `children: []` 的 void block。CodeBlock 只保留纯文本，不接受 marks。详细规则见 [Block Type 设计](./block-type.md)、[CodeBlock 代码块](./code-block.md)和[Divider 分隔线](./divider.md)。

`TextNode.marks` 当前支持 `bold`、`italic`、`underline` 和 `strike` 四个 boolean 标记，`fontSize`、`textColor` 和 `backgroundColor` 三个文字属性，以及结构化 `link`。Link Mark 包含安全 href 和可选 target / rel；它可以与所有文字样式共存。没有任何有效 mark 时省略 `marks` 字段。

## 类型判断

提供运行时类型判断，对未知输入安全：

- `isTextNode(value)`
- `isParagraphNode(value)`
- `isHeadingLevel(value)`
- `isHeadingNode(value)`
- `isQuoteNode(value)`
- `isCodeBlockNode(value)`
- `isDividerNode(value)`
- `isTextBlockNode(value)`
- `isVoidBlockNode(value)`
- `isBlockNode(value)`
- `isDocumentNode(value)`

判断只校验当前节点的形状，不递归校验 `children`，递归校验交给 `validateDocument`。

## 创建接口

- `createText(text = "", marks?)`：创建 text 节点，默认空字符串，可携带 text marks。
- `createParagraph(children = [createText()])`：创建段落，默认含一个空 text。
- `createHeading(level = 1, children = [createText()])`：创建标题。
- `createQuote(children = [createText()])`：创建引用。
- `createCodeBlock(children = [createText()])`：创建纯文本代码块。
- `createDivider()`：创建无文本子节点的分隔线。
- `createDocument(children = [createParagraph()])`：创建文档，默认含一个空段落。

工厂函数对传入的 `children` 原样保留，是否合法由 `validateDocument` / `normalizeDocument` 负责。

## 结构校验

`validateDocument(value)` 返回 `{ valid, errors }`。规则：

- 根节点必须是 `document`。
- `document` 的 `children` 只能是块级节点。
- 文本块的 `children` 只能是 `text` 节点；Divider 的 `children` 必须为空。
- heading level 必须是 1–6。
- CodeBlock text 不能携带 marks。
- text marks 只能包含受支持的 boolean mark 或合法属性值。

每条错误带 `path`（节点路径，root 为空数组）和 `message`，便于定位非法节点。

## 规范化

`normalizeDocument(value)` 把任意输入修复为合法文档。当前策略：

- 非 `document` 根节点替换为空文档。
- 空 `document` 自动补一个空段落。
- block 里的非法 `children` 被丢弃。
- text marks 会被规范化为受支持的 `true` 值。
- 空文本 block 自动补一个空 `text`；Divider 始终规范化为 `children: []`。

修复后的结果一定能通过 `validateDocument`。

## 当前限制

- 当前 Block Type 还支持 bulletList 和 orderedList；图片尚未实现。
- text marks 已完成四种 boolean mark、三种文字属性和 Link Mark 闭环；链接已经接入 operation、command、安全渲染、编辑态/只读态交互、选区恢复和 Demo。
- heading level 直接存储在 `level` 字段；CodeBlock 和 Divider 当前不包含额外属性。
- 规范化会丢弃非法节点而不尝试转换，转换策略留待后续。
