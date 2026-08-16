# 文档模型（第一版）

文档模型是富文本内核的数据基础。第一版只支持三层结构，后续功能在此基础上扩展。

## 节点结构

当前支持的层级：`document` → `paragraph` → `text`。

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
  }>;

interface ParagraphNode {
  type: "paragraph";
  children: TextNode[];
}

interface DocumentNode {
  type: "document";
  children: BlockNode[]; // 当前 BlockNode 只有 ParagraphNode
}
```

`BlockNode` 现在等价于 `ParagraphNode`，后续加入 heading、quote、list 等块级节点时再扩展联合类型。

`TextNode.marks` 当前支持 `bold`、`italic`、`underline` 和 `strike` 四个 boolean 标记，以及 `fontSize`、`textColor` 和 `backgroundColor` 三个属性标记。boolean mark 的值固定为 `true`；字号使用 `8–72` 的整数，文字颜色和背景色使用规范化后的六位十六进制字符串；它们可以共存，没有任何有效 mark 时省略 `marks` 字段。

## 类型判断

提供运行时类型判断，对未知输入安全：

- `isTextNode(value)`
- `isParagraphNode(value)`
- `isBlockNode(value)`：当前等价于段落判断。
- `isDocumentNode(value)`

判断只校验当前节点的形状，不递归校验 `children`，递归校验交给 `validateDocument`。

## 创建接口

- `createText(text = "", marks?)`：创建 text 节点，默认空字符串，可携带 text marks。
- `createParagraph(children = [createText()])`：创建段落，默认含一个空 text。
- `createDocument(children = [createParagraph()])`：创建文档，默认含一个空段落。

工厂函数对传入的 `children` 原样保留，是否合法由 `validateDocument` / `normalizeDocument` 负责。

## 结构校验

`validateDocument(value)` 返回 `{ valid, errors }`。规则：

- 根节点必须是 `document`。
- `document` 的 `children` 只能是块级节点。
- `paragraph` 的 `children` 只能是 `text` 节点。
- text marks 只能包含受支持的 boolean mark 或合法属性值。

每条错误带 `path`（节点路径，root 为空数组）和 `message`，便于定位非法节点。

## 规范化

`normalizeDocument(value)` 把任意输入修复为合法文档。当前策略：

- 非 `document` 根节点替换为空文档。
- 空 `document` 自动补一个空段落。
- 段落里的非法 `children` 被丢弃。
- text marks 会被规范化为受支持的 `true` 值。
- 空 `paragraph` 自动补一个空 `text`。

修复后的结果一定能通过 `validateDocument`。

## 当前限制

- 只支持 paragraph、text 和 text marks，不支持 heading、list 等。
- text marks 已完成四种 boolean mark、字号、文字颜色和背景色的模型、command、demo 与 renderer。
- 第一版节点不包含 `attrs` 字段，后续新增 heading、link、image 等能力时再引入属性模型。
- 规范化会丢弃非法节点而不尝试转换，转换策略留待后续。
