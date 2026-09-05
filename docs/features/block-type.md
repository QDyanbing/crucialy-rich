# Block Type 设计

Block Type 用于描述块级节点语义。当前还包含 bulletList 和 orderedList；`set_block_type` 仅用于四种顶层文本块，Divider 与 List 使用各自的结构 Operation 管理。

## 模型结构

```ts
const BLOCK_TYPES = ["paragraph", "heading", "quote", "codeBlock", "divider"] as const;
const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

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
```

四种文本 block 直接包含 `TextNode[]`，Divider 固定为 `children: []`。CodeBlock 切换保留文字但会移除 marks。

## 创建和判断

- `createParagraph(children?)` 创建段落。
- `createHeading(level = 1, children?)` 创建 1–6 级标题。
- `createQuote(children?)` 创建引用。
- `createCodeBlock(children?)` 创建纯文本代码块。
- `createDivider()` 创建 void 分隔线。
- `isHeadingLevel(value)` 判断标题层级是否合法。
- `isParagraphNode(value)`、`isHeadingNode(value)`、`isQuoteNode(value)`、`isCodeBlockNode(value)`、`isDividerNode(value)` 判断具体节点。
- `isTextBlockNode(value)`、`isVoidBlockNode(value)` 和 `isBlockNode(value)` 判断节点分类。

文本块工厂在未传 children 时补一个空 text；Divider 不表达内部光标。

## 校验和规范化

- `validateDocument` 接受文本、void 和 list block，并要求 Divider children 为空、CodeBlock 不含 marks、List 只包含 ListItem。
- block children 只能是 text 节点。
- 非法 heading level 会使该节点校验失败。
- `normalizeDocument` 保留合法 Block Type，并继续规范化 text marks、合并相邻同 marks text。
- 空文本 block 会补一个空 text，Divider 会清空意外 children。
- 非法 Block Type 或非法 heading level 会按现有未知节点策略丢弃；文档最终为空时补一个空 paragraph。

## 切换 Operation

```ts
type BlockTypeSpec =
  | { type: "paragraph" }
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6 }
  | { type: "quote" }
  | { type: "codeBlock" };

interface SetBlockTypeOperation {
  type: "set_block_type";
  path: Path;
  block: BlockTypeSpec;
}
```

使用 `createSetBlockTypeOperation(path, block)` 创建操作，使用 `applySetBlockType(document, operation)` 应用操作。

当前规则：

- `path` 必须精确指向一个顶层 block，格式为 `[blockIndex]`。
- paragraph、heading、quote 和 codeBlock 可以互相切换。
- heading 可以直接更新 level。
- 切换只替换目标 block 外壳并保留文本；前三种富文本 block 保留 marks，切换到 codeBlock 时移除 marks。
- 未命中的 block 保持原对象引用，原始 document 不会被修改。
- 目标类型与当前类型一致时返回原 document；heading 还要求 level 一致。
- 创建和应用阶段都会拒绝非法目标类型，应用阶段还会拒绝非法 path。
- `set_block_type` 已接入 Operation 联合、Transaction 克隆与执行、block 作用域摘要和验收报告。

## 当前渲染边界

Heading 输出 `<h1>`–`<h6>`，Quote 输出 `<blockquote>`，CodeBlock 输出 `<pre><code>`，Divider 输出 `<hr>`。详细 API 见 [Heading 标题](./heading.md)、[Quote 引用块](./quote.md)、[CodeBlock 代码块](./code-block.md)和[Divider 分隔线](./divider.md)。

- Day 2 已完成 heading 1–6 级语义渲染和 command。
- Day 3 已完成 quote 语义渲染和 command。
- Day 4 已扩展到跨多个 block 的切换。
- Day 5 完成标题和引用闭环验收。

## 验收

对应自动化测试：

- `packages/core/tests/model/types.test.ts`
- `packages/core/tests/model/guards.test.ts`
- `packages/core/tests/model/factories.test.ts`
- `packages/core/tests/model/validate.test.ts`
- `packages/core/tests/model/normalize.test.ts`
- `packages/core/tests/operation/set-block-type.test.ts`
- `packages/core/tests/operation/transaction.test.ts`
- `packages/core/tests/operation/summary.test.ts`
- `packages/core/tests/operation/acceptance.test.ts`
- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/public-api.test.ts`
