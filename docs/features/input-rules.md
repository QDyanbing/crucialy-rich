# Markdown 输入规则

Markdown 输入规则在 paragraph 开头识别简短前缀，并通过模型 transaction 把当前块转换为目标结构。

## 默认规则

| 输入前缀         | 目标结构         |
| ---------------- | ---------------- |
| `# `             | 一级标题         |
| `- `             | 无序列表与列表项 |
| `1. `            | 有序列表与列表项 |
| `> `             | 引用块           |
| <code>```</code> | 代码块           |

## 触发约束

- 选区必须折叠，并位于顶层 paragraph 的 text 节点内。
- 两端必须是当前文档的合法 Point，data 必须非空；空 data 不会重复转换已有完整前缀。
- 前缀必须从当前 paragraph 的第一个字符开始，正文中的相同字符不会误触发。
- heading、quote、codeBlock、列表和表格内部不会触发。
- 转换会删除已输入前缀，并把选区移动到新结构的起点。

## 已有正文与格式

在已有段落正文前输入前缀时，只消费光标前的已有前缀及本次触发字符，不删除光标后的正文。标题、引用和列表保留后缀的文字、marks 与安全链接；代码块保留文字与换行，并按原有纯文本 schema 去除样式和链接。没有后缀时仍创建空结构。邻段保持原样，源文档不被原地修改，转换后的起点为合法模型 Point。

前缀可跨格式叶子，也可由一次非空文本输入完整提供；这不是新增粘贴解析规则。已有前缀输入与本次转换分别遵循原 History 策略：一次撤销转换会恢复输入触发字符前的文档、完整后缀及光标，重做恢复转换结果。

React 对真实 Space 的 keypress 分支补齐空格数据读取，普通空格和输入规则都能进入模型；Shift+Space 仍是空格，Ctrl/Alt/Meta 组合不借此提交。普通字符继续使用原文本事件路径。宿主取消、只读及活跃组合输入仍优先；这里不增加全局按键监听或真机 IME 认证。

`findMarkdownInputRule` 只负责匹配，`createMarkdownInputRuleResult` 返回目标规则名、transaction 和转换后的 selection。React 入口在普通文本插入前检查规则，命中后通过 `onTransaction` 输出 `inputType: "insertFromInputRule"`。

结构转换本身是一个 transaction，可由宿主 History 一次撤销；此前已经记录的前缀输入仍遵循原有 History 记录。

输入规则继续直接生成 Operation/Transaction，不改为 Command Registry 扩展，不新增节点、规则或公开类型。自定义 Registry 的 guard 不等于规则权限系统；宿主需要禁止规则时，应在现有 onBeforeInput 入口接管。所有偏移仍为 UTF-16，不扩展 heading/列表/cell 内触发范围。
