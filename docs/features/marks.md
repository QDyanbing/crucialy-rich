# 文字标记模型

文字标记用于描述 text 节点上的内联格式。当前阶段完成第 9 周 Day 1「Mark 机制」和 Day 2「Bold」第一版，覆盖数据结构、helper、校验、规范化、`toggle_mark` operation、`boldCommand`、renderer 加粗输出、operation 保留和 history 快照保留。

## 数据结构

当前支持两个 text mark：

- `bold`：加粗。
- `italic`：斜体。

```ts
const TEXT_MARK_TYPES = ["bold", "italic"] as const;

type TextMarkType = "bold" | "italic";
type TextMarks = Partial<Record<TextMarkType, true>>;

interface TextNode {
  type: "text";
  text: string;
  marks?: TextMarks;
}
```

`marks` 只记录启用状态，值固定为 `true`；未启用的 mark 不写入节点。

## Helper

当前公开 helper：

- `normalizeTextMarks(value)`：只保留受支持且值为 `true` 的 mark。
- `hasTextMark(marks, mark)`：判断 mark 是否启用。
- `addTextMark(marks, mark)`：返回启用指定 mark 后的新对象。
- `removeTextMark(marks, mark)`：返回移除指定 mark 后的新对象；没有剩余 mark 时返回 `undefined`。
- `toggleTextMark(marks, mark)`：按当前状态切换指定 mark。
- `areTextMarksEqual(left, right)`：比较两个 mark 集合的启用状态。

## 校验与规范化

`validateDocument` 增加 text marks 校验：

- `marks` 省略时合法。
- `marks` 必须是普通对象。
- key 只能是 `bold` 或 `italic`。
- value 必须是 `true`。

`normalizeDocument` 会保留合法 mark，并丢弃未知 mark、非 `true` mark 和空 mark 集合。规范化后的文档仍能通过 `validateDocument`。

## 编辑保留

当前 text operation 的 mark 保留契约：

- `insert_text` 修改 text 内容时保留原 text 节点 marks。
- `delete_text` 删除 text 内容时保留原 text 节点 marks。
- `split_block` 拆分 text 节点时左右两侧继承原 marks。
- `merge_block` 合并 paragraph 时保留两段中原有 text 节点 marks。

History snapshot 现在会深拷贝 text marks，撤销/重做记录不会丢失已有格式数据。

## Toggle Mark Operation

`toggle_mark` 用于在同一个 text 节点范围内切换 mark。

```ts
interface ToggleMarkOperation {
  type: "toggle_mark";
  mark: TextMarkType;
  range: RangeSelection;
}
```

当前规则：

- range 必须落在同一个 text 节点内。
- 非折叠 range 会把原 text 拆为 before / selected / after 三段，只给 selected 切换 mark。
- collapsed range 会在光标处创建一个空 text 节点，并把切换后的 marks 写到该空节点上。
- collapsed 后续输入会插入到该空 text 节点内，从而继承 mark。
- 当前不会合并相邻同 marks 的 text 节点，合并策略留到 Mark 切分和合并阶段。

## Bold Command

`boldCommand` 通过 `toggle_mark` 切换 `bold`。

```ts
const BOLD_COMMAND_NAME = "bold";

const boldCommand: Command;
```

执行规则：

- selection 必须存在。
- anchor 和 focus 必须都指向合法 text point。
- 当前只支持同一个 text 节点内的 selection。
- 成功时返回包含 `toggle_mark` 的 transaction。
- `queryCommandState` 会通过 `isActive` 返回当前 selection 所在 text 节点是否已经加粗。

`boldCommand` 已加入默认 command registry，demo 操作区可通过“加粗”按钮调用，并会记录 history。

## 渲染

renderer 遇到 `marks.bold === true` 的 text 节点时输出 `<strong>`，并继续保留 `data-crucialy-path`，因此 DOM 与模型选区映射仍能定位到同一个 text path。

## 当前限制

- 暂未实现 `italicCommand`。
- 暂未实现编辑器内置 toolbar；当前只有 demo 操作区按钮。
- renderer 暂未根据 italic 输出 `<em>`。
- 暂未实现跨 text/range 的 mark 拆分、合并和统一格式应用。
