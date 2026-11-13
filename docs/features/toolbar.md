# 工具栏

Toolbar 是 `@crucialy-rich/react` 提供的 Command 交互层。它消费文档、模型选区和 Command Registry，但不自行持有文档、选区或 History。

## 扩展异常

状态查询捕获 Registry、canExecute 和 isActive 的同步异常，异常项禁用且不激活，其他正常项继续渲染和使用。渲染后 guard 发生异常时，点击仍通过 executeCommand 返回 failure，不输出半成品 transaction；宿主 onCommand 可能收到失败结果，应检查 ok 后再应用。组件不回滚扩展副作用或捕获宿主回调异常，详见[扩展异常边界](./command.md#扩展异常边界)。

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

`FixedToolbar`（以及复用它的 `FloatingToolbar`）每次渲染都会重新查询状态，因此同一个可变 Registry 中补注册、替换命令或 guard/active 条件改变后，下一次宿主渲染可反映新状态。它不订阅 Registry，不会因原地注册自动触发 React 更新；状态查询扩展应保持纯函数。真正点击执行时仍由 `executeCommand` 复核当前 guard，不能把渲染时的 enabled 当成执行成功保证。

## 默认配置

`createDefaultToolbarItems` 当前按顺序提供：

- 加粗、斜体、下划线、删除线、行内代码、清除格式。
- 链接。
- 标题层级，默认为二级标题。
- 引用。

“清除格式”调用 core 的 `clearFormattingCommand`，会在一个 transaction 中移除选区内全部文字标记、属性和链接。宿主可通过 `headingLevel` 和 `link` 覆盖默认 payload，也可以完全使用自定义配置。

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
- 可选 `disabled` 默认 false，统一禁用所有命令按钮，但保留各项 active 状态与分隔线；解除后仍遵守命令自身 disabled。低层 `Toolbar`、`FixedToolbar` 和 `FloatingToolbar` 均支持此 prop。
- Demo 把 Composition 活跃状态传给固定/悬浮工具栏的 `disabled`，候选阶段不执行格式命令，结束后可继续格式化及独立撤销。这个 prop 只锁定工具栏，不是编辑器只读开关或权限控制，也不负责禁用宿主其他控件。

## 悬浮工具栏

`FloatingToolbar` 复用固定工具栏，只在 selection 非折叠且提供 `anchorRect` 时显示：

- 默认居中放在选区上方；空间不足时放到下方。
- 左右位置限制在 8px 视口边距内，窄屏宽度不会超过视口。
- 使用 fixed 定位；宿主负责从浏览器 Range 读取并更新 `anchorRect`。
- `toolbarSize` 和 `viewport` 可覆盖默认尺寸，便于自定义外观与测试。

## 选区恢复

Toolbar button 在未取消的主指针、主按钮 `pointerdown` 阶段阻止默认焦点迁移，并通过 `createToolbarSelectionSnapshot` 深拷贝模型选区。右键、中键及非主指针不会捕获；宿主已取消的按下/点击不继续处理。低层 `Toolbar` 的可选 `onCommandCancel(item)` 会在 `pointercancel` 或已取消的按下/点击时通知宿主清理待处理状态；`FixedToolbar` 已接入此清理。

按下快照记录文档引用、Registry 引用、按钮 ID、commandName、payload 引用以及当时的选区（包括缺失选区）。点击前若这些归属不一致，本次手势取消，不执行命令、不通知 onCommand；下一次新激活可使用当前上下文。同文档只更新 selection 或展示文字/样式时，仍使用原按下范围。文档即使内容相等，只要换引用也视为替换；宿主应保持未编辑模型和配置 payload 引用稳定。

快照在命令执行及宿主回调之前消费，所以同步重入、失败后重试或下一次无按下的激活不会再次借用旧范围。禁用或移除 onCommand 后的已提交渲染会取消待处理手势，恢复后不会复活。未配对的正常 click 使用当前 selection。组件不重映射旧文档范围，不追踪模型或 payload 的原地修改，也不提供窗口级拖拽/释放监听。

`executeToolbarCommand` 返回的 `event.selection` 是调用开始、进入 Registry/guard/execute 之前的独立 Range 快照，用于 before/History；操作后选区应读取 `event.result.selection`。成功、失败或 skipped 都保持这个规则，初始无选区时不补借扩展后来写入的选区。这里只隔离通知快照，不复制 document、item 或不透明 payload，也不回滚扩展对输入的修改或捕获宿主回调异常。

宿主把命令结果 selection 交回受控 `RichTextEditor` 后，编辑器会在 layout effect 中恢复 DOM Selection。工具栏仅保留当前待处理手势，不持有文档或 History 的权威状态。

## 当前边界

- React 包提供结构 class，不内置产品主题；Demo 给出一套中文验收样式。
- 默认配置不包含字号、文字颜色和背景色，宿主可用自定义 `ToolbarItem` 扩展。
- Link 需要宿主提供安全 payload；复杂链接菜单仍由宿主管理。
- 悬浮工具栏不自行监听 `selectionchange`、滚动或窗口缩放，定位矩形由宿主同步。
- Toolbar 不持有 History，也不直接修改 DocumentNode。
