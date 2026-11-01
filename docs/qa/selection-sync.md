# QA：选区双向同步（第一版）

## 范围

验证浏览器折叠、非折叠选区和模型 `RangeSelection` 的双向同步。

## 自动化测试

- `packages/core/tests/render/selection-sync.test.ts`：读取折叠浏览器选区、生成 DOM 范围、恢复浏览器选区。
- `tests/e2e/demo-shell.spec.ts`：演示渲染区选区同步，以及链接弹层焦点转移后的非折叠选区恢复。
- `packages/core/tests/render/selection-sync.test.ts`：2026-10-23 新增正反向端点往返、跨块方向、按序 DOM Range 及非法端点保留原选区的回归。
- `tests/e2e/clipboard.spec.ts`：正反向剪切、撤销方向恢复、重做后继续输入均通过；完整浏览器回归同时验证既有链接与表格流程。
- 2026-11-01：`dom-element-boundaries.test.ts` 11 项验证元素子节点索引、marks/链接/代码叶子、UTF-16 和空叶子；`dom-split-text.test.ts` 13 项验证拆分节点的累计、双向恢复、空片段/代理对及拒绝截断；路径均位于 `packages/core/tests/render/`。
- 同目录 `dom-container-boundaries.test.ts` 13 项验证真实子节点、外层空白/注释、任务 checkbox 和子列表边界；`dom-boundary-safety.test.ts` 10 项验证原子控件、异常路径、无关内容及 DOM 长短不一致时的保护。
- 同目录 `dom-range-boundaries.test.ts` 6 项验证正反向元素选区、跨 mark 拆分节点、空叶子及恢复失败不改现有选区；`dom-structure-boundaries.test.ts` 6 项覆盖文本块、CodeBlock、嵌套列表、cell paragraph 与表格结构拒绝。
- `packages/react/tests/dom-boundary-clipboard.test.ts`：15 项，覆盖完整元素/拆分后缀复制剪切、History 方向、任务状态、原子控件拒绝、beforeinput 位置、ref 命令和多编辑器隔离。输入用例复用既有 jsdom TextEvent/textInput 配置触发 React 的 beforeinput 链路，浏览器原生输入另由 Playwright 验证。
- `tests/e2e/dom-boundaries.spec.ts`：8 项，覆盖 1280×720 和 390×844 下的正反向元素选区、完整复制、剪切/粘贴分别撤销、拆分 Text 后原生输入/重做/续编，以及 checkbox 邻接处任务文字剪切与邻项/checked 保留。
- `scripts/verify-package-exports.mjs`：从构建后的 Core 导出执行 DOM 映射，验证 UTF-16、拆分节点、任务 checkbox 和非法子节点偏移；既有 API 签名不变。

命令：

```sh
pnpm test
pnpm test:e2e
```

## 手测场景

| 场景         | 操作                       | 期望                       | 结果 |
| ------------ | -------------------------- | -------------------------- | ---- |
| 读取折叠光标 | 在渲染文本中设置浏览器光标 | 返回同位置模型选区         | 通过 |
| 恢复折叠光标 | 传入折叠模型选区           | 浏览器选区落到对应 DOM 点  | 通过 |
| 演示选区同步 | 在渲染区改变浏览器选区     | 选区 JSON 同步更新         | 通过 |
| 无选区范围   | 清空浏览器选区后读取       | 返回 `undefined`           | 通过 |
| 弹层焦点转移 | 选择文本后打开并确认链接   | 命令后恢复非折叠浏览器选区 | 通过 |

## 当前限制

- 文字叶子只支持直接 Text 子节点，不递归解释任意包装或直接导入 DOM 改写；块外层空白/注释可忽略，文字叶子内部不支持混入非 Text 内容。根、table/tbody/tr/td、void 和控件内部端点不映射，cell paragraph 与既有文字结构可用。
- 正确映射端点不扩大 Command 可编辑的范围；实例归属由 React 检查，Core 映射本身不负责焦点或 History。映射失败时不会夹取越界位置或先清空旧 DOM 范围。
- 通过 `Selection.setBaseAndExtent` 保留 anchor/focus 方向；浏览器需支持该接口。DOM Range 查询仍使用规范化顺序。
- 选区同步模块不负责编辑输入、IME、删除或换行，这些行为由输入集成和命令层验证。

## 结论

选区双向同步已经覆盖折叠、正反向非折叠、跨块、剪切 History 和链接弹层焦点转移后的受控恢复。

2026-11-01 本地 `pnpm check:all` 通过：243 个文件/1861 项单测、242 项 Chromium 用例。桌面/手机截图已检查，整段文字与后续段落完整、无溢出或遮挡。测试用 DOM 拆分是映射夹具，不是鼓励宿主修改 React 管理的 DOM；未执行其他浏览器或任意复杂编辑 DOM 的兼容性验收。
