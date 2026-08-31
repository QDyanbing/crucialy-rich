# Heading 标题

第 13 周 Day 2 已完成 Heading 第一版，第 13 周 Day 4 已补齐多块切换边界：模型支持 1–6 级标题，renderer 输出语义化 `h1`–`h6`，`setHeading` command 负责标题层级切换和恢复正文。

## 模型与渲染

标题节点直接保存层级和 text children：

```ts
interface HeadingNode {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: TextNode[];
}
```

`renderDocument` 按 `level` 映射到同级 HTML 标签。标题外壳变化不会改变 text children、marks 或 `data-crucialy-path`，因此现有 DOM 映射和浏览器选区同步可以继续复用。

## Command API

```ts
const SET_HEADING_COMMAND_NAME = "setHeading";

interface SetHeadingCommandPayload {
  level: 1 | 2 | 3 | 4 | 5 | 6 | null;
}
```

- `level: 1`–`6`：把选区覆盖的全部 block 设为对应标题层级。
- `level: null`：把选区覆盖的全部 block 恢复为 paragraph。
- `canExecuteSetHeadingCommand(input)`：检查 payload、选区和 block 范围是否合法。
- `getSelectedHeadingLevel(input)`：全部选中 block 为同级标题时返回该层级；混合状态返回 `null`，非法选区返回 `undefined`。
- `isHeadingCommandActive(input)`：判断全部选中 block 是否与 payload 指定目标一致。
- `setHeadingCommand` 已进入 `DEFAULT_COMMANDS`。

示例：

```ts
const result = executeCommand(registry, SET_HEADING_COMMAND_NAME, {
  context: { document, selection },
  payload: { level: 2 },
});

const paragraphResult = executeCommand(registry, SET_HEADING_COMMAND_NAME, {
  context: { document, selection },
  payload: { level: null },
});
```

成功结果包含一个 `set_block_type` transaction，每个命中 block 对应一条 operation，并克隆保留原模型选区。应用 transaction 后可以继续执行文本输入命令。

## 选区规则

- collapsed selection、单块 range 和跨 block range 均可执行。
- anchor、focus 必须是合法模型位置；两个端点所在 block 及其中间 block 都会命中。
- operation 按文档顺序生成，反向 selection 的 anchor/focus 方向保持不变。
- 非法层级、缺失 payload、无选区或非法选区返回 `skipped`。
- 完整约束见[多块 Block Type 切换规则](./block-type-boundaries.md)。

## Demo 与验收

Demo 的“标题层级”样例包含一级到六级标题和正文，操作区提供“正文”和 1–6 级标题选择器。引用或混合类型选区会显示不可选的“引用或混合”状态，用户仍可从中直接选择“正文”或任一标题层级。浏览器验收覆盖：

- 六个模型层级分别渲染为 `h1`–`h6`。
- 标题可以切换到其他层级。
- 切换后可继续输入文字。
- 标题可以恢复为 paragraph。
- 跨段选区可以统一切换到同一标题层级，文字和模型选区保持稳定。
- 引用或混合类型选区不会冒充正文，并可直接统一恢复为 paragraph。

对应自动化测试：

- `packages/core/tests/command/heading.test.ts`
- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/core/tests/command/state.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前边界

- Quote command 与 `blockquote` 语义渲染已在第 13 周 Day 3 完成，详见 [Quote 引用块](./quote.md)。
- 当前没有标题快捷键；宿主可以通过 command API 自行绑定工具栏或键盘入口。
