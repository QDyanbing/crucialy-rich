# Operation（第一版）

Operation 用于描述一次对文档模型的可复现修改。Transaction 用于把多个 operation 按顺序组合为一次批量模型变更。

当前阶段已经实现 `insert_text`、`delete_text`、`toggle_mark`、`set_mark_attribute`、`set_link`、`set_block_type`、`split_block`、`merge_block` 和第一版 transaction。

## 操作类型

```ts
interface InsertTextOperation {
  type: "insert_text";
  point: Point;
  text: string;
}

interface DeleteTextOperation {
  type: "delete_text";
  range: RangeSelection;
}

interface ToggleMarkOperation {
  type: "toggle_mark";
  mark: TextMarkType;
  range: RangeSelection;
}

interface SetMarkAttributeOperation {
  type: "set_mark_attribute";
  attribute: TextMarkAttributeType;
  value: number | string | null;
  range: RangeSelection;
}

interface SetLinkOperation {
  type: "set_link";
  link: LinkMarkAttributes | null;
  range: RangeSelection;
}

type BlockTypeSpec =
  | { type: "paragraph" }
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6 }
  | { type: "quote" };

interface SetBlockTypeOperation {
  type: "set_block_type";
  path: Path;
  block: BlockTypeSpec;
}

interface SplitBlockOperation {
  type: "split_block";
  point: Point;
}

interface MergeBlockOperation {
  type: "merge_block";
  point: Point;
}

interface Transaction {
  operations: Operation[];
}

interface TransactionAcceptanceReport {
  before: ValidationResult;
  after: ValidationResult | null;
  transaction: TransactionSummary;
  ok: boolean;
  error: string | null;
}
```

字段说明：

- `type`：当前支持 `insert_text`、`delete_text`、`toggle_mark`、`set_mark_attribute`、`set_link`、`set_block_type`、`split_block` 和 `merge_block`。
- `point`：插入、分段或合并位置，必须指向 text 节点内的合法偏移。
- `text`：要插入的文本。
- `range`：删除范围当前必须落在同一个 text 节点内；mark 范围当前必须落在同一个 paragraph 内。
- `mark`：要切换的 text mark，当前用于 `toggle_mark`。
- `attribute` / `value`：要设置的属性 Mark 和新值；`null` 表示移除属性。
- `link`：要设置的 Link Mark；`null` 表示取消链接。
- `path` / `block`：要切换的顶层 block path 和目标 Block Type。
- `operations`：transaction 中按顺序执行的 operation 列表。
- `TransactionSummary`：transaction 的只读摘要，包含操作总数、操作类型顺序、文本操作数量和块级操作数量。
- `TransactionAcceptanceReport`：transaction 闭环验收报告，包含执行前校验、执行后校验、事务摘要和失败错误。

## 创建插入操作

使用 `createInsertTextOperation(point, text)` 创建操作。

创建时会复制 `point.path`，避免外部数组后续修改影响 operation。

## 应用插入操作

使用 `applyInsertText(document, operation)` 返回插入后的新文档。

当前规则：

- 支持 text 节点段首、段中和段尾插入。
- 不会修改传入的原始文档对象。
- `text` 为空字符串时返回原文档引用。
- `point` 不指向 text 节点或 offset 越界时抛出 `RangeError`。

## 创建删除操作

使用 `createDeleteTextOperation(range)` 创建操作。

创建时会复制 anchor/focus 的 path，避免外部数组后续修改影响 operation。

## 应用删除操作

使用 `applyDeleteText(document, operation)` 返回删除后的新文档。

当前规则：

- 支持同一个 text 节点内的段首、段中和段尾删除。
- 支持反向 range，会先规范化为正向 range。
- 不会修改传入的原始文档对象。
- 折叠 range 返回原文档引用。
- range 任一点不指向 text 节点、offset 越界或跨 text 节点时抛出 `RangeError`。

## 创建和应用属性 Mark 操作

