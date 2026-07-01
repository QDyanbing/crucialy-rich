# Operation（第一版）

Operation 用于描述一次对文档模型的可复现修改。当前阶段已经实现 `insert_text` 和 `delete_text`，后续会在同一模块继续扩展分段、合并和事务。

## 操作类型

```ts
interface InsertTextOperation {
  type: "insert_text";
  point: Point;
  text: string;
}

interface DeleteTextOperation {
  type: "delete_text";
  range: RangeSelection;
}
```

字段说明：

- `type`：当前固定为 `insert_text`。
- `point`：插入位置，必须指向 text 节点内的合法偏移。
- `text`：要插入的文本。
- `range`：删除范围，当前必须落在同一个 text 节点内。

## 创建插入操作

使用 `createInsertTextOperation(point, text)` 创建操作。

创建时会复制 `point.path`，避免外部数组后续修改影响 operation。

## 应用插入操作

使用 `applyInsertText(document, operation)` 返回插入后的新文档。

当前规则：

- 支持 text 节点段首、段中和段尾插入。
- 不会修改传入的原始文档对象。
- `text` 为空字符串时返回原文档引用。
- `point` 不指向 text 节点或 offset 越界时抛出 `RangeError`。

## 创建删除操作

使用 `createDeleteTextOperation(range)` 创建操作。

创建时会复制 anchor/focus 的 path，避免外部数组后续修改影响 operation。

## 应用删除操作

使用 `applyDeleteText(document, operation)` 返回删除后的新文档。

当前规则：

- 支持同一个 text 节点内的段首、段中和段尾删除。
- 支持反向 range，会先规范化为正向 range。
- 不会修改传入的原始文档对象。
- 折叠 range 返回原文档引用。
- range 任一点不指向 text 节点、offset 越界或跨 text 节点时抛出 `RangeError`。

## 插入后的选区

使用 `createSelectionAfterInsertText(operation)` 计算插入后的折叠选区。

规则：

- path 保持为插入点 path。
- offset 前进 `text.length`。
- anchor 和 focus 落在同一点。

## 删除后的选区

使用 `createSelectionAfterDeleteText(operation)` 计算删除后的折叠选区。

规则：

- 先规范化 range。
- path 保持为删除范围起点 path。
- offset 保持为删除范围起点 offset。
- anchor 和 focus 落在同一点。

## 演示调试入口

演示页的文档调试面板提供：

- 插入文本输入框。
- “插入”按钮。
- “删除选区”按钮。
- 最近 operation JSON。
- 插入或删除后文档 JSON 和渲染预览同步更新。
- 插入后选区 JSON 前进到插入文本末尾，删除后选区 JSON 折叠到删除范围起点。

## 当前限制

- 当前只实现 `insert_text` 和同 text 节点内的 `delete_text`。
- 插入非折叠选区时不会自动删除选中内容，当前插入点取 selection anchor。
- 删除暂不支持跨 text 节点或跨 paragraph 范围。
- 尚未接入 `beforeinput`，真实键盘输入仍不更新 model。
- 尚未实现通用 transaction、撤销重做、split 或 merge。
