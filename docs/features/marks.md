# 文字标记模型

文字标记用于描述 text 节点上的内联格式。当前阶段完成第 9 周 Day 1 的模型基础，只处理数据结构、helper、校验、规范化、operation 保留和 history 快照保留。

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

## 当前限制

- 暂未实现 `boldCommand`、`italicCommand` 或 mark command 状态读取。
- 暂未实现 toolbar/demo 按钮。
- renderer 暂未根据 marks 输出 `<strong>` 或 `<em>`。
- 暂未实现跨 text/range 的 mark 拆分、合并和统一格式应用。