使用 `createSetMarkAttributeOperation(range, attribute, value)` 创建操作，使用 `applySetMarkAttribute(document, operation)` 返回更新后的新文档。

当前规则：

- range 必须落在同一个 paragraph 内，支持跨多个 text 节点和反向选区。
- 非折叠 range 会按边界切分 text，只更新选中部分，并合并相邻同 marks 节点。
- collapsed range 会创建带目标属性的空 text，后续输入可继承属性。
- `value: null` 会移除目标属性，同时保留其他 mark。
- 非法属性值、非法 point 或跨 paragraph range 会抛出 `RangeError`。
- `createSelectionAfterSetMarkAttribute` 会在切分和合并后重新映射选区。

## 创建和应用 Block Type 操作

使用 `createSetBlockTypeOperation(path, block)` 创建操作，使用 `applySetBlockType(document, operation)` 返回更新后的文档。

当前规则：

- path 必须是精确指向顶层 block 的 `[blockIndex]`。
- 支持 paragraph、heading 和 quote 互相切换，以及 heading level 更新。
- 切换保留目标 block 的 children、文本和 marks。
- 目标类型未改变时返回原文档引用；heading 还要求 level 相同。
- 创建和应用阶段都会校验目标类型，应用阶段会再次校验 path。
- operation 已进入 Transaction 克隆、执行、block 作用域分类和验收报告。

完整模型协议与阶段边界见 [Block Type 设计](./block-type.md)。

## 创建分段操作

使用 `createSplitBlockOperation(point)` 创建操作。

创建时会复制 `point.path`，避免外部数组后续修改影响 operation。

## 应用分段操作

使用 `applySplitBlock(document, operation)` 返回分段后的新文档。

当前规则：

- 支持在 text 节点段首、段中和段尾分段。
- 支持 paragraph 内有多个 text 节点，分段点左侧留在原 paragraph，右侧进入新 paragraph。
- 不会修改传入的原始文档对象。
- `point` 不指向 text 节点或 offset 越界时抛出 `RangeError`。

## 创建合并操作

使用 `createMergeBlockOperation(point)` 创建操作。

创建时会复制 `point.path`，避免外部数组后续修改影响 operation。

## 应用合并操作

使用 `applyMergeBlock(document, operation)` 返回合并后的新文档。

当前规则：

- 当前 paragraph 合并到前一个 paragraph。
- `point` 必须位于非首段第一个 text 节点的 offset `0`。
- 空 paragraph 与非空 paragraph 合并时，会去掉无意义的空 text。
- 两个空 paragraph 合并后保留一个空 text，保证 paragraph 可继续表达光标位置。
- 不会修改传入的原始文档对象。
- 首段、非段首 point 或非法 point 会抛出 `RangeError`。

## 创建 Transaction

使用 `createTransaction(operations)` 创建 transaction。

创建时会复制 operation 内部的 path，避免外部数组后续修改影响 transaction。

## 应用 Operation

使用 `applyOperation(document, operation)` 应用单个 operation。

当前会按 `operation.type` 分发到：

- `applyInsertText`
- `applyDeleteText`
- `applyToggleMark`
- `applySetMarkAttribute`
- `applySetLink`
- `applySetBlockType`
- `applySplitBlock`
- `applyMergeBlock`

## 应用 Transaction

使用 `applyTransaction(document, transaction)` 按顺序应用一组 operation。

当前规则：

- operation 会按数组顺序依次执行。
- transaction 结束后会统一执行 `normalizeDocument`。
- 如果中途某个 operation 抛错，`applyTransaction` 会继续向外抛错。
- 当前 operation 都按不可变方式返回新文档，失败不会修改传入的原始文档。

## 摘要和闭环验收

使用 `summarizeOperation(operation)` 获取单个 operation 的只读摘要。

当前摘要包含：

