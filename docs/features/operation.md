# Operation（第一版）

Operation 用于描述一次对文档模型的可复现修改。当前阶段先实现 `insert_text`，后续会在同一模块继续扩展删除、分段、合并和事务。

## 操作类型

```ts
interface InsertTextOperation {
  type: "insert_text";
  point: Point;
  text: string;
}
```

字段说明：

- `type`：当前固定为 `insert_text`。
- `point`：插入位置，必须指向 text 节点内的合法偏移。
- `text`：要插入的文本。

## 创建操作

使用 `createInsertTextOperation(point, text)` 创建操作。

创建时会复制 `point.path`，避免外部数组后续修改影响 operation。

## 应用操作

使用 `applyInsertText(document, operation)` 返回插入后的新文档。

当前规则：

- 支持 text 节点段首、段中和段尾插入。
- 不会修改传入的原始文档对象。
- `text` 为空字符串时返回原文档引用。
- `point` 不指向 text 节点或 offset 越界时抛出 `RangeError`。

## 插入后的选区

使用 `createSelectionAfterInsertText(operation)` 计算插入后的折叠选区。

规则：

- path 保持为插入点 path。
- offset 前进 `text.length`。
- anchor 和 focus 落在同一点。

## 演示调试入口

演示页的文档调试面板提供：

- 插入文本输入框。
- “插入”按钮。
- 最近 operation JSON。
- 插入后文档 JSON 和渲染预览同步更新。
- 插入后选区 JSON 前进到插入文本末尾。

## 当前限制

- 当前只实现 `insert_text`。
- 非折叠选区不会自动删除选中内容，当前插入点取 selection anchor。
- 尚未接入 `beforeinput`，真实键盘输入仍不更新 model。
- 尚未实现通用 transaction、撤销重做、delete、split 或 merge。
