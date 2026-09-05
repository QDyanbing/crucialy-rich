# 有序和无序列表

第 15 周完成基础列表闭环，模型采用 `list -> listItem -> text` 三层结构。

## 模型

```ts
type ListType = "bulletList" | "orderedList";

interface ListItemNode {
  type: "listItem";
  children: TextNode[];
}

interface ListNode {
  type: ListType;
  children: ListItemNode[];
}
```

List 和 ListItem 均至少包含一个子节点。`normalizeDocument` 会丢弃非法子节点、合并相邻同 marks text，并为空列表或空列表项补齐可编辑结构。

## 路径与渲染

- List path：`[blockIndex]`。
- ListItem path：`[blockIndex, itemIndex]`。
- Text path：`[blockIndex, itemIndex, textIndex]`。
- `bulletList` 渲染为 `ul`，`orderedList` 渲染为 `ol`，ListItem 渲染为 `li`。

## Command

- `toggleBulletList` 把连续 paragraph 包装为无序列表；已在无序列表中时恢复 paragraph。
- `toggleOrderedList` 把连续 paragraph 包装为有序列表；已在有序列表中时恢复 paragraph。
- 两类列表可原位互换，内容、marks 和 selection 方向保持不变。
- 列表转换组合通用 `insert_block` / `remove_block` Operation，可直接进入现有 History。

## 输入

- 列表项内普通输入使用 `insert_text`。
- 非空列表项按 Enter 使用 `split_list_item`，在光标处创建下一项。
- 空列表项按 Enter 使用 `exit_list_item`，退出为 paragraph。
- 空项位于列表中间时，原列表会拆为前后两个同类型列表，后续项目不会丢失。

## 当前边界

- 第 15 周只支持单层列表；缩进、反缩进和列表项开头 Backspace 属于第 16 周。
- ListItem 只直接包含 text，不包含段落、子列表或任务项。
- 文字样式、链接和 Block Type Command 暂不直接作用于三层列表选区，列表转换会保留已有 marks。

完整验收见 [基础列表 QA](../qa/list-basic.md)。
