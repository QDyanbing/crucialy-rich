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

## 生命周期修正（2026-11-08）

- Core 新增 `composition-isolation.test.ts` 6 项，验证活跃候选的当前/起始 Range、外部新 selection 和最终 commit 互不共享。空闲 update 保持原引用语义；Core 不追踪文档替换或修复路径。
- React 新增 51 项：`composition-notifications` 3 项、`composition-fallback` 5 项、`composition-cancellation` 5 项、`composition-invalidation` 6 项、`composition-ownership` 8 项、`composition-recovery` 13 项、`composition-history` 4 项、`composition-lifecycle` 7 项。
- 覆盖通知被宿主修改仍按原锚点提交、取消 start/update/end 的阶段语义、空/重复/未配对结束、同一 compositionend 回退只发一次事务，以及文档换引用、只读和块选区使旧候选失效。相同文档引用的标签/回调/Registry/文字 selection 更新不改起点，最终命令使用当前 Registry。
- guard/execute/查找失败后释放状态，可更换命令重试；候选期间键盘删除、换段/软换行、原生删除和粘贴不提交其他模型事务。内嵌控件与其他实例范围不启动正文组合，跨 cell 范围拒绝且可恢复。
- 首次全量运行发现图片块 start 被拒绝后，原 IME 剪贴板保护也被解除。修正为 active 但不保存 startSelection 的保护状态：组件不导出图片、不执行模型剪切/删除，最终文本不插入，结束清理。原 `clipboard-copy-cut.test.ts` 105 项及对应新断言通过，未通过改写旧断言来放宽行为。
- 受控接入的原始范围、正反方向、一次结束 transaction、撤销重做及普通输入续编通过。`batch: "composition"` 不变，不同会话仍可能按原 mergePolicy 合并；本轮不强制独立 undo、不新增批次标识或 API。
- Chromium 新增 12 项：`composition-lifecycle.spec.ts` 6 项，验证桌面候选零事务、单次提交、取消、迟到结束、模型切换与 History；`composition-mobile.spec.ts` 6 项，验证任务状态、代码块、同 cell 多段范围、取消与后续重试。使用合成 CompositionEvent，不模拟系统候选窗。
- 构建入口验证 Core 快照克隆、React 通知变异不污染内部状态、提交/取消/替换文档及单次事务。桌面 1280×720、手机 390×844 截图已查看，确认文本、任务勾选、编号和邻项正常，无溢出遮挡。
- 最终本地 `pnpm check:all` 退出码 0：295 个文件/2350 项 Vitest、300 项 Chromium，格式、lint、根工程/包级类型、构建及公开包检查全部通过。主 JS 约 515.19 KB，已有非阻断分包提示保留，见[全量回归](./full-regression.md)。

## 当前边界

- 受控 value 的引用定义文档身份，语义相等的新对象也取消会话；宿主须保持未编辑引用稳定。不检测原地修改或把旧范围重映射到新模型。
- 宿主回调异常不被吞掉或回滚；只验证同步 Command 失败后的清理，不保证任意回调重入、异步错误或候选 DOM 改写恢复。
- 合成事件和手机视口不构成真机输入法验收。同一 compositionend 的 React 回退已去重，不等于覆盖所有浏览器结束后另发 textInput/insertFromComposition 的独立事件序列；不新增不可取消事件 DOM 修复。

## 结论

第 23 周范围已闭环并完成快捷键扩展，输入法候选阶段没有中间模型写入，快捷键和输入规则都通过统一 Command、Transaction 与 History 边界工作。
