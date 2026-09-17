# Markdown 输入规则

Markdown 输入规则在 paragraph 开头识别简短前缀，并通过模型 transaction 把当前块转换为目标结构。

## 默认规则

| 输入前缀         | 目标结构           |
| ---------------- | ------------------ |
| `# `             | 一级标题           |
| `- `             | 无序列表与空列表项 |
| `1. `            | 有序列表与空列表项 |
| `> `             | 引用块             |
| <code>```</code> | 代码块             |

## 触发约束

- 选区必须折叠，并位于顶层 paragraph 的 text 节点内。
- 前缀必须从当前 paragraph 的第一个字符开始，正文中的相同字符不会误触发。
- heading、quote、codeBlock、列表和表格内部不会触发。
- 转换会删除已输入前缀，并把选区移动到新结构的起点。

`findMarkdownInputRule` 只负责匹配，`createMarkdownInputRuleResult` 返回目标规则名、transaction 和转换后的 selection。React 入口在普通文本插入前检查规则，命中后通过 `onTransaction` 输出 `inputType: "insertFromInputRule"`。

结构转换本身是一个 transaction，可由宿主 History 一次撤销；此前已经记录的前缀输入仍遵循原有 History 记录。
