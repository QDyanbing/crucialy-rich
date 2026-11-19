# QA：命令式 ref 与范围通知

## 执行范围

2026-11-19 完成定向与全量回归：`pnpm check:all` 通过，349 个单测文件、2841 项单测与 421 项 Chromium。公开 prop、ref 方法签名、Command 和 History 策略不变；完整契约见[命令与通知快照](../features/component-api.md#命令与通知快照)，全部门禁与构建信息见[全量回归](./full-regression.md)。

修复前已用 3 条单测复现无旧文字 Range 的成功命令不提交，以及 3 条单测复现扩展修改输入范围会污染受控 prop/before 快照。

## 单测证据

`pnpm exec vitest run packages/react/tests/ref-*.test.ts packages/react/tests/command-result-range-snapshot.test.ts packages/react/tests/editor-notification-ranges.test.ts`：9 个文件、83 项通过。

- `ref-command-without-range.test.ts`：3 项，明确图片 payload 删除、受控/非受控文档级扩展，成功事务应用且不伪造 beforeSelection。
- `ref-selection-resolution.test.ts`：4 项，非法两端不外露/传给命令，合法当前 DOM 优先，其他实例或外部 Range 只能使用显式合法后备。
- `ref-command-snapshot.test.ts`：3 项，guard/execute 修改上下文和失败扩展均不通过该 Range 改写宿主 prop，before 为执行前范围。
- `ref-selection-snapshot.test.ts`：3 项，getter 每次独立复制，修改旧副本不影响后续读取、受控更新或下一次命令。
- `command-result-range-snapshot.test.ts`：2 项，ref/快捷键在 onChange 前捕获结果 Range，源结果后续修改不污染前后事件范围。
- `editor-notification-ranges.test.ts`：12 项，ref、快捷键、Enter、原生 insertParagraph、删除和 Composition 提交中，事务与选区回调互不共享 Range，受控 prop 不被改写。
- `ref-command-matrix.test.ts`：44 项，11 类命令 × 受控/非受控 × 正反范围。验证 core 事务接入、一次通知、操作前后文档/范围，以及受控回传前后状态；不重复实现 core 规则。
- `ref-command-lifecycle.test.ts`：7 项，最新 Registry/回调、原地补注册、只读宿主命令、Composition 文档失效、StrictMode、受控文档替换和多实例。
- `ref-command-history.test.ts`：5 项，正反方向、两种集成模式、通知/返回范围修改后的 History 独立，明确图片路径的无旧 Range 撤销和宿主块快照。

## 浏览器与产物

- `tests/e2e/ref-command.spec.ts`：12 项，1280×844 / 390×844 与两种集成模式下，getter 副本不改模型，修改事务通知后仍可原生续编，按 payload 删除图片无 beforeSelection。文字命令与后续输入各一次通知，图片 PNG 夹具实际解码 naturalWidth 为 1。
- `apps/demo/tests/ref-editor.html` / `ref-editor.tsx` 为测试专用页面，经 Vite 正常 HTML 管线加载，并纳入根 TypeScript 检查；不增加 Demo 产品入口或生产构建入口。
- 桌面/手机文字命令截图已检查，选中文字与加粗正常，编辑区内容未发生溢出。
- `pnpm build` 和 `pnpm test:packages` 通过。构建包实际挂载验证两种集成模式的文字命令/无 Range 图片删除、getter 副本和通知隔离；受控结果等待宿主回传，非受控自动应用。

## 边界

- 仅隔离 Range 与端点 path，不深拷贝文档、事务或 payload，不回滚扩展副作用，也不捕获宿主回调异常。
- 插件仍须返回合法事务和操作后范围；失败/跳过或仅 document/history 的结果不进入自动提交，空事务不新增事务记录。
- 只读仅限制用户输入，宿主可主动 ref 命令；泛用 ref 不自动维护图片高亮、cell、焦点或 History。需要块快照时由宿主把明确路径接入 History 第三参数。
- 不保证旧 handle 在卸载后继续调用、批处理中同步重入刷新、原地文档变更检测、任意插件事务校验或真机 IME 全面兼容。
