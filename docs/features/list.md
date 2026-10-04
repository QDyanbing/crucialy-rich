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

interface OrderedListNode {
  type: "orderedList";
  children: ListItemNode[];
  start?: number;
}
```

- `bulletList` 和 `orderedList` 只接收 `listItem`。
- `orderedList.start` 是可选安全整数；省略时从 1 开始，也支持 0 和负数编号。
- `taskList` 只接收带布尔 `checked` 的 `taskItem`。
- 列表和列表项至少包含一个子节点；规范化会丢弃类型不匹配的项目并补齐空结构。
- `nested` 最多递归三层，超过 `MAX_LIST_DEPTH` 的结构在校验阶段报错并在规范化阶段移除。

## 路径与渲染

- 顶层 List：`[blockIndex]`。
- ListItem：`[...listPath, itemIndex]`。
- ListItem Text：`[...listPath, itemIndex, textIndex]`。
- Nested List：`[...itemPath, item.children.length]`，随后继续追加 item 和 text 索引。
- `bulletList` 渲染为 `ul`，`orderedList` 渲染为 `ol` 并在需要时输出 `start`，`taskList` 渲染为带任务语义的 `ul`。
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
- 从有序列表中退出或解除中间项时，前后列表会保留并续接原编号。

## HTML 列表粘贴

Clipboard parser 会把每个 `li` 的第一个直接 `ul` 或 `ol` 映射为该列表项的 `nested`。有序、无序类型可以逐层混合，最多导入 `MAX_LIST_DEPTH` 允许的三层；每层 `ol` 的安全整数 `start`、父子项文字 mark 与安全链接都会独立保留。粘贴后的折叠选区位于最深的最后列表项末尾。

Clipboard parser 可识别 checkbox 驱动的 HTML 无序列表。只有每个直属 `li` 都以 checkbox 作为首个有效内容时，列表才转换为 `taskList`；checkbox 的 `checked` 属性进入模型，任务文字的 mark 和安全链接继续保留。常见的 `label`、`p`、`div`、`span` 起始包装可以逐层识别。

嵌套 checkbox 列表会继续映射为 nested taskList，并分别保留父子项 checked 状态。混合任务/普通项、正文后的 checkbox、radio 和 `ol` 不会升级为任务列表，而是按普通 bulletList 或 orderedList 导入。解析后的列表通过一次 Paste Transaction 插入并形成一条 History 记录。

## 边界

- 首项不能继续缩进，顶层项不能反缩进，达到三层上限后不再缩进。
- 非折叠选区不会触发 Tab/Shift+Tab 结构修改。
- 已存在的目标子列表必须与当前项目兼容；任务项目不会被缩进到普通列表，反之亦然。
- 当前列表项直接包含 text 和可选 nested list，不支持在单个列表项中混放 paragraph、heading、quote 或 void block。
- HTML 粘贴每个 `li` 只保留第一个直接子列表；超过三层的后续结构会被省略，checkbox 必须位于每个直属项的起始包装链。
- 跨 text、跨 item 的范围删除与样式命令尚未实现。

验收记录见[基础列表 QA](../qa/list-basic.md)和[列表增强 QA](../qa/list-advanced.md)。
