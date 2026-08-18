# QA：文字属性闭环验收

本文记录第 11 周 Day 5 的字号、文字颜色和背景色综合验收。

## 已完成范围

- `TEXT_STYLE_COMMANDS` 按字号、文字颜色、背景色统一组织三种 command，默认注册表直接复用该集合。
- 三种属性可在同一 paragraph 内跨 text 节点设置和取消。
- 反向选区会先规范化，再生成 `set_mark_attribute` operation。
- 属性设置不会移除 bold、italic、underline 或 strike。
- 单个属性取消时会保留其余文字属性。
- Demo 组合样例可同时渲染字号、前景色、背景色和四种 boolean mark。

## 自动化覆盖

- `packages/core/tests/operation/set-mark-attribute.test.ts`
- `packages/core/tests/command/font-size.test.ts`
- `packages/core/tests/command/text-color.test.ts`
- `packages/core/tests/command/background-color.test.ts`
- `packages/core/tests/command/text-style-interaction.test.ts`
- `packages/core/tests/command/integration.test.ts`
- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/core/tests/public-api.test.ts`
- `packages/react/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## Demo 验收步骤

1. 在“模型示例”中选择“文字标记”。
2. 确认“彩色大号文本”同时显示 24px 字号、文字颜色和背景色。
3. 确认“组合格式”同时显示 18px 字号、前景色、背景色和四种 boolean mark。
4. 对第二段跨节点选区依次设置字号、文字颜色和背景色。
5. 分别取消三个属性，确认其他属性与 boolean mark 不受影响。
6. 检查文档 JSON、Transaction、History、模型校验状态和渲染结果一致。

## 本地验证

```bash
pnpm check
pnpm test:e2e
```

## 当前边界

- 三种文字属性 command 只处理同一个 paragraph 内的选区。
- React 组件不内置文字属性 toolbar，由宿主或 demo 调用 command。
