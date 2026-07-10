# Command 系统（第一版）

Command 系统负责把“可执行的编辑意图”包装成统一接口。当前阶段只提供注册、查询、可执行判断和按名称执行，不包含具体文本编辑 command。

## 当前范围

- 定义 `CommandContext`，承载当前文档模型和可选模型选区。
- 定义 `CommandInput`，把 context 和可选 payload 传给 command。
- 定义 `CommandResult`，统一表达成功、失败和不可执行。
- 提供 `createCommandRegistry` 注册和查询 command。
- 提供 `canExecuteCommand` 判断 command 是否可执行。
- 提供 `executeCommand` 按名称执行 command。

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
```

## 执行规则

- command 未注册时，`executeCommand` 返回 `failure`。
- command 没有 `canExecute` 时，默认可执行。
- `canExecute` 返回 `false` 时，`executeCommand` 返回 `skipped`。
- command 执行抛错时，`executeCommand` 返回 `failure` 并带上错误原因。
- command 成功时由具体 command 返回 `success` 结果。

## 当前限制

- 尚未内置文本编辑、删除、分段或合并 command。
- 当前没有 command 分组、快捷键绑定或权限系统。
- 当前没有 history、undo/redo 或批量 command pipeline。
