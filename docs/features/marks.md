# 文字标记模型

文字标记用于描述 text 节点上的内联格式。第 9 周 Bold 和 Italic 已闭环；第 10 周已完成 boolean mark 叠加规则、Underline 和 Strike。当前覆盖数据结构、helper、校验、规范化、`toggle_mark` operation、可复用 mark command、四种 boolean mark 渲染、demo 多节点验收、operation 保留和 history 快照保留。

## 数据结构

当前支持四个 boolean text mark：

- `bold`：加粗。
- `italic`：斜体。
- `underline`：下划线，已接入 command、renderer 和 demo。
- `strike`：删除线，已接入 command、renderer 和 demo。

```ts
const TEXT_MARK_TYPES = ["bold", "italic", "underline", "strike"] as const;

type TextMarkType = "bold" | "italic" | "underline" | "strike";
type TextMarks = Partial<Record<TextMarkType, true>>;

interface TextNode {
  type: "text";
  text: string;
  marks?: TextMarks;
}
```

`marks` 只记录启用状态，值固定为 `true`；未启用的 mark 不写入节点。

## 叠加规则

- 四种 boolean mark 相互独立，同一个 text 节点可以同时启用任意组合。
- 添加、移除或切换某一种 mark 时，其他已启用 mark 保持不变。
- `normalizeTextMarks` 按 `TEXT_MARK_TYPES` 统一保留合法的 `true` 值。
- 相邻 text 节点只有在四种 marks 的启用状态完全一致时才会合并。
- History 快照和 text operation 会保留完整 marks 对象。

## Helper

当前公开 helper：

- `normalizeTextMarks(value)`：只保留受支持且值为 `true` 的 mark。
- `hasTextMark(marks, mark)`：判断 mark 是否启用。
- `addTextMark(marks, mark)`：返回启用指定 mark 后的新对象。
- `removeTextMark(marks, mark)`：返回移除指定 mark 后的新对象；没有剩余 mark 时返回 `undefined`。
- `setTextMark(marks, mark, active)`：按明确的激活状态添加或移除指定 mark。
- `toggleTextMark(marks, mark)`：按当前状态切换指定 mark。
- `areTextMarksEqual(left, right)`：比较两个 mark 集合的启用状态。
- `mergeAdjacentTextNodes(nodes)`：合并相邻且 marks 启用状态完全一致的 text 节点。

## 校验与规范化

`validateDocument` 增加 text marks 校验：

- `marks` 省略时合法。
- `marks` 必须是普通对象。
- key 只能是 `bold`、`italic`、`underline` 或 `strike`。
- value 必须是 `true`。

`normalizeDocument` 会保留合法 mark，丢弃未知 mark、非 `true` mark 和空 mark 集合，并合并相邻同 marks 的 text 节点。规范化后的文档仍能通过 `validateDocument`。

## 编辑保留

当前 text operation 的 mark 保留契约：

- `insert_text` 修改 text 内容时保留原 text 节点 marks。
- `delete_text` 删除 text 内容时保留原 text 节点 marks。
- `split_block` 拆分 text 节点时左右两侧继承原 marks。
- `merge_block` 合并 paragraph 时保留两段中原有 text 节点 marks。

History snapshot 现在会深拷贝 text marks，撤销/重做记录不会丢失已有格式数据。

## Toggle Mark Operation

`toggle_mark` 用于在同一 paragraph 内切换 mark。

```ts
interface ToggleMarkOperation {
  type: "toggle_mark";
  mark: TextMarkType;
  range: RangeSelection;
}
```

当前规则：

- range 必须落在同一个 paragraph 内。
- 非折叠 range 会按 text 边界切分 before / selected / after，只修改 selected 覆盖到的 text 片段。
- 选区内存在未激活的目标 mark 时会统一添加；全部已激活时会统一移除，避免混合选区逐节点反转。
- 同一 paragraph 内跨多个 text 节点时会统一修改目标 mark，并合并相邻同 marks 的 text 节点。
- selection 会在合并后的文档中按 paragraph text offset 重新映射。
- collapsed range 会在光标处创建一个空 text 节点，并把切换后的 marks 写到该空节点上。
- collapsed 后续输入会插入到该空 text 节点内，从而继承 mark。

## Bold Command

`boldCommand` 通过 `toggle_mark` 切换 `bold`。

```ts
const BOLD_COMMAND_NAME = "bold";

const boldCommand: Command;
```

执行规则：

