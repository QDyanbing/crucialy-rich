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

## 键盘导航验收

2026-11-15 新增 83 项 React 单测和 14 项 Chromium 用例，覆盖低层、固定和悬浮工具栏：

- `toolbar-tab-stop.test.ts`、`toolbar-arrow-navigation.test.ts`、`toolbar-home-end.test.ts`、`toolbar-rtl-navigation.test.ts`：25 项，单入口、焦点记忆、方向回绕、禁用/分隔项跳过、Home/End 与实时 RTL。
- `toolbar-keyboard-guards.test.ts`：28 项，四类修饰键、isComposing/keyCode 229、宿主取消与后续恢复。
- `toolbar-keyboard-selection.test.ts`：7 项，导航/Enter/Space/Tab/Shift+Tab 释放旧指针 Range，不在 keydown 提交命令。
- `toolbar-focus-ownership.test.ts`、`toolbar-dynamic-focus.test.ts`：11 项，子控件/最近根/多实例隔离，配置重排、动态禁用、焦点与 active 分离、空/单项恢复不抢焦点。
- `toolbar-keyboard-lifecycle.test.ts`：3 项，双组 SSR 水合、StrictMode 最新回调与单次通知、卸载重挂。
- `toolbar-keyboard-history.test.ts`：9 项，固定/悬浮、正反选区、两种激活键单条 History 往返，以及 guard 失败重试。
- `scripts/verify-package-exports.mjs`：构建包实际挂载后验证单入口、方向/Home/End/RTL、旧快照释放、目标文字格式、禁用/恢复，导航不发命令。
- `tests/e2e/toolbar-keyboard.spec.ts`：14 项，桌面/手机真实 Tab/Shift+Tab 进入/离开与记忆、方向/Home/End、Enter/Space 原生单次激活和撤销重做、继承 RTL 与宿主取消，无 pageerror。

1280×844 与 390×844 的焦点截图已检查。窄工具栏的中文“链接/引用”曾被压成多行，现用非压缩单行按钮并保留横向滚动；浏览器 Range 几何断言确认焦点按钮文字为单行且按钮完整位于滚动容器内部。焦点样式可见，没有新增示例或控件。

## 浮层几何验收

2026-11-16 `toolbar-position-bounds.test.ts` 新增 16 项，屏幕外及普通锚点、水平边界和自定义间距均限制在视口内；`overlay-geometry.test.ts` 中 14 项验证 Toolbar 非有限/无效几何和声明高度无法放入视口时隐藏。构建包调用同一定位入口并验证无效组件不渲染。

`overlay-viewport.spec.ts` 的两条 Toolbar 路径在桌面/手机验证滚动后追随 Range、resize 后收窄、外部 Range 隐藏及重新选择恢复，模型与 History 保持不变，无 pageerror。1000×600 / 280×600 的工具栏截图已检查；此前 14 项 roving tabindex、Tab/Shift+Tab 记忆与原生键盘激活回归全部通过。全量结果见[全量回归](./full-regression.md)。宿主仍须提供真实 toolbarSize；自定义主题测量、裁剪/transform/门户和真机 visualViewport 不在验收范围。

## 结论

第 17 周工具栏范围已闭环。配置、状态、固定/悬浮渲染、命令执行、选区恢复、窄屏边界、History 和中文 Demo 均有自动化覆盖。

2026-11-15 本地 `pnpm check:all` 通过：331 个单测文件、2672 项单测、353 项 Chromium 用例。本轮新增 83 项 React、14 项 Chromium 验证，既有手势、编辑区与 History 回归继续通过。

Tab 顺序已改为每组一个入口；低层 onCommandCancel 现在也接收有效键盘导航/激活/Tab 离开通知，宿主应允许清理快照。IME 仍由宿主传 disabled，自定义主题需提供焦点样式与可用滚动容器。不新增自动 focus、竖向/二维导航、全局快捷键、自动返回编辑区或屏幕阅读器认证，完整规则见[键盘导航](../features/toolbar.md#键盘导航)。

宿主须检查 onCommand 的 result.ok 再应用，event.selection 是执行前范围，操作后位置读取 result.selection。disabled 只锁定工具栏，不是全局只读；不检测文档/payload 原地修改、不重映射旧范围、不提供窗口级释放监听，也不回滚插件副作用或捕获宿主/异步异常。注册变更需宿主触发渲染，稳定引用和其他边界见[工具栏契约](../features/toolbar.md)。
