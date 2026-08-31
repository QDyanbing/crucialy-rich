# QA：模型渲染

## 范围

验证模型到渲染树、paragraph/heading/quote 语义标签、四种 boolean mark、三种文字属性、Link Mark、HTML 序列化、路径属性绑定、DOM 与模型映射、React 组件渲染和演示渲染入口。

## 自动化测试

- `packages/core/tests/render/attributes.test.ts`：模型路径属性编码、解码和非法输入。
- `packages/core/tests/render/dom-mapping.test.ts`：DOM 位置和模型位置双向映射、非法输入和根节点 helper。
- `packages/core/tests/render/render.test.ts`：document、paragraph、1–6 级 heading、quote、四种 boolean mark、文字属性、Link Mark、组合样式和渲染边界。
- `packages/core/tests/render/html.test.ts`：语义标签、样式与链接 HTML 序列化、组合 marks 和文本转义。
- `packages/core/tests/public-api.test.ts`：渲染公开 API 导出。
- `packages/react/tests/public-api.test.ts`：React 组件渲染 value、defaultValue、空 document、受控优先级和组合 mark 结构化样式。
- `tests/e2e/demo-shell.spec.ts`：演示编辑区、组件示例和渲染边界示例。

命令：

```sh
pnpm test
pnpm test:e2e
```

## 手测场景

| 场景           | 操作                         | 期望                                    | 结果 |
| -------------- | ---------------------------- | --------------------------------------- | ---- |
| 普通文档渲染   | 打开演示                     | 编辑区显示 `你好，crucialy-rich。`      | 通过 |
| 多段落渲染     | 使用默认模型示例             | 编辑区显示两段文本                      | 通过 |
| 空 document    | 查看边界示例                 | 根节点保留 `data-crucialy-path="[]"`    | 通过 |
| 空 paragraph   | 查看边界示例                 | paragraph 保留 `[0]`，不生成 text path  | 通过 |
| 三段落边界     | 查看边界示例                 | 第三段包含 `data-crucialy-path="[2,0]"` | 通过 |
| 规范化后渲染   | 选择非法示例并点击“规范化”   | 编辑区显示规范化后的合法 paragraph      | 通过 |
| path 属性绑定  | 检查渲染出的 text 节点       | 节点包含 `data-crucialy-path="[0,0]"`   | 通过 |
| Bold 渲染      | 点击 demo“加粗”按钮          | 选区 text 渲染为 `strong` 且保留 path   | 通过 |
| Italic 渲染    | 点击 demo“斜体”按钮          | 选区 text 渲染为 `em` 且保留 path       | 通过 |
| Underline 渲染 | 点击 demo“下划线”按钮        | 选区 text 渲染为 `u` 且保留 path        | 通过 |
| Strike 渲染    | 点击 demo“删除线”按钮        | 选区 text 渲染为 `s` 且保留 path        | 通过 |
| Heading 渲染   | 切换 1–6 级标题              | 分别输出 `h1`–`h6` 且保留 path          | 通过 |
| Quote 渲染     | 切换引用块                   | 输出 `blockquote` 且保留 path           | 通过 |
| 文字属性渲染   | 设置字号、字色和背景色       | 输出安全结构化 style                    | 通过 |
| Link 渲染      | 对选区设置安全链接           | 输出带白名单属性的 `a`                  | 通过 |
| 组合样式渲染   | 对同一选区启用下划线和删除线 | text-decoration 同时保留两种样式        | 通过 |
| React 组合样式 | 在组件中渲染四种 mark 组合   | style 对象被 React 接受且输出合法 CSS   | 通过 |
| DOM 到模型     | 传入 text 节点和偏移         | 返回对应模型位置                        | 通过 |
| 模型到 DOM     | 传入模型位置                 | 返回对应 DOM 节点和偏移                 | 通过 |

## 当前限制

- 四种 boolean mark、1–6 级标题和引用块已支持；列表、代码块等后续扩展节点尚未实现。

## 结论

当前模型到 DOM 结构渲染、Block Type 语义标签、文字样式与链接组合、DOM 与模型位置映射、React 组件渲染和演示边界验收均已闭环。
