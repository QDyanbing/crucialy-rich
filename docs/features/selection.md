# Selection（第一版）

Selection 用于在文档模型中表达位置和范围。当前阶段只覆盖 model selection，不绑定浏览器 DOM selection。

## Path

`Path` 是 `number[]`，用于定位文档树节点。

当前模型路径规则：

- `[]`：document。
- `[blockIndex]`：paragraph。
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

`Point` 定位 text 节点内的 offset。

```ts
interface Point {
  path: Path;
  offset: number;
}
```

API：

- `isValidPoint(document, point)`：point 必须指向 text 节点，offset 必须为 `0..text.length` 的整数。
- `comparePoint(left, right)`：按 path 和 offset 比较，返回 `-1 | 0 | 1`。

当前 point 不允许落在 document 或 paragraph 上。

## RangeSelection

`RangeSelection` 用 anchor/focus 表达选区方向。

```ts
interface RangeSelection {
  anchor: Point;
  focus: Point;
}
```

API：

- `isCollapsed(selection)`：判断 anchor/focus 是否为同一点。
- `normalizeRange(selection)`：返回正向 range，保证 anchor 小于或等于 focus。
- `compareRange(left, right)`：比较规范化后的 range。

## 文本切片

当前提供两个文本读取工具：

- `getTextInRange(document, range)`：读取 range 内文本。
- `splitTextByRange(document, range)`：返回 `{ before, selected, after }`。

文本读取规则：

- 同一 paragraph 内的 text 节点直接拼接。
- 跨 paragraph 时用 `\n` 表示段落边界。
- 反向 range 会先 normalize。
- 如果 range 中任一点非法，会抛出 `RangeError`。

## 当前限制

- 不包含浏览器 selection 同步。
- 不包含 DOM 到 model 的映射。
- 不修改文档结构，只提供查询和纯文本切片。
- 当前 path 规则和第一版文档模型绑定，后续 block 类型扩展后需要同步更新。
