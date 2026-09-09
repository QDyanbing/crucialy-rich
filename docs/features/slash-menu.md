# 斜杠菜单

斜杠菜单是 `@crucialy-rich/react` 的块级命令发现入口。当前完成配置、过滤和触发识别；弹层、定位、键盘导航与命令执行将在后续迭代接入。

## 配置契约

```ts
interface SlashCommandItem {
  id: string;
  commandName: CommandName;
  label: string;
  description?: string;
  keywords?: readonly string[];
  payload?: unknown;
}
```

- `id` 在同一配置内必须唯一。
- `commandName` 对应 core Command Registry 中已有的命令。
- `label` 和 `description` 用于展示，`keywords` 用于补充中文或英文检索词。
- `payload` 原样交给命令，例如标题层级 `{ level: 2 }`。
- `defineSlashCommandItems` 会清理字段两端空白、防御性复制数组，并拒绝空字段与重复 ID。

## 默认命令

`createDefaultSlashCommandItems()` 按顺序提供正文、1–3 级标题、引用、代码块、无序列表、有序列表、任务列表和分割线。默认项只组合 core 已注册命令，不复制文档变更逻辑。

## 过滤规则

`filterSlashCommandItems(items, query)` 按配置顺序返回结果：

- 空查询返回全部菜单项的新数组。
- 查询会清理两端空白并忽略大小写。
- 对 `id`、`label` 和每个 `keyword` 做前缀匹配。
- 不做词中模糊匹配，避免短查询产生难以预期的结果。

例如 `hea` 可匹配标题命令，`待办` 可匹配任务列表。

## 触发条件

`findSlashMenuTrigger(document, selection)` 仅在以下条件全部满足时返回触发信息：

- selection 存在且为折叠光标。
- 光标位于 paragraph 的合法 text 位置。
- 光标前最近的 `/` 位于段首或空白字符之后。
- `/` 与光标之间不包含空白或另一个 `/`。

返回值包含查询文本、完整触发文本和模型 Range。Range 可以跨相邻 mark text 节点，为后续执行命令时精确清理 `/he` 保留边界。

## 当前边界

- 当前没有渲染菜单，也不监听输入或浏览器选区。
- 当前不在 heading、quote、codeBlock 或列表中触发，保证默认块命令都从 paragraph 的稳定上下文开始。
- 触发文本删除、弹层定位、Escape 关闭、键盘导航和 Enter 执行尚未实现。
