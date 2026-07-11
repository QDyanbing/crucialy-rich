# Command 系统（第一版）

Command 系统负责把“可执行的编辑意图”包装成统一接口。当前阶段提供注册、查询、可执行判断、按名称执行，并内置文本插入和删除选区 command。

## 当前范围

- 定义 `CommandContext`，承载当前文档模型和可选模型选区。
- 定义 `CommandInput`，把 context 和可选 payload 传给 command。
- 定义 `CommandResult`，统一表达成功、失败和不可执行。
- 提供 `createCommandRegistry` 注册和查询 command。
- 提供 `canExecuteCommand` 判断 command 是否可执行。
- 提供 `executeCommand` 按名称执行 command。
- 提供 `insertTextCommand`，支持 collapsed selection 插入文本，也支持同一 text 节点内的 range selection 替换文本。
- 提供 `deleteSelectionCommand`，支持同一 text 节点内的 range selection 删除文本。

## Core API

```ts
interface CommandContext {
  document: DocumentNode;
  selection?: RangeSelection;
}

interface CommandInput<TPayload = undefined> {
  context: CommandContext;
  payload?: TPayload;
}

interface Command {
  name: string;
  canExecute?: (input: CommandInput) => boolean;
  execute: (input: CommandInput) => CommandResult;
}

function createCommandRegistry(commands?: Command[]): CommandRegistry;

function canExecuteCommand(
  registry: CommandRegistry,
  name: string,
  input: CommandInput,
): boolean;

function executeCommand(
  registry: CommandRegistry,
  name: string,
  input: CommandInput,
): CommandResult;

const INSERT_TEXT_COMMAND_NAME = "insertText";

interface InsertTextCommandPayload {
  text: string;
}

const insertTextCommand: Command<InsertTextCommandPayload>;

const DELETE_SELECTION_COMMAND_NAME = "deleteSelection";

const deleteSelectionCommand: Command;
```

## 执行规则

- command 未注册时，`executeCommand` 返回 `failure`。
- command 没有 `canExecute` 时，默认可执行。
- `canExecute` 返回 `false` 时，`executeCommand` 返回 `skipped`。
- command 执行抛错时，`executeCommand` 返回 `failure` 并带上错误原因。
- command 成功时由具体 command 返回 `success` 结果。
- `insertTextCommand` 成功时返回包含 `insert_text` 的 transaction；range selection 下会先生成 `delete_text`，再生成 `insert_text`。
- `deleteSelectionCommand` 成功时返回包含 `delete_text` 的 transaction。
- React 编辑器的普通文本输入会复用 `insertTextCommand`。
- React 编辑器的非折叠 Backspace/Delete 会优先复用 `deleteSelectionCommand`。
- demo 操作区的“插入”和“删除选区”按钮会通过 `executeCommand` 调用文本 command。

## 当前限制

- 暂未内置分段或合并 command。
- 文本 command 当前只处理同一 text 节点内的 range selection。
- 当前没有 command 分组、快捷键绑定或权限系统。
- 当前没有 history、undo/redo 或批量 command pipeline。
