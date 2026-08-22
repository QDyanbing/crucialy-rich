# Link Mark

Link Mark 用于描述 text 节点上的链接目标。第 12 周 Day 2 已完成模型、安全校验、`set_link` operation、设置/取消 command 和 demo 输入入口；`<a>` 渲染及编辑态交互留到 Day 3。

## 数据结构

```ts
const LINK_TARGETS = ["_self", "_blank"] as const;
const LINK_REL_TOKENS = ["nofollow", "noopener", "noreferrer"] as const;

interface LinkMarkAttributes {
  href: string;
  rel?: string;
  target?: "_self" | "_blank";
}

interface TextMarks {
  link?: LinkMarkAttributes;
}
```

`link` 是独立的结构化 mark，不属于 `TEXT_MARK_ATTRIBUTE_TYPES`。字号和颜色继续使用标量属性 operation，链接使用专用 `set_link` operation 原子维护完整对象。

## Href 安全规则

`sanitizeLinkHref(value)` 使用 URL parser 校验并规范化绝对 URL：

- 允许 `http:`、`https:` 和 `mailto:`。
- 去除首尾空白，并返回 URL parser 规范化后的 href。
- `mailto:` 必须包含非空地址部分。
- 拒绝 `javascript:`、`data:`、`ftp:`、相对路径、缺失协议、控制字符、空值和畸形 URL。

当前不接受相对 URL。需要站内相对链接时，应在后续明确 base URL 与序列化契约后再扩展。

## Target 与 Rel

- `normalizeLinkTarget(value)` 只接受 `_self` 和 `_blank`，忽略大小写与首尾空白。
- `normalizeLinkRel(value)` 只接受 `nofollow`、`noopener`、`noreferrer`。
- rel token 会转小写、去重，并按固定顺序输出。
- rel 中出现任意未知 token 时，整个 rel 值视为无效。

## Link Mark 规范化

`normalizeLinkMark(value)` 的行为：

- href 非法时丢弃整个 Link Mark。
- href 合法时保留规范化 href。
- 非法或缺失的可选 target / rel 会被省略。
- 未知字段不会进入规范化结果。

`validateDocument` 对原始输入更严格：未知字段、非法 target、非法 rel 或不安全 href 都会产生带 text 节点路径的错误。调用 `normalizeDocument` 后，这些输入会被修复或移除，结果仍能通过校验。

## 公共 Helper

- `normalizeLinkMark(value)`：规范化完整 Link Mark。
- `isValidLinkMark(value)`：校验原始 Link Mark 是否满足模型约束。
- `areLinkMarksEqual(left, right)`：比较规范化后的 href、target 和 rel。
- `getLinkMark(marks)`：读取规范化 Link Mark。
- `setLinkMark(marks, link)`：设置链接并保留其他 marks。
- `removeLinkMark(marks)`：移除链接并保留其他 marks。

## Operation API

`createSetLinkOperation(range, link)` 创建 `set_link` operation：

```ts
interface SetLinkOperation {
  type: "set_link";
  range: RangeSelection;
  link: LinkMarkAttributes | null;
}
```

- 传入 Link Mark 时会先规范化，危险 href 会抛出 `RangeError`。
- 传入 `null` 会取消选区内的链接。
- 支持同一 paragraph 内跨多个 text 节点设置、覆盖和取消。
- 只修改选区覆盖的文字，并保留 boolean mark、字号和颜色。
- `applySetLink` 会再次校验手工构造的 operation，不能绕过 href 安全规则。
- `createSelectionAfterSetLink` 会在节点切分或合并后返回等价模型选区。

## Command API

默认 command registry 已注册：

- `SET_LINK_COMMAND_NAME`（`setLink`）：设置或覆盖链接。
- `UNSET_LINK_COMMAND_NAME`（`unsetLink`）：取消链接。
- `setLinkCommand`、`unsetLinkCommand`：可直接注册或执行的 command 实例。
- `canExecuteSetLinkCommand(input)`、`canExecuteUnsetLinkCommand(input)`：读取可执行状态。
- `isLinkCommandActive(input)`：选区覆盖的所有有效文字均有链接时返回 `true`。

设置链接示例：

```ts
executeCommand(registry, SET_LINK_COMMAND_NAME, {
  context: { document, selection },
  payload: {
    href: "https://example.com/docs",
    target: "_blank",
    rel: "noopener noreferrer",
  },
});
```

取消链接示例：

```ts
executeCommand(registry, UNSET_LINK_COMMAND_NAME, {
  context: { document, selection },
});
```

两条命令当前要求非折叠、同一 paragraph 内的有效文字选区。`setLink` 会拒绝不安全 payload；`unsetLink` 仅在选区至少覆盖一个 Link Mark 时可用。成功结果包含 `set_link` transaction 和重映射后的 selection，可直接接入 History。

## Demo 入口

中文 demo 的“链接”弹层可输入 href、打开方式和 rel，并支持设置、覆盖和取消链接。弹层使用当前模型选区执行默认 registry 中的 command；危险协议会使“确认链接”不可用，最近 Transaction、验收报告和文档 JSON 会同步展示结果。

## 编辑保留

- 文本插入、删除和段落拆分会保留 Link Mark。
- boolean mark 与文字属性变更不会移除链接。
- 相邻 text 节点只有在规范化后的 Link Mark 和其他 marks 全部一致时才会合并。
- History snapshot 会深拷贝 Link Mark，避免 href 被外部对象后续修改。

## 当前边界

- renderer 尚未输出 `<a>`，React 编辑器也没有链接点击行为。
- 编辑态与只读态链接交互将在 Day 3 实现。
- 弹层打开前保存浏览器 selection、确认后恢复 selection 的通用机制将在 Day 4 实现；当前 demo 依赖受控模型选区。
