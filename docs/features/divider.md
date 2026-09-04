# Divider 分隔线

Divider 用于表达不可编辑的块级分隔线，模型类型为 `divider`，属于 void block。

## 模型结构

```ts
interface DividerNode {
  type: "divider";
  children: [];
}
```

`createDivider()` 创建 `children: []` 的合法分隔线。统一保留 children 字段是为了延续 block 树遍历协议，但校验器会拒绝任何非空 children，规范化会清空意外传入的子节点。

## 渲染

- Divider 渲染为语义化的 `hr` 元素。
- `hr` 保存 block path，不创建 text path。
- HTML 序列化不会为 void 元素生成结束标签。
- React 渲染层复用同一 RenderedNode 结果。

## 插入

`insertDividerCommand` 注册名为 `insertDivider`。命令要求折叠的文本选区，并在当前 Point 执行两个原子 Operation：

1. `split_block` 把当前文本块一分为二。
2. `insert_block` 在两部分之间插入 Divider。

命令完成后，选区折叠在分隔线后的文本块起点。`insert_block` 是通用块插入 Operation，会克隆传入节点并校验目标 document path，后续图片等 void block 可以复用同一基础能力。

## 当前边界

模型、渲染和插入命令已经接通。Backspace / Delete 边界行为将在后续小步提交中接入。
