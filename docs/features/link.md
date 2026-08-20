# Link Mark

Link Mark 用于描述 text 节点上的链接目标。第 12 周 Day 1 只完成模型、sanitize、规范化、校验和编辑保留，不包含设置/取消链接 command 或 `<a>` 渲染。

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

`link` 是独立的结构化 mark，不属于 `TEXT_MARK_ATTRIBUTE_TYPES`。字号和颜色继续使用标量属性 operation，链接将在后续使用专用 command 维护完整对象。

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

## 编辑保留

- 文本插入、删除和段落拆分会保留 Link Mark。
- boolean mark 与文字属性变更不会移除链接。
- 相邻 text 节点只有在规范化后的 Link Mark 和其他 marks 全部一致时才会合并。
- History snapshot 会深拷贝 Link Mark，避免 href 被外部对象后续修改。

## 当前边界

- 尚未提供 `setLinkCommand` 或 `unsetLinkCommand`。
- renderer 尚未输出 `<a>`，React 编辑器也没有链接点击行为。
- demo 尚未提供链接输入弹层、编辑入口或只读链接样例。
- selection 保存与恢复将在链接弹层阶段实现。
