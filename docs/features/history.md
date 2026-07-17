# History 数据结构（第一版）

History 模块负责记录可撤销编辑的前后快照。当前阶段采用快照策略，不先生成 operation inverse。

## 当前范围

- 定义 `HistorySnapshot`，保存文档模型和可选 selection。
- 定义 `HistoryEntry`，保存一次 transaction 的 before、after、transaction 和可选 batch 标记。
- 定义 `HistoryState`，包含 undoStack 和 redoStack。
- 提供 `createHistorySnapshot` 克隆文档和 selection。
- 提供 `createHistoryState` 创建 history 状态。
- 提供 `clearHistory` 清空 history 状态。
- 提供 `recordHistory` 把非空 transaction 记录到 undoStack，并清空 redoStack。
- 提供 `canUndo`、`canRedo`、`getUndoEntry`、`getRedoEntry` 读取 history 状态。

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

function createHistorySnapshot(
  document: DocumentNode,
  selection?: RangeSelection,
): HistorySnapshot;

function createHistoryState(
  undoStack?: HistoryEntry[],
  redoStack?: HistoryEntry[],
): HistoryState;

function clearHistory(): HistoryState;

function recordHistory(input: RecordHistoryInput): HistoryState;

function canUndo(history: HistoryState): boolean;

function canRedo(history: HistoryState): boolean;

function getUndoEntry(history: HistoryState): HistoryEntry | undefined;

function getRedoEntry(history: HistoryState): HistoryEntry | undefined;
```

## 记录规则

- history entry 使用 before/after 快照记录文档和 selection。
- 快照创建时会复制 document 和 selection，避免外部对象后续修改污染 history。
- `recordHistory` 只记录非空 transaction。
- 记录新的 transaction 后会清空 redoStack。
- batch 是可选字符串，后续用于连续输入合并策略。

## 当前限制

- 当前只完成 history 数据结构和记录入口。
- 暂未实现 `undoCommand`、`redoCommand` 或 React 按钮。
- 暂未实现连续输入合并策略。
- 当前快照克隆只覆盖现有 document -> paragraph -> text 模型；后续 marks、attrs、heading 等扩展时需要同步扩展克隆规则。

## 验收

- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/history/state.test.ts`
- `packages/core/tests/history/record.test.ts`
- `packages/core/tests/history/query.test.ts`
- `packages/core/tests/public-api.test.ts`
