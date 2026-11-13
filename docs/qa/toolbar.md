# QA：工具栏闭环

## 能力矩阵

| 场景         | 预期                                                              | 状态 |
| ------------ | ----------------------------------------------------------------- | ---- |
| 配置定义     | command/separator 配置可校验且 ID 唯一                            | 通过 |
| Command 状态 | active、disabled 和未注册状态来自 core Registry                   | 通过 |
| 默认配置     | 提供 Bold、Italic、Underline、Strike、Code、清除格式、Link 等     | 通过 |
| 固定工具栏   | 输出 toolbar/button/separator 可访问语义                          | 通过 |
| 命令执行     | 点击回传可应用的 CommandResult                                    | 通过 |
| 悬浮显示     | 非空选区显示，折叠或缺失选区隐藏                                  | 通过 |
| 悬浮定位     | 上下翻转、左右约束和窄屏宽度保持稳定                              | 通过 |
| 选区保护     | pointerdown 保存 selection，点击后仍作用于原选区                  | 通过 |
| History      | Demo 应用 Toolbar 结果后可以撤销和重做                            | 通过 |
| 显示开关     | 固定和悬浮工具栏可以独立开启或关闭                                | 通过 |
| 手势归属     | 文档/Registry/按钮命令/payload 不匹配则取消该次操作，不借用旧范围 | 通过 |
| 一次性消费   | 执行与回调前消费快照，重入、失败及下次激活不重复使用              | 通过 |
| 取消与指针   | pointercancel/宿主取消清理，非主指针和中/右键不捕获               | 通过 |
| 状态刷新     | 同一可变 Registry 在下次宿主渲染刷新，不自动订阅注册变更          | 通过 |
| 交互禁用     | 可选 disabled 锁定按钮，保持 active，解除不覆盖命令自身 disabled  | 通过 |
| 组合输入     | Demo 两类工具栏在 Composition 活跃时禁用，恢复后可正常格式化      | 通过 |

## 自动化入口

- 配置与默认项：`toolbar-config.test.ts`、`toolbar-defaults.test.ts`。
- 状态与执行：`toolbar-state.test.ts`、`toolbar-execute.test.ts`。
- `packages/react/tests/toolbar-errors.test.ts`：4 项验证 Registry/guard/isActive 异常只禁用对应项，正常项的 active/点击保持可用；guard 在渲染后才异常时，点击输出可检查的 failure、无 transaction，并保留独立选区快照。
- 固定渲染：`toolbar-render.test.ts`、`fixed-toolbar-state.test.ts`。
- 悬浮行为：`floating-toolbar-visibility.test.ts`、`floating-toolbar-position.test.ts`、`floating-toolbar-render.test.ts`。
- 选区快照：`toolbar-selection.test.ts`。
- `toolbar-execution-snapshot.test.ts`：4 项验证执行前捕获的成功/失败/skipped 通知及初始无选区边界，扩展对输入的变异不改变旧通知。
- `toolbar-reentry.test.ts`、`toolbar-document-ownership.test.ts`、`toolbar-command-ownership.test.ts`：12 项覆盖一次性消费、重入、文档/Registry/命令/payload 归属、正常 selection/展示更新及外部路径修改。
- `toolbar-pointer-cancel.test.ts`、`toolbar-event-guards.test.ts`、`toolbar-disabled.test.ts`：16 项覆盖取消、四类不捕获事件、禁用按钮、旧快照释放、禁用/回调恢复及 Floating SSR。
- `toolbar-registry-refresh.test.ts`：3 项验证补注册、guard/active 更新和异常替换修复均在下次渲染刷新。
- `toolbar-history-matrix.test.ts`：18 项验证默认九类命令的正反向格式、正文、邻段与一次撤销/重做。
- `toolbar-recovery-lifecycle.test.ts`：7 项验证 Registry/guard/execute 失败重试、无选区、多实例、StrictMode 最新回调及卸载重挂。
- `scripts/verify-package-exports.mjs`：构建包的公开导出与可选 prop 声明、执行前快照、固定/悬浮实际挂载、禁用/恢复、归属及 pointercancel。
- 浏览器闭环：`tests/e2e/demo-shell.spec.ts` 中的固定/悬浮 Toolbar、行内代码和清除格式场景。
- `tests/e2e/toolbar-interactions.spec.ts`：8 项桌面/手机验证组合禁用及恢复、模型替换后旧按下操作拒绝、原生宿主取消、当前选区格式化与 History 往返。

```sh
pnpm check:all
```

## 结论

第 17 周工具栏范围已闭环。配置、状态、固定/悬浮渲染、命令执行、选区恢复、窄屏边界、History 和中文 Demo 均有自动化覆盖。

2026-11-13 本地 `pnpm check:all` 通过：311 个单测文件、2466 项单测、331 项 Chromium 用例。新增 60 项 React、8 项 Chromium 验证；1280px 与 390px 视口的固定/悬浮格式结果截图已检查，中文文字及范围正常。

宿主须检查 onCommand 的 result.ok 再应用，event.selection 是执行前范围，操作后位置读取 result.selection。disabled 只锁定工具栏，不是全局只读；不检测文档/payload 原地修改、不重映射旧范围、不提供窗口级释放监听，也不回滚插件副作用或捕获宿主/异步异常。注册变更需宿主触发渲染，稳定引用和其他边界见[工具栏契约](../features/toolbar.md)。
