# 工具栏

Toolbar 是 `@crucialy-rich/react` 提供的 Command 交互层。它消费文档、模型选区和 Command Registry，但不自行持有文档、选区或 History。

## 配置结构

```ts
interface ToolbarCommandItem {
  type: "command";
  id: string;
  commandName: CommandName;
  label: string;
  text?: string;
  payload?: unknown;
}

interface ToolbarSeparatorItem {
  type: "separator";
  id: string;
}

type ToolbarItem = ToolbarCommandItem | ToolbarSeparatorItem;
```

- `id` 用于 React key 和配置去重，同一工具栏内必须唯一。
- `commandName` 对应 core Command Registry 中的命令。
- `label` 是完整可访问名称，`text` 是紧凑按钮内容。
- `payload` 由宿主提供，例如标题层级或安全链接；Toolbar 不硬编码业务数据。
- `defineToolbarItems` 复制配置并拒绝空 ID、重复 ID、空命令名和空标签。

## 状态映射

`resolveToolbarItems(items, registry, context)` 会为每个 command item 调用 core 的 `queryCommandState`：

- 已注册且可执行：`disabled: false`。
- 命令 `isActive` 命中当前选区：`active: true`。
- 命令未注册或当前不可执行：`disabled: true`，并保留原因。
- 分隔项不参与 Command 查询。

Toolbar 不复制 Bold、Link 或 Block Type 的状态判断规则，模型能力仍由 core 负责。

## 默认配置

`createDefaultToolbarItems` 当前按顺序提供：

- 加粗、斜体、下划线、删除线。
- 链接。
- 标题层级，默认为二级标题。
- 引用。

宿主可通过 `headingLevel` 和 `link` 覆盖默认 payload，也可以完全使用自定义配置。

## 状态职责

- React Toolbar：配置、语义渲染、交互事件和选区保护。
- Core Command：可执行判断、active 状态、Transaction 和操作后选区。
- 宿主：应用 CommandResult、记录 History、控制固定/悬浮模式以及链接菜单。

固定工具栏、悬浮定位和选区恢复将在第 17 周后续步骤接入。