- selection 必须存在。
- anchor 和 focus 必须都指向合法 text point。
- 当前支持同一个 paragraph 内的 selection。
- 成功时返回包含 `toggle_mark` 的 transaction。
- `queryCommandState` 会通过 `isActive` 返回当前 selection 所在 text 节点是否已经加粗。

`boldCommand` 已加入默认 command registry，demo 操作区可通过“加粗”按钮调用，并会记录 history。

## Italic Command

`italicCommand` 通过 `toggle_mark` 切换 `italic`。

```ts
const ITALIC_COMMAND_NAME = "italic";

const italicCommand: Command;
```

执行规则与 `boldCommand` 保持一致：

- selection 必须存在。
- anchor 和 focus 必须都指向合法 text point。
- 当前支持同一个 paragraph 内的 selection。
- 成功时返回包含 `toggle_mark` 的 transaction。
- `queryCommandState` 会通过 `isActive` 返回当前 selection 所在 text 节点是否已经斜体。

`italicCommand` 已加入默认 command registry，demo 操作区可通过“斜体”按钮调用，并会记录 history。

## Underline Command

`underlineCommand` 通过 `toggle_mark` 切换 `underline`。

```ts
const UNDERLINE_COMMAND_NAME = "underline";

const underlineCommand: Command;
```

执行规则与 Bold/Italic 一致，支持同一 paragraph 内的选区应用、取消、跨 text 切换、collapsed 后续输入继承和 active 状态读取。切换 underline 不会移除已有 bold、italic 或 strike。

`underlineCommand` 已加入默认 command registry，demo 操作区可通过“下划线”按钮调用，并会记录 history。

## Strike Command

`strikeCommand` 通过 `toggle_mark` 切换 `strike`。

```ts
const STRIKE_COMMAND_NAME = "strike";

const strikeCommand: Command;
```

执行规则与其他 boolean mark command 一致，支持同一 paragraph 内的选区应用、取消、跨 text 切换、collapsed 后续输入继承和 active 状态读取。切换 strike 不会移除已有 bold、italic 或 underline。

`strikeCommand` 已加入默认 command registry，demo 操作区可通过“删除线”按钮调用，并会记录 history。

## 快捷键占位

`DEFAULT_COMMAND_SHORTCUTS` 当前预留三组跨平台主修饰键映射：

- Ctrl/Meta + B：`boldCommand`。
- Ctrl/Meta + I：`italicCommand`。
- Ctrl/Meta + U：`underlineCommand`。

`getCommandShortcuts` 可以按 command name 查询配置，`getCommandNameFromShortcut` 可以把键盘输入匹配为 command name。当前不会在 React 组件中自动绑定或执行这些快捷键，Strike 也没有默认映射；宿主可以传入自定义表扩展。

## 通用 Mark Command

`createTextMarkCommand`、`canExecuteTextMarkCommand` 和 `isTextMarkCommandActive` 已作为公共 API 导出。后续新增文字 mark 时可以复用相同的选区校验、transaction 创建和 active 状态计算。

## 渲染

renderer 遇到 text marks 时会根据标记输出内联元素，并继续保留 `data-crucialy-path`，因此 DOM 与模型选区映射仍能定位到同一个 text path：

- `marks.bold === true` 输出 `<strong>`。
- `marks.italic === true` 输出 `<em>`。
- `marks.underline === true` 输出 `<u>`。
- `marks.strike === true` 输出 `<s>`。
- `bold + italic` 组合输出 `<strong style="font-style: italic;">`，保持 text path 元素下仍是直接文本节点，便于当前 DOM 映射逻辑复用。
- underline 与 bold/italic 叠加时通过同一个 text path 元素的 `text-decoration: underline;` 表达，避免嵌套模型路径元素。
- strike 与其他 mark 叠加时通过同一个 text path 元素的 `text-decoration: line-through;` 表达。
- underline 与 strike 同时启用时合并为 `text-decoration: underline line-through;`，避免装饰属性互相覆盖。

Demo 的“文字标记”样例覆盖普通、加粗、斜体、下划线、删除线、四种组合格式和跨 text 选区。四个 mark 按钮通过 `aria-pressed` 同步当前 active 状态。

## 当前限制

- 暂未实现编辑器内置 toolbar；当前只有 demo 操作区按钮。
- 快捷键当前只提供映射与查询，不包含编辑器事件绑定。
- 暂未实现跨 paragraph 的 mark 应用策略。
