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
- 菜单项 DOM ID 由 React `useId` 和当前项索引生成，同一 React 树中的多个菜单可复用配置而不重复 ID；ID 属于内部实现，不应拼接配置 `id` 查询节点。独立 SSR 根须使用不同的 `identifierPrefix`，并在水合时保持一致。

## 键盘行为

- `Escape`：关闭当前触发位置的菜单。
- `ArrowDown` / `ArrowUp`：循环移动活动项，首尾可回绕。
- `Enter`：选择活动项；空结果或非法索引不会执行。
- 其他按键继续交给编辑器处理。

`getSlashMenuKeyboardAction`、`getNextSlashMenuIndex` 和 `moveSlashMenuSelection` 都是无 DOM 依赖的纯函数，宿主可在编辑器的 keydown 流程中复用。

`getSlashMenuKeyboardAction` 只解析 key 字符串，不知道事件是否已取消、是否带修饰键或处于输入法组合阶段。宿主须先检查这些状态，再处理菜单。Demo 在活跃 Composition 或原生 `isComposing` 时不拦截键盘，也不执行菜单点击；Alt/Ctrl/Meta/Shift 组合键跳过菜单分支，继续交给原有编辑流程。例如菜单打开时 Shift+Enter 仍插入 LF，不选择标题。宿主自行接入的撤销/重做快捷键也须遵守组合输入保护。

`openSlashMenu` 和有效导航生成的状态独立复制触发信息与 Range/两端 path，修改旧状态不会改变后续导航分支。关闭或空结果导航仍返回原状态，不承诺所有调用都创建新对象。

## 命令执行

`executeSlashCommand` 先在临时文档中删除触发 Range，再以清理后的折叠选区执行目标 core Command。两段 operation 只有在目标命令成功时才合并为一个 Transaction，因此：

- `/h2` 不会残留在标题正文中。
- 删除和块命令只产生一个 History 记录。
- 目标命令失败时不会暴露只删除了触发文本的半成品 Transaction。
- Registry/guard/execute 同步异常经 executeCommand 转为 failure，仍不暴露触发文本清理事务，源模型保持原样；修复扩展后可重新执行，清理和目标命令仍合为一次 History。这里只承诺纯函数扩展的事务隔离，不回滚插件自行产生的副作用。
- 跨 mark text 节点的触发文本可以安全清理，两端未删除文本保留原 marks。

### 执行前校验

执行前会在当前文档的 Range focus 重新识别触发条件，并核对 `text`、`query`、起点文字偏移和同一顶层 paragraph 归属。触发文字已变、范围多含前文、折叠/反向/跨块范围、非法端点或块类型变化均返回 failure；不查 Registry、不暴露清理事务或新选区，也不修改源文档。空查询 `/`、中文/emoji/组合重音和跨 marks 仍可执行，Point offset 继续使用 UTF-16；不同叶子上表示同一文字边界的合法起点不会被误拒绝。

这里检查的是内容和范围，而非文档身份：未改变触发文字的新文档引用或触发后正文修改仍可执行，无法识别同位置、同文字但属于另一次编辑的触发。`trigger.range` 是执行位置，`context.selection` 可省略，也不要求当前光标仍停在该位置。宿主负责在文档/选区变化时刷新或关闭菜单，不应把本校验当作旧选区重映射或权限控制。

返回事件的 `trigger` 是调用开始时的独立快照；其 Range 与输入对象不共享引用，即使目标同步扩展修改调用方保存的触发对象，也不改变本次事件。`item` 和不透明 `payload` 仍按原引用透传，不承诺复制插件对象或回滚扩展副作用。

## 当前边界

- 当前不在 heading、quote、codeBlock 或列表中触发，保证默认块命令都从 paragraph 的稳定上下文开始。
- React 包提供受控菜单组件和纯函数，不自行持有文档、History 或注册全局键盘监听。
- Demo 已接入浏览器选区矩形；宿主产品仍需根据自身滚动容器决定何时刷新位置。