- `type`：operation 类型。
- `scope`：`text` 或 `block`。
- `targetPath`：operation 作用的模型 path。
- `textLength`：插入或删除涉及的文本长度。
- `collapsedRange`：删除 range 是否折叠。
- `blockType` / `headingLevel`：Block Type 切换的目标类型和可选标题层级。

使用 `summarizeTransaction(transaction)` 获取 transaction 摘要。

当前摘要包含：

- `operationCount`：operation 总数。
- `operationTypes`：按执行顺序记录的 operation 类型。
- `textOperationCount`：文本操作数量。
- `blockOperationCount`：块级操作数量。
- `hasTextOperations` / `hasBlockOperations`：是否包含对应作用域。

使用 `createTransactionAcceptanceReport(document, transaction)` 生成闭环验收报告。

当前规则：

- 先校验执行前文档。
- 尝试通过 `applyTransaction` 应用 transaction。
- 成功后校验执行后文档，并给出 `ok`。
- 失败时保留错误信息，`after` 为 `null`。
- 报告只用于调试和验收，不替代真实编辑命令。

## 插入后的选区

使用 `createSelectionAfterInsertText(operation)` 计算插入后的折叠选区。

规则：

- path 保持为插入点 path。
- offset 前进 `text.length`。
- anchor 和 focus 落在同一点。

## 删除后的选区

使用 `createSelectionAfterDeleteText(operation)` 计算删除后的折叠选区。

规则：

- 先规范化 range。
- path 保持为删除范围起点 path。
- offset 保持为删除范围起点 offset。
- anchor 和 focus 落在同一点。

## 分段后的选区

使用 `createSelectionAfterSplitBlock(operation)` 计算分段后的折叠选区。

规则：

- path 落到新 paragraph 的第一个 text 节点。
- offset 为 `0`。
- anchor 和 focus 落在同一点。

## 合并后的选区

使用 `createSelectionAfterMergeBlock(document, operation)` 计算合并后的折叠选区。

规则：

- path 落到原前一个 paragraph 的最后一个 text 节点。
- offset 落在原前一个 paragraph 的末尾。
- 前一个 paragraph 为空时，offset 为 `0`。
- anchor 和 focus 落在同一点。

## 演示调试入口

演示页的文档调试面板提供：

- 插入文本输入框。
- “插入”按钮。
- “删除选区”按钮。
- “分段”按钮。
- “合并段落”按钮。
- 最近 transaction JSON。
- 最近 transaction 验收报告。
- 插入、删除、分段或合并会通过 transaction 更新文档 JSON 和渲染预览。
- 操作后选区 JSON 会同步到对应的落点。

## 当前限制

- 当前实现 `insert_text`、同 text 节点内的 `delete_text`、同 paragraph 内的 `toggle_mark`、`set_mark_attribute` 和 `set_link`、单个顶层 block 的 `set_block_type`，以及 block 级 `split_block` 和 `merge_block`。
- 插入非折叠选区时不会自动删除选中内容，当前插入点取 selection anchor。
- 删除暂不支持跨 text 节点或跨 paragraph 范围。
- 合并暂不支持跨多段批量合并。
- 单条 `set_block_type` 仍只处理一个顶层 block；Heading/Quote command 已能在同一 transaction 中组合多条 operation 完成跨块切换，语义 renderer 已支持 `h1`–`h6` 与 `blockquote`。
- transaction 当前只负责批量应用和结束 normalize；History 已使用快照策略提供撤销/重做，operation 层本身暂不生成 undo/redo inverse 信息。
- text operation 会保留现有 text marks；`toggle_mark` 和 `set_mark_attribute` 已支持同 paragraph 内跨 text 切分与相邻同 marks 合并，跨 paragraph mark 范围留到后续阶段。
- 普通 `beforeinput insertText`、collapsed selection 下的 Backspace、collapsed selection 下的 Delete 和 collapsed selection 下的 Enter 已接入输入事件管线，并复用当前 operation/transaction 更新模型。
