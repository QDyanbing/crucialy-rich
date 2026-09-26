# QA：粘贴闭环

## 能力矩阵

| 场景        | 预期                                       | 状态 |
| ----------- | ------------------------------------------ | ---- |
| Parser 调度 | Markdown、HTML、纯文本按顺序解析并可降级   | 通过 |
| 纯文本单行  | 在光标处插入且不拆块                       | 通过 |
| 纯文本多行  | 换行转 paragraph，保留空行                 | 通过 |
| 替换选区    | 支持正反向及同块跨 mark 文本节点           | 通过 |
| HTML        | 保留 paragraph、strong、em、link、ul/ol/li | 通过 |
| HTML 表格   | 导入分区、表头 cell、多段落和非等宽行      | 通过 |
| HTML 安全   | 丢弃脚本、样式、事件属性和危险链接         | 通过 |
| Markdown    | 转换标题、引用、代码、列表、bold、italic   | 通过 |
| React       | paste 事件生成 Transaction，不直接写 DOM   | 通过 |
| History     | 每次粘贴作为一次历史记录                   | 通过 |
| 中文 Demo   | 提供纯文本、HTML、Markdown 验收区          | 通过 |

## 自动化覆盖

- Clipboard parser：`packages/core/tests/clipboard`。
- Paste command：`packages/core/tests/command/paste.test.ts`，HTML 表格 History 往返见 `html-table-paste-history.test.ts`。
- React：`packages/react/tests/html-table-paste.test.ts` 覆盖原生 HTML Clipboard 事件。
- 浏览器：`tests/e2e/demo-shell.spec.ts` 覆盖原生纯文本和 HTML 表格 paste 事件，以及 HTML、Markdown 验收控制。
- 全量入口：`pnpm check:all`。

## 安全结论

Clipboard 原始内容不会直接注入编辑器 DOM。HTML 先由标准 parser 建树，再映射到白名单模型；链接继续使用已有协议清洗，最终文档还会经过 Transaction 规范化。

## 结论

第 20 周粘贴能力已完成代码、测试、中文 Demo、文档和浏览器验收闭环，并在表格模型完成后补齐了顶层 HTML 表格导入。
