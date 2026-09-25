# QA：输入法、快捷键与输入规则闭环

## 验收范围

| 场景             | 预期                                                  | 结果 |
| ---------------- | ----------------------------------------------------- | ---- |
| Composition 状态 | start、update、end 正确切换，结束后恢复空闲           | 通过 |
| 中文候选词       | 候选更新不改模型，确认后只提交一次最终文本            | 通过 |
| 组合中删除       | Backspace 不触发模型删除，后续候选内容可继续更新      | 通过 |
| 取消与空确认     | 不生成 transaction                                    | 通过 |
| Mark 快捷键      | Mod+B/I/U、Mod+Shift+X 执行对应 Command               | 通过 |
| 块快捷键         | Mod+Alt+0–6、Mod+Shift+7/8/9 转换标题、列表和引用     | 通过 |
| History 快捷键   | Mod+Z、Mod+Shift+Z 和 Mod+Y 解析为宿主 History 动作   | 通过 |
| 快捷键冲突       | 无主修饰键、修饰键不匹配和 Composition 期间不误触发   | 通过 |
| 标题规则         | paragraph 开头输入 `# ` 转换为一级标题                | 通过 |
| 列表规则         | paragraph 开头输入 `- ` / `1. ` 转换为无序/有序列表   | 通过 |
| 引用与代码规则   | paragraph 开头输入 `> ` / 三个反引号转换为引用/代码块 | 通过 |
| 撤销             | 输入规则结构转换可由一次 History 撤销                 | 通过 |
| 误触发保护       | 正文中前缀、非 paragraph 和非折叠选区不转换           | 通过 |
| 选区落点         | 转换后落到目标文本节点起点                            | 通过 |
| Demo             | 提供空白输入样例、输入法状态和第 23 周里程碑          | 通过 |

## 自动化覆盖

- `composition.test.ts` 覆盖状态克隆、候选更新、Backspace 后确认、取消和空确认。
- `command/shortcut.test.ts` 与 `keyboard-shortcut.test.ts` 覆盖 payload、字母/数字 code、命令映射、撤销重做、冲突和组合输入保护。
- `packages/react/tests/command-shortcut.test.ts` 覆盖有无 payload 的组件执行与 transaction 输出。
- `input-rule/match.test.ts` 覆盖五类触发、选区限制和误触发保护。
- `input-rule/transform.test.ts` 覆盖目标结构、transaction 和转换后 selection。
- Playwright 覆盖中文组合输入、Mark/标题/引用/列表快捷键、撤销重做、五类输入规则、撤销和误触发。
- 完整质量门禁使用 `pnpm check:all`。

## 结论

第 23 周范围已闭环并完成快捷键扩展，输入法候选阶段没有中间模型写入，快捷键和输入规则都通过统一 Command、Transaction 与 History 边界工作。
