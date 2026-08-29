# Block Type 设计

Block Type 用于描述可编辑文本块的语义类型。第 13 周 Day 1 完成模型与 operation 设计，当前支持 paragraph、heading 和 quote。

## 模型结构

```ts
const BLOCK_TYPES = ["paragraph", "heading", "quote"] as const;
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

type BlockNode = ParagraphNode | HeadingNode | QuoteNode;
```

三种 block 都直接包含 `TextNode[]`。切换 Block Type 时不会改变 text 内容、顺序或 marks。

## 创建和判断

- `createParagraph(children?)` 创建段落。
- `createHeading(level = 1, children?)` 创建 1–6 级标题。
- `createQuote(children?)` 创建引用。
- `isHeadingLevel(value)` 判断标题层级是否合法。
- `isParagraphNode(value)`、`isHeadingNode(value)`、`isQuoteNode(value)` 判断具体节点。
- `isBlockNode(value)` 判断任意已支持的 block。

三个工厂在未传 children 时都会补一个空 text，保证 block 可表达光标落点。

## 校验和规范化

- `validateDocument` 接受 paragraph、1–6 级 heading 和 quote。
- block children 只能是 text 节点。
- 非法 heading level 会使该节点校验失败。
- `normalizeDocument` 保留合法 Block Type，并继续规范化 text marks、合并相邻同 marks text。
- 空 block 会补一个空 text。
- 非法 Block Type 或非法 heading level 会按现有未知节点策略丢弃；文档最终为空时补一个空 paragraph。

## 切换 Operation

```ts
type BlockTypeSpec =
  | { type: "paragraph" }
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6 }
  | { type: "quote" };

interface SetBlockTypeOperation {
  type: "set_block_type";
  path: Path;
  block: BlockTypeSpec;
}
```

使用 `createSetBlockTypeOperation(path, block)` 创建操作，使用 `applySetBlockType(document, operation)` 应用操作。

当前规则：

- `path` 必须精确指向一个顶层 block，格式为 `[blockIndex]`。
- paragraph、heading 和 quote 可以互相切换。
- heading 可以直接更新 level。
- 切换只替换目标 block 外壳，保留原 `children`、文本和 marks。
- 未命中的 block 保持原对象引用，原始 document 不会被修改。
- 目标类型与当前类型一致时返回原 document；heading 还要求 level 一致。
- 创建和应用阶段都会拒绝非法目标类型，应用阶段还会拒绝非法 path。
- `set_block_type` 已接入 Operation 联合、Transaction 克隆与执行、block 作用域摘要和验收报告。

## 当前渲染边界

Heading 已在 Day 2 完成语义渲染和 command：1–6 级标题分别输出 `<h1>`–`<h6>`。Quote 已在 Day 3 输出 `<blockquote>`，并通过 `toggleQuote` 在引用和 paragraph 间切换。Day 4 已让两个 command 支持跨多个连续 block 切换，详细 API 见 [Heading 标题](./heading.md)、[Quote 引用块](./quote.md)和[多块 Block Type 切换规则](./block-type-boundaries.md)。

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
