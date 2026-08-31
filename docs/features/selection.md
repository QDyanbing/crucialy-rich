# 选区

选区用于在文档模型中表达位置和范围。本文聚焦模型选区；浏览器 DOM 映射和双向同步已经接入，详见[渲染](./render.md)与[选区双向同步](./selection-sync.md)。

## Path

`Path` 是 `number[]`，用于定位文档树节点。

当前模型路径规则：

- `[]`：document。
- `[blockIndex]`：顶层 block，当前支持 paragraph、heading 和 quote。
- `[blockIndex, textIndex]`：text。

API：

- `getNodeAtPath(document, path)`：返回对应节点，非法路径返回 `undefined`。
- `hasNodeAtPath(document, path)`：判断路径是否存在。

非法路径包括：

- 负数索引。
- 非整数索引。
- 越界索引。
- 超过当前模型层级的路径。

## Point

`Point` 定位 text 节点内的偏移。

```ts
interface Point {
  path: Path;
  offset: number;
}
```

API：

- `isValidPoint(document, point)`：point 必须指向 text 节点，偏移必须为 `0..text.length` 的整数。
- `comparePoint(left, right)`：按路径和偏移比较，返回 `-1 | 0 | 1`。

当前 point 不允许落在 document 或 block 上。

## RangeSelection

`RangeSelection` 用 anchor/focus 表达选区方向。

```ts
interface RangeSelection {
  anchor: Point;
  focus: Point;
}
```

API：

- `cloneRangeSelection(selection)`：深拷贝 anchor/focus 及其 path，用于保存不共享引用的选区快照。
- `isCollapsed(selection)`：判断 anchor/focus 是否为同一点。
- `normalizeRange(selection)`：返回正向范围，保证 anchor 小于或等于 focus。
- `compareRange(left, right)`：比较规范化后的范围。

## 文本切片

当前提供两个文本读取工具：

- `getTextInRange(document, range)`：读取范围内文本。
- `splitTextByRange(document, range)`：返回 `{ before, selected, after }`。

文本读取规则：

- 同一 block 内的 text 节点直接拼接。
- 跨 block 时用 `\n` 表示块边界。
- 反向范围会先规范化。
- 如果范围中任一点非法，会抛出 `RangeError`。

## 演示调试入口

演示当前提供模型选区调试面板：

- 手动输入 anchor/focus 的路径和偏移。
- 展示选区 JSON。
- 展示 anchor 路径对应的模型节点。
- 在文档 JSON 映射中高亮 anchor 路径对应节点。
- 在渲染区改变浏览器选区时同步更新模型选区。

## 当前限制

- 不修改文档结构，只提供查询和纯文本切片。
- 当前只支持顶层连续 block 及其直接 text 子节点。
- Point 只能定位 text 节点，暂不支持图片、表格等未来非文本节点。
