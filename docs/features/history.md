# History 记录与撤销重做

History 模块负责记录可撤销编辑的前后快照，并提供基于快照的撤销、重做状态转换。当前阶段采用快照策略，不先生成 operation inverse。

## 当前范围

- 定义 `HistorySnapshot`，保存文档模型和可选 selection。
- 定义 `HistoryEntry`，保存一次 transaction 的 before、after、transaction 和可选 batch 标记。
- 定义 `HistoryState`，包含 undoStack 和 redoStack。
- 定义 `HistoryChange`，描述一次撤销或重做后的文档、selection、entry 和新 history 状态。
- 提供 `createHistorySnapshot` 克隆文档和 selection。
- 提供 `createHistoryEntry`、`cloneHistoryEntry` 统一创建和复制 history entry。
- 提供 `createHistoryState` 创建 history 状态。
- 提供 `clearHistory` 清空 history 状态。
- 提供 `recordHistory` 把非空 transaction 记录到 undoStack，并清空 redoStack。
- 提供 `canMergeHistoryEntries`、`mergeHistoryEntries`，用于按 batch 合并连续输入。
- 提供 `canUndo`、`canRedo`、`getUndoEntry`、`getRedoEntry` 读取 history 状态。
- 提供 `undoHistory`、`redoHistory` 执行栈迁移，并返回需要应用到编辑器的快照结果。
- 提供 `undoCommand`、`redoCommand`，用于通过 command 管道触发撤销和重做。
- 提供 `getHistoryShortcutAction`，用于把键盘事件识别为 undo 或 redo。
- React 组件通过 `onTransaction` 暴露真实输入 transaction，演示页会把按钮命令和真实输入都记录到 history。
- 演示页操作区提供“撤销”和“重做”按钮，主编辑器支持撤销/重做快捷键，并展示 undoStack/redoStack 长度。

## Core API

```ts
interface HistorySnapshot {
  document: DocumentNode;
  selection?: RangeSelection;
}

interface HistoryEntry {
  after: HistorySnapshot;
  batch?: string;
  before: HistorySnapshot;
  transaction: Transaction;
}

interface HistoryState {
  redoStack: HistoryEntry[];
  undoStack: HistoryEntry[];
}

interface HistoryChange {
  document: DocumentNode;
  entry: HistoryEntry;
  history: HistoryState;
  selection?: RangeSelection;
}

function createHistorySnapshot(
  document: DocumentNode,
  selection?: RangeSelection,
): HistorySnapshot;

function createHistoryEntry(input: RecordHistoryInput): HistoryEntry;

function cloneHistoryEntry(entry: HistoryEntry): HistoryEntry;

function createHistoryState(
  undoStack?: HistoryEntry[],
  redoStack?: HistoryEntry[],
): HistoryState;

function clearHistory(): HistoryState;

function recordHistory(input: RecordHistoryInput): HistoryState;

function canMergeHistoryEntries(
  previous: HistoryEntry | undefined,
  next: HistoryEntry,
): previous is HistoryEntry;

function mergeHistoryEntries(previous: HistoryEntry, next: HistoryEntry): HistoryEntry;

function canUndo(history: HistoryState): boolean;

function canRedo(history: HistoryState): boolean;

function getUndoEntry(history: HistoryState): HistoryEntry | undefined;

function getRedoEntry(history: HistoryState): HistoryEntry | undefined;

function undoHistory(history: HistoryState): HistoryChange | undefined;

function redoHistory(history: HistoryState): HistoryChange | undefined;

type HistoryShortcutAction = "redo" | "undo";

interface HistoryShortcutInput {
  altKey?: boolean;
  code?: string;
  ctrlKey?: boolean;
  isComposing?: boolean;
  key: string;
  metaKey?: boolean;
  shiftKey?: boolean;
}

function getHistoryShortcutAction(
  input: HistoryShortcutInput,
): HistoryShortcutAction | undefined;

const undoCommand: Command;

const redoCommand: Command;
```

## 记录规则

- history entry 使用 before/after 快照记录文档和 selection。
- 快照创建时会复制 document 和 selection，避免外部对象后续修改污染 history。
- `recordHistory` 只记录非空 transaction。
- 记录新的 transaction 后会清空 redoStack。
- batch 是可选字符串；相同非空 batch 的连续记录会合并为一个 history entry。
- 当前 React 普通文本输入会使用 `typing` batch；Enter、Backspace、Delete 和 demo 按钮命令默认保持独立 history entry。

## 撤销与重做规则

- `undoHistory` 读取 undoStack 栈顶 entry，返回 entry.before 的文档和 selection。
- `undoHistory` 会把栈顶 entry 从 undoStack 移到 redoStack。
- `redoHistory` 读取 redoStack 栈顶 entry，返回 entry.after 的文档和 selection。
- `redoHistory` 会把栈顶 entry 从 redoStack 移回 undoStack。
- 返回的 entry、document、selection 和栈内容都会复制，避免调用方修改污染 history。
- `undoCommand`、`redoCommand` 需要 payload 中传入 `{ history }`，成功时返回 `document`、`history` 和可选 `selection`。

## 快捷键规则

- `getHistoryShortcutAction` 将 Ctrl/Meta + Z 识别为 `undo`。
- `getHistoryShortcutAction` 将 Ctrl/Meta + Shift + Z 识别为 `redo`。
- `getHistoryShortcutAction` 将 Ctrl/Meta + Y 识别为 `redo`。
- Alt 组合、普通按键和 composition 期间的按键不会触发 history action。
- React 组件不内置 history 状态；demo 通过外部 `onKeyDown` 调用 `getHistoryShortcutAction`，并在识别到 history 快捷键后阻止浏览器默认 contenteditable 行为。

## 当前限制

- 暂未实现按时间间隔、选区跳变或输入类型细分的复杂合并策略。
- 当前快照克隆覆盖 document -> paragraph -> text 和 text marks；后续 attrs、heading 等扩展时需要同步扩展克隆规则。

## 验收

- `packages/core/tests/history/entry.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/history/state.test.ts`
- `packages/core/tests/history/record.test.ts`
- `packages/core/tests/history/merge.test.ts`
- `packages/core/tests/history/query.test.ts`
- `packages/core/tests/history/undo.test.ts`
- `packages/core/tests/history/redo.test.ts`
- `packages/core/tests/history/shortcut.test.ts`
- `packages/core/tests/history/command.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`
