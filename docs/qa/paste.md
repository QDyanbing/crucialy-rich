# QA：粘贴闭环

## 能力矩阵

| 场景          | 预期                                        | 状态 |
| ------------- | ------------------------------------------- | ---- |
| Parser 调度   | Markdown、HTML、纯文本按顺序解析并可降级    | 通过 |
| 纯文本单行    | 在光标处插入且不拆块                        | 通过 |
| 纯文本多行    | 换行转 paragraph，保留空行                  | 通过 |
| 替换选区      | 支持正反向及同块跨 mark 文本节点            | 通过 |
| HTML          | 保留 paragraph、文字标记、link、ul/ol/li    | 通过 |
| HTML 标记     | 规范化 b/i/u/s/strike/del 及其嵌套组合      | 通过 |
| HTML 行内样式 | 保留安全字号、文字色、背景色及嵌套覆盖      | 通过 |
| HTML 链接     | 保留安全 href、target、rel 并过滤非法元数据 | 通过 |
| HTML 嵌套列表 | 保留三层有序、无序、任务子列表及深层选区    | 通过 |
| HTML 表格     | 导入分区、表头 cell、多段落和非等宽行       | 通过 |
| HTML 图片     | 导入安全 src、alt、正整数宽高和独立图片段落 | 通过 |
| HTML 任务项   | 导入 checkbox 列表、checked、marks 和链接   | 通过 |
| HTML 安全     | 丢弃脚本、事件属性、危险资源和非法样式值    | 通过 |
| Markdown      | 转换标题、引用、代码、列表、bold、italic    | 通过 |
| React         | paste 事件生成 Transaction，不直接写 DOM    | 通过 |
| History       | 每次粘贴作为一次历史记录                    | 通过 |
| 中文 Demo     | 提供纯文本、HTML、Markdown 验收区           | 通过 |

## 自动化覆盖

- Clipboard parser：`packages/core/tests/clipboard`。
- Paste command：`packages/core/tests/command/paste.test.ts`，HTML 标记别名、行内样式、链接元数据、嵌套列表、表格、图片和任务列表 History 往返见对应的 `html-*-paste-history.test.ts`。
- React：`packages/react/tests/html-*-paste.test.ts` 覆盖文字标记别名、行内样式、链接元数据、嵌套列表、表格、图片和任务列表原生 HTML Clipboard 事件。
- 浏览器：`tests/e2e/demo-shell.spec.ts` 覆盖原生纯文本、HTML 标记别名、行内样式、链接元数据、嵌套列表、表格、图片和任务列表 paste 事件，以及 HTML、Markdown 验收控制。
- 全量入口：`pnpm check:all`。

## 安全结论

Clipboard 原始内容不会直接注入编辑器 DOM。HTML 先由标准 parser 建树，再映射到白名单模型；链接继续使用已有协议清洗，最终文档还会经过 Transaction 规范化。

## 结论

第 20 周粘贴能力已完成代码、测试、中文 Demo、文档和浏览器验收闭环，并在对应模型完成后补齐了 HTML 文字标记别名、安全行内样式、链接元数据、嵌套列表、顶层表格、安全图片与任务列表导入。
