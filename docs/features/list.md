# 列表

第 15 周完成有序和无序列表，第 16 周继续完成嵌套、缩进、列表 Backspace 与任务列表闭环。

## 模型

```ts
type ListType = "bulletList" | "orderedList" | "taskList";

interface ListItemNode {
  type: "listItem";
  children: TextNode[];
  nested?: ListNode;
}

interface TaskItemNode {
  type: "taskItem";
  checked: boolean;
  children: TextNode[];
  nested?: ListNode;
}
```

- `bulletList` 和 `orderedList` 只接收 `listItem`。
- `taskList` 只接收带布尔 `checked` 的 `taskItem`。
- 列表和列表项至少包含一个子节点；规范化会丢弃类型不匹配的项目并补齐空结构。
- `nested` 最多递归三层，超过 `MAX_LIST_DEPTH` 的结构在校验阶段报错并在规范化阶段移除。

## 路径与渲染

- 顶层 List：`[blockIndex]`。
- ListItem：`[...listPath, itemIndex]`。
- ListItem Text：`[...listPath, itemIndex, textIndex]`。
- Nested List：`[...itemPath, item.children.length]`，随后继续追加 item 和 text 索引。
- `bulletList` 渲染为 `ul`，`orderedList` 渲染为 `ol`，`taskList` 渲染为带任务语义的 `ul`。
- 任务项渲染 checkbox，勾选后通过 operation 写回 model，而不是只修改 DOM。

## Command

- `toggleBulletList`、`toggleOrderedList` 和 `toggleTaskList` 支持 paragraph 包装、列表类型互换和再次执行恢复 paragraph。
- 列表转换保留文字、marks 和 selection 方向；普通列表转任务列表时补 `checked: false`。
- checkbox 使用 `set_task_item_checked` 更新任务状态，并进入 Transaction 与 History。
- React 编辑器支持 Ctrl/Meta + Shift + 7 切换 OrderedList、Ctrl/Meta + Shift + 8 切换 BulletList。

## 键盘输入

- 普通输入与删除支持顶层和嵌套列表项的 text path。
- 非空项按 Enter 使用 `split_list_item`；任务项分裂出的新项目默认未完成。
- 顶层空项按 Enter 使用 `exit_list_item` 退出为 paragraph；嵌套空项按 Enter 提升一级。
- Tab 使用 `indent_list_item` 把当前非首项移入前一项，Shift+Tab 使用 `outdent_list_item` 提升一级。
- 顶层列表项开头 Backspace 使用 `unwrap_list_item` 转为 paragraph；嵌套项开头 Backspace 提升一级。
- 缩进、反缩进、拆分和退出均保留当前项目已有的子列表。

## 边界

- 首项不能继续缩进，顶层项不能反缩进，达到三层上限后不再缩进。
- 非折叠选区不会触发 Tab/Shift+Tab 结构修改。
- 已存在的目标子列表必须与当前项目兼容；任务项目不会被缩进到普通列表，反之亦然。
- 当前列表项直接包含 text 和可选 nested list，不支持在单个列表项中混放 paragraph、heading、quote 或 void block。
- 跨 text、跨 item 的范围删除与样式命令尚未实现。

验收记录见[基础列表 QA](../qa/list-basic.md)和[列表增强 QA](../qa/list-advanced.md)。
