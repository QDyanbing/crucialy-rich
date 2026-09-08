# QA：工具栏闭环

## 能力矩阵

| 场景         | 预期                                                  | 状态 |
| ------------ | ----------------------------------------------------- | ---- |
| 配置定义     | command/separator 配置可校验且 ID 唯一                | 通过 |
| Command 状态 | active、disabled 和未注册状态来自 core Registry       | 通过 |
| 默认配置     | 提供 Bold、Italic、Underline、Strike、Link、H2、Quote | 通过 |
| 固定工具栏   | 输出 toolbar/button/separator 可访问语义              | 通过 |
| 命令执行     | 点击回传可应用的 CommandResult                        | 通过 |
| 悬浮显示     | 非空选区显示，折叠或缺失选区隐藏                      | 通过 |
| 悬浮定位     | 上下翻转、左右约束和窄屏宽度保持稳定                  | 通过 |
| 选区保护     | pointerdown 保存 selection，点击后仍作用于原选区      | 通过 |
| History      | Demo 应用 Toolbar 结果后可以撤销                      | 通过 |
| 显示开关     | 固定和悬浮工具栏可以独立开启或关闭                    | 通过 |

## 自动化入口

- 配置与默认项：`toolbar-config.test.ts`、`toolbar-defaults.test.ts`。
- 状态与执行：`toolbar-state.test.ts`、`toolbar-execute.test.ts`。
- 固定渲染：`toolbar-render.test.ts`、`fixed-toolbar-state.test.ts`。
- 悬浮行为：`floating-toolbar-visibility.test.ts`、`floating-toolbar-position.test.ts`、`floating-toolbar-render.test.ts`。
- 选区快照：`toolbar-selection.test.ts`。
- 浏览器闭环：`tests/e2e/demo-shell.spec.ts` 中的固定/悬浮 Toolbar 场景。

```sh
pnpm check:all
```

## 结论

第 17 周工具栏范围已闭环。配置、状态、固定/悬浮渲染、命令执行、选区恢复、窄屏边界、History 和中文 Demo 均有自动化覆盖。
