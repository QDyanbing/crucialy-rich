# 斜杠菜单

斜杠菜单是 `@crucialy-rich/react` 的块级命令发现入口。当前已完成配置、过滤、触发识别、浮层定位、键盘导航、命令执行和 Demo 闭环。

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

返回值包含查询文本、完整触发文本和模型 Range。Range 可以跨相邻 mark text 节点，执行命令时会据此精确清理 `/he`。

## 浮层与定位

- `SlashMenu` 渲染 `listbox/option` 可访问语义，并通过 `aria-selected` 标记活动项。
- `FloatingSlashMenu` 在缺少光标矩形或没有匹配项时不渲染。
- `calculateSlashMenuPosition` 优先放在光标下方，空间不足时翻到上方，并限制在视口边距内。
- 菜单项 pointerdown 会阻止默认焦点迁移，使浏览器选区仍保留在编辑区。

## 键盘行为

- `Escape`：关闭当前触发位置的菜单。
- `ArrowDown` / `ArrowUp`：循环移动活动项，首尾可回绕。
- `Enter`：选择活动项；空结果或非法索引不会执行。
- 其他按键继续交给编辑器处理。

`getSlashMenuKeyboardAction`、`getNextSlashMenuIndex` 和 `moveSlashMenuSelection` 都是无 DOM 依赖的纯函数，宿主可在编辑器的 keydown 流程中复用。

## 命令执行

`executeSlashCommand` 先在临时文档中删除触发 Range，再以清理后的折叠选区执行目标 core Command。两段 operation 只有在目标命令成功时才合并为一个 Transaction，因此：

- `/h2` 不会残留在标题正文中。
- 删除和块命令只产生一个 History 记录。
- 目标命令失败时不会暴露只删除了触发文本的半成品 Transaction。
- 跨 mark text 节点的触发文本可以安全清理，两端未删除文本保留原 marks。

## 当前边界

- 当前不在 heading、quote、codeBlock 或列表中触发，保证默认块命令都从 paragraph 的稳定上下文开始。
- React 包提供受控菜单组件和纯函数，不自行持有文档、History 或注册全局键盘监听。
- Demo 已接入浏览器选区矩形；宿主产品仍需根据自身滚动容器决定何时刷新位置。
