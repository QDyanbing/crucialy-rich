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

## 固定工具栏

`FixedToolbar` 接收 `document`、可选 `selection`、items 和 Registry，并把解析后的状态渲染为可访问按钮：

```tsx
<FixedToolbar
  document={document}
  items={createDefaultToolbarItems({
    link: { href: "https://example.com/docs" },
  })}
  onCommand={({ result, selection }) => {
    // 宿主应用 result、记录 History，并保存 selection。
  }}
  selection={selection}
/>
```

- 根节点使用 `role="toolbar"`，分隔项使用 `role="separator"`。
- command button 使用 `aria-pressed` 表达 active，并原样应用 disabled。
- 点击后通过 `executeToolbarCommand` 执行配置中的命令，并回传 `ToolbarCommandEvent`。

## 悬浮工具栏

`FloatingToolbar` 复用固定工具栏，只在 selection 非折叠且提供 `anchorRect` 时显示：

- 默认居中放在选区上方；空间不足时放到下方。
- 左右位置限制在 8px 视口边距内，窄屏宽度不会超过视口。
- 使用 fixed 定位；宿主负责从浏览器 Range 读取并更新 `anchorRect`。
- `toolbarSize` 和 `viewport` 可覆盖默认尺寸，便于自定义外观与测试。

## 选区恢复

Toolbar button 在 `pointerdown` 阶段阻止默认焦点迁移，并通过 `createToolbarSelectionSnapshot` 深拷贝模型选区。click 执行命令时使用保存的选区；宿主把结果 selection 交回受控 `RichTextEditor` 后，编辑器会在 layout effect 中恢复 DOM Selection。

这套机制保证固定或悬浮工具栏点击不会把格式错误应用到折叠光标，也不会要求 Toolbar 持有编辑器状态。

## 当前边界

- React 包提供结构 class，不内置产品主题；Demo 给出一套中文验收样式。
- 默认配置不包含字号、文字颜色和背景色，宿主可用自定义 `ToolbarItem` 扩展。
- Link 需要宿主提供安全 payload；复杂链接菜单仍由宿主管理。
- 悬浮工具栏不自行监听 `selectionchange`、滚动或窗口缩放，定位矩形由宿主同步。
- Toolbar 不持有 History，也不直接修改 DocumentNode。
