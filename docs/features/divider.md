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

## 当前边界

本阶段先完成模型、校验、规范化、快照和渲染契约。插入命令以及 Backspace / Delete 边界行为将在后续小步提交中接入。
