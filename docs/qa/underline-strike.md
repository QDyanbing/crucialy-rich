# QA：Underline/Strike 闭环验收

本文记录第 10 周 Day 5 的 Underline/Strike 闭环验收，覆盖 boolean mark 集合、命令交互、组合渲染、Demo 和快捷键配置查询。

## 已完成范围

- `BOOLEAN_MARK_COMMANDS` 按 bold、italic、underline、strike 统一组织四种 mark command。
- 默认 command registry 复用 boolean mark command 集合。
- Underline 与 Strike 支持选区应用、取消、跨 text、collapsed 输入继承和 active 状态。
- Underline 与 Strike 可独立切换，不会移除 Bold、Italic 或彼此的状态。
- renderer 在同一模型路径上合并 underline 和 line-through，避免装饰样式互相覆盖。
- 渲染树使用结构化 style，HTML 序列化与 React 集成分别转换为各自需要的格式。
- Demo“文字标记”样例覆盖四种单独 mark、四种组合 mark 和跨 text 混合选区。
- `DEFAULT_COMMAND_SHORTCUTS` 预留 Bold、Italic 和 Underline 映射，支持按 command 查询和按键盘输入匹配。

## 自动化覆盖

- `packages/core/tests/model/marks.test.ts`
- `packages/core/tests/operation/toggle-mark.test.ts`
- `packages/core/tests/command/underline.test.ts`
- `packages/core/tests/command/strike.test.ts`
- `packages/core/tests/command/mark-interaction.test.ts`
- `packages/core/tests/command/shortcut.test.ts`
- `packages/core/tests/command/integration.test.ts`
- `packages/core/tests/render/render.test.ts`
- `packages/core/tests/render/html.test.ts`
- `packages/core/tests/public-api.test.ts`
- `packages/react/tests/public-api.test.ts`
- `tests/e2e/demo-shell.spec.ts`

## 手测场景

| 场景             | 操作                                     | 预期                                           | 状态 |
| ---------------- | ---------------------------------------- | ---------------------------------------------- | ---- |
| Underline 开关   | 对选区连续点击“下划线”                   | underline 独立添加和移除                       | 通过 |
| Strike 开关      | 对选区连续点击“删除线”                   | strike 独立添加和移除                          | 通过 |
| 两种装饰叠加     | 依次点击“下划线”和“删除线”               | 同时输出 underline 和 line-through             | 通过 |
| 保留其他 mark    | 在已有 Bold/Italic 的选区切换装饰        | Bold/Italic 状态保持不变                       | 通过 |
| 混合选区 active  | 对跨 text 混合选区应用再取消单一 mark    | 按钮 active 状态与整个选区一致                 | 通过 |
| 快捷键配置查询   | 查询 Bold、Italic、Underline 和 Strike   | 前三者返回默认配置，Strike 返回空配置          | 通过 |
| 自定义快捷键匹配 | 向匹配函数传入宿主自定义 Strike 快捷键表 | 返回 Strike command name，不自动执行或绑定事件 | 通过 |

## 当前边界

- mark command 仍限制在同一个 paragraph 内。
- React 组件仍不内置 toolbar。
- mark 快捷键只提供配置和匹配纯函数，尚未绑定编辑器键盘事件。

## 结论

第 10 周 boolean marks 已完成 schema、Operation、Command、renderer、Demo、快捷键占位和 QA 闭环，可以进入第 11 周属性 Mark 设计。
