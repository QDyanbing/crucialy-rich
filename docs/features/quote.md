# Quote 引用块

第 13 周 Day 3 已完成 Quote 第一版，第 13 周 Day 4 已补齐多块切换边界：模型使用 `QuoteNode` 表达引用块，renderer 输出语义化 `blockquote`，`toggleQuote` command 负责切换引用和恢复正文。

## 模型与渲染

Quote 与 paragraph、heading 使用相同的 text children 结构：

```ts
interface QuoteNode {
  type: "quote";
  children: TextNode[];
}
```

`renderDocument` 把 Quote 渲染为 `blockquote`。块类型切换和渲染都保留 text children、marks、block path 与 text path，因此已有 DOM 映射和浏览器选区同步可以继续复用。

## Command API

```ts
const TOGGLE_QUOTE_COMMAND_NAME = "toggleQuote";

const toggleQuoteCommand: Command;
```

- 选中范围存在非 Quote block 时，command 把全部命中 block 统一切换为 Quote。
- 全部命中 block 都是 Quote 时，command 把它们统一恢复为 paragraph。
- `canExecuteToggleQuoteCommand(input)` 检查选区两个端点是否都是合法模型位置。
- `isQuoteCommandActive(input)` 仅在全部命中 block 都是 Quote 时返回 `true`。
- `toggleQuoteCommand` 已进入 `DEFAULT_COMMANDS`。

示例：

```ts
const result = executeCommand(registry, TOGGLE_QUOTE_COMMAND_NAME, {
  context: { document, selection },
});
```

成功结果包含一个 `set_block_type` transaction，每个命中 block 对应一条 operation，并克隆保留原模型选区。

## 输入行为

- Quote 内普通输入复用现有 `insertTextCommand`，块类型保持 Quote。
- Quote 内 Backspace/Delete 的字符删除复用现有文本 operation，不改变块类型。
- Quote 内按 Enter 使用 `split_block`，左右两个 block 都继承 Quote 类型。
- 在拆分后的新 Quote 中可以继续输入，模型仍可通过校验。
- block 合并沿用当前规则：结果保留前一个 block 的类型。

当前没有“空引用按 Enter 自动退出”等额外编辑器策略；这类产品行为将在后续输入规则阶段单独设计。

## 选区规则

- collapsed selection、单块 range 和跨 block range 均可切换。
- anchor、focus 必须是合法模型位置；两个端点所在 block 及其中间 block 都会命中。
- operation 按文档顺序生成，反向 selection 的 anchor/focus 方向保持不变。
- 无选区或非法选区返回 `skipped`。
- 完整约束见[多块 Block Type 切换规则](./block-type-boundaries.md)。

## Demo 与验收

Demo 的“引用块”样例包含 Quote 和普通正文，操作区提供带 active 状态的“引用”按钮。浏览器验收覆盖：

- Quote 渲染为 `blockquote`。
- 引用按钮可切换 Quote 和 paragraph。
- Quote 内可以输入和删除文字。
- Quote 内 Enter 生成两个 Quote，并可在新块继续输入。
- 跨段选区可以统一开启或取消 Quote，文字和模型选区保持稳定。
- 整个操作过程中文档模型保持合法。

对应自动化测试：

- `packages/core/tests/command/quote.test.ts`
- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/core/tests/command/state.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前边界

- 当前没有 Quote 快捷键；宿主可以通过 command API 自行绑定工具栏或键盘入口。
