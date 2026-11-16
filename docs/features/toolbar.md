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
- 上下左右位置均限制在 8px 视口边距内，窄屏宽度不会超过视口；纯定位函数对屏幕外锚点也做上下夹取。
- 使用 fixed 定位；宿主负责从浏览器 Range 读取并更新 `anchorRect`。
- `toolbarSize` 和 `viewport` 可覆盖默认尺寸，便于自定义外观与测试。
- 非有限几何、颠倒上下边界、负锚点宽高、非正工具栏尺寸、视口任一方向不超过 16px，或声明的工具栏高度无法放进视口边距时不渲染。横向可收窄，纵向不裁掉命令按钮；组件不自行测量主题高度，宿主须传入真实的 toolbarSize。

Demo 捕获页面/祖先滚动，并在 resize、focusin、selectionchange 与模型更新后用 requestAnimationFrame 刷新主编辑区 Range；工具栏自身滚动被排除，监听和排队帧在清理时释放。外部/空/屏幕外 Range 隐藏浮层，重新进入可见范围后恢复；仅焦点离开而 Range 仍有效时不隐藏，保证 Tab/Shift+Tab 记忆入口可用。刷新只更新矩形，不生成模型或 History 变更。React 包本身仍不监听这些事件，也不保证自定义裁剪/transform/门户或真实移动端 visualViewport 行为。

## 键盘导航

低层、固定和悬浮工具栏统一使用 roving tabindex，遵循 [W3C Toolbar 横向键盘模式](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)。公开 prop/类型不变，键盘焦点不是文档选区，也不改变命令 active 状态。

| 按键                         | 行为                                                            |
| ---------------------------- | --------------------------------------------------------------- |
| Tab / Shift+Tab              | 原生进入/离开工具栏，不逐个经过所有按钮，也不阻止默认跳转       |
| ArrowLeft / ArrowRight       | 移动到前后可用命令，跳过 disabled 和 separator，首尾回绕        |
| Home / End                   | 移动到首个/最后一个可用命令                                     |
| Enter / Space                | 保留原生按钮激活，只通过 click 执行一次命令；keydown 不直接执行 |
| ArrowUp / ArrowDown 及其他键 | 不参与横向导航                                                  |

每组最多一个可用按钮是 Tab 入口：优先使用上次实际获得焦点的有效配置 ID，否则选择首个可用项。空配置或全部禁用时没有入口；配置重排仍按最新顺序导航。命令 active 不等于键盘 focus，pointerdown 保留编辑区焦点时不会假装按钮已获得焦点。新增/恢复项目不会主动抢焦点，动态移除或禁用聚焦项时也不额外强制转移浏览器焦点。

左右键在 keydown 时读取工具栏当前计算样式 direction：RTL 反转左右方向，Home/End 仍按配置顺序定位首尾。每个实例的按钮 ref 与焦点记忆独立，不查询其他工具栏。只处理按钮自身且最近 toolbar 根属于本实例的事件，不接管按钮内额外控件或嵌套工具栏的按键。

宿主已取消的事件、IME 的 isComposing / keyCode 229 不触发导航；除 Shift+Tab 外，Alt/Ctrl/Meta/Shift 组合键不被接管。这不是全局 IME 状态机，宿主仍须在组合期间传 disabled，Demo 已接入。

可用的导航、Enter/Space 激活及 Tab/Shift+Tab 离开会先调用 `onCommandCancel(当前项)`，释放可能残留的指针选区。固定/悬浮工具栏内部已处理；低层宿主若实现自己的快照，也应清理。导航不发 onCommand、不生成事务或 History；键盘激活读取当前模型 selection，结果应用与撤销/重做仍由宿主负责。取消通知现在不再仅限于指针事件，宿主回调异常仍不捕获。

初始 SSR 和水合使用相同的首个可用入口，不自动 focus；卸载后焦点记忆重置。Demo 按钮保持单行与非压缩宽度，窄条横向滚动；自定义主题仍需提供清晰的 focus-visible 和可用滚动容器。这里没有竖向/二维导航、全局快捷键、自动返回编辑区、屏幕阅读器全面兼容认证或浮层滚动定位监听。

## 选区恢复

Toolbar button 在未取消的主指针、主按钮 `pointerdown` 阶段阻止默认焦点迁移，并通过 `createToolbarSelectionSnapshot` 深拷贝模型选区。右键、中键及非主指针不会捕获；宿主已取消的按下/点击不继续处理。低层 `Toolbar` 的可选 `onCommandCancel(item)` 会在 `pointercancel`、已取消的按下/点击或上述键盘意图开始时通知宿主清理待处理状态；`FixedToolbar` 已接入此清理。

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
