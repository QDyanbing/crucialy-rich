# QA：第 11 周字号和颜色闭环

## 当前进度

第 11 周 Day 1「属性 Mark 设计」已完成。

第 11 周 Day 2「字号」已完成。

第 11 周 Day 3「文字颜色」已完成。

☑️ 当前指针：第 11 周 Day 4「背景色」待开始。

## 已完成范围

- `TextMarks` 新增 `fontSize`、`textColor` 和 `backgroundColor` 属性。
- 属性 Mark 可以与 bold、italic、underline 和 strike 共存。
- `fontSize` 接受 `8` 到 `72` 之间的整数，renderer 统一输出 px。
- `textColor` 只接受 `#RGB` / `#RRGGBB`，规范化后统一存储为小写六位十六进制；`backgroundColor` 的过滤留在 Day 4 完成。
- 新增属性值校验、读取、设置和移除 helper。
- 规范化会保留合法属性并丢弃非法属性。
- 文档校验会区分 boolean mark 与属性 Mark 的值约束。
- 相邻 text 节点只有在 boolean mark 与属性值全部一致时才会合并。
- boolean mark 切换、段落拆分和 History 快照会保留属性 Mark。
- core 公共入口已导出属性类型、常量和 helper。
- 新增 `docs/features/text-style.md`，记录模型规则和当前边界。
- 新增通用 `set_mark_attribute` operation，覆盖选区切分、设置、取消、合并和 selection 映射。
- 新增 `setFontSizeCommand` 并接入默认 Command 注册表，支持合法字号、取消字号和 collapsed 输入继承。
- renderer、HTML serializer 和 React 渲染会安全输出合法 `font-size`。
- 中文 demo 新增字号样例和字号选择器，操作会进入 Transaction 与 History。
- Playwright 覆盖字号设置、组合样式和取消字号。
- 新增 `sanitizeHexColor`，拒绝颜色名、函数颜色、alpha 十六进制、缺失 `#` 和额外 CSS 声明。
- 新增 `setTextColorCommand` 并接入默认 Command 注册表，支持设置、取消、跨 text 选区和 collapsed 输入继承。
- renderer、HTML serializer 和 React 渲染只输出规范化后的安全文字颜色。
- 中文 demo 新增彩色样例、原生颜色选择器和“取消文字颜色”按钮，操作进入 Transaction 与 History。
- Playwright 覆盖文字颜色设置、与字号组合和取消；单测覆盖字号、颜色与 boolean mark 的组合交互。

## 自动化覆盖

- `packages/core/tests/model/types.test.ts`
- `packages/core/tests/model/factories.test.ts`
- `packages/core/tests/model/marks.test.ts`
- `packages/core/tests/model/validate.test.ts`
- `packages/core/tests/model/normalize.test.ts`
- `packages/core/tests/operation/toggle-mark.test.ts`
- `packages/core/tests/operation/set-mark-attribute.test.ts`
- `packages/core/tests/operation/summary.test.ts`
- `packages/core/tests/operation/transaction.test.ts`
- `packages/core/tests/command/font-size.test.ts`
- `packages/core/tests/command/text-color.test.ts`
- `packages/core/tests/command/text-style-interaction.test.ts`
- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/react/tests/public-api.test.ts`
- `packages/core/tests/operation/split-block.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 当前边界

- renderer 尚未输出背景颜色。
- demo 尚未提供背景颜色控件。
- `backgroundColor` 的颜色值 sanitize 将在 Day 4「背景色」实现。

## 结论

第 11 周 Day 3 已达到“选中文字可安全修改和取消颜色”的验收要求。下一步实现 Day 4 背景色 command、颜色值 sanitize、安全渲染、测试和 demo 控件。
