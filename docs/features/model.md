# 文档模型（第一版）

文档模型是富文本内核的数据基础。第一版只支持三层结构，后续功能在此基础上扩展。

## 节点结构

当前支持的层级：`document` → `block` → `text`。Block 当前包含 paragraph、heading 和 quote。

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

type BlockNode = ParagraphNode | HeadingNode | QuoteNode;

interface DocumentNode {
  type: "document";
  children: BlockNode[];
}
```

`HeadingNode.level` 只允许 1–6。三种 block 都直接包含 text children，因此 Block Type 切换不会丢失文本或 marks。详细规则见 [Block Type 设计](./block-type.md)，标题 command 和语义渲染见 [Heading 标题](./heading.md)。

`TextNode.marks` 当前支持 `bold`、`italic`、`underline` 和 `strike` 四个 boolean 标记，`fontSize`、`textColor` 和 `backgroundColor` 三个文字属性，以及结构化 `link`。Link Mark 包含安全 href 和可选 target / rel；它可以与所有文字样式共存。没有任何有效 mark 时省略 `marks` 字段。

## 类型判断

提供运行时类型判断，对未知输入安全：

- `isTextNode(value)`
- `isParagraphNode(value)`
- `isHeadingLevel(value)`
- `isHeadingNode(value)`
- `isQuoteNode(value)`
- `isBlockNode(value)`
- `isDocumentNode(value)`

判断只校验当前节点的形状，不递归校验 `children`，递归校验交给 `validateDocument`。

## 创建接口

- `createText(text = "", marks?)`：创建 text 节点，默认空字符串，可携带 text marks。
- `createParagraph(children = [createText()])`：创建段落，默认含一个空 text。
- `createHeading(level = 1, children = [createText()])`：创建标题。
- `createQuote(children = [createText()])`：创建引用。
- `createDocument(children = [createParagraph()])`：创建文档，默认含一个空段落。

工厂函数对传入的 `children` 原样保留，是否合法由 `validateDocument` / `normalizeDocument` 负责。

## 结构校验

`validateDocument(value)` 返回 `{ valid, errors }`。规则：

- 根节点必须是 `document`。
- `document` 的 `children` 只能是块级节点。
- paragraph、heading 和 quote 的 `children` 只能是 `text` 节点。
- heading level 必须是 1–6。
- text marks 只能包含受支持的 boolean mark 或合法属性值。

每条错误带 `path`（节点路径，root 为空数组）和 `message`，便于定位非法节点。

## 规范化

`normalizeDocument(value)` 把任意输入修复为合法文档。当前策略：

- 非 `document` 根节点替换为空文档。
- 空 `document` 自动补一个空段落。
- block 里的非法 `children` 被丢弃。
- text marks 会被规范化为受支持的 `true` 值。
- 空 block 自动补一个空 `text`。

修复后的结果一定能通过 `validateDocument`。

## 当前限制

- 当前 Block Type 只支持 paragraph、heading 和 quote，尚不支持 list、codeBlock 等。
- text marks 已完成四种 boolean mark 和三种文字属性闭环；Link Mark 当前完成模型、sanitize、规范化和校验。
- heading level 直接存储在 `level` 字段；其他 block 暂不包含属性字段。
- 规范化会丢弃非法节点而不尝试转换，转换策略留待后续。
