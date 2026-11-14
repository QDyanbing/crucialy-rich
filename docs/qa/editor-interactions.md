# QA：编辑区交互

## 执行信息

- 日期：2026-11-14，分支 master，版本 0.1.0。
- 本地 `pnpm check:all` 通过，321 个测试文件、2589 项单测、339 项 Chromium。
- 本轮新增 123 项 React 单测、8 项 Chromium；格式、lint、类型、构建和包产物导入均通过。

## 能力矩阵

| 场景       | 结果                                                                   |
| ---------- | ---------------------------------------------------------------------- |
| 宿主取消   | 点击先交宿主，取消后不产生内部事务或选中/清除通知                      |
| 组合与只读 | 任务复选框实际禁用，其他内部点击不处理；恢复后可勾选                   |
| 模型目标   | 图片/cell/任务路径和类型校验；错误目标不通知，正常图片清旧 cell        |
| 任务来源   | 模型 checked 为准，DOM 被改写不覆盖模型；嵌套目标保留父项/邻项         |
| 事件归属   | 原生控件/不可编辑区域/嵌套实例不处理外层文字和剪贴板，宿主仍先观察事件 |
| Range 归属 | 两端最近根节点均为当前实例，外层事件也不借用嵌套 Range                 |
| History    | 正反向、受控/非受控、前后快照独立；每次勾选一条事务并可撤销重做        |
| 焦点       | 控件获焦时暂缓文字回写，Demo 不在控件 keyup/mouseup 时抢焦点           |
| 生命周期   | 只读切换、最新回调、卸载重挂、无浏览器环境 SSR 通过                    |

## 自动化证据

- `editor-click-cancellation.test.ts`：5 项，图片、任务、cell、正文、链接的宿主取消。
- `editor-click-composition.test.ts`：5 项，组合期间保护、会话保持与结束后恢复。
- `editor-task-model.test.ts`：10 项，模型 checked、非法目标/控件类型和邻文保留。
- `editor-click-targets.test.ts`：18 项，图片/cell 路径拒绝及正常选中/清除。
- `editor-click-ownership.test.ts`：9 项，嵌套实例和内嵌控件点击隔离。
- `editor-control-input.test.ts`：49 项，七类控件与七类键盘/输入/剪贴板事件，不读写外层剪贴板或提交事务。
- `editor-nested-selection.test.ts`：8 项，外层事件不能借用内层 Range，恢复自己的光标后可正常编辑。
- `editor-task-history.test.ts`：8 项，受控/非受控、正反方向、History、嵌套邻项、快照隔离与选区降级。
- `editor-click-lifecycle.test.ts` / `editor-task-ssr.test.ts`：11 项，控件/嵌套焦点、只读、回调、卸载与 Node 环境 SSR。
- `scripts/verify-package-exports.mjs`：构建包挂载，真实前后快照、控件输入不拦截、取消、模型路径及组合禁用/恢复。
- `tests/e2e/editor-interactions.spec.ts`：8 项，1280×844 / 390×844，连续两次真实空格各产生一次勾选，无正文改动；取消点击、组合恢复、任务/输入独立撤销重做及图片/cell 选中通知通过。

桌面/手机任务结果截图已检查，checked 状态、中文文字、嵌套列表及邻段正确。图片测试使用本地 PNG 响应，不验证外部图片服务。

## 边界

公开签名和模型不变，React 只读/组合期间任务控件新增 disabled 语义。文字 selection 的回写在控件获焦时暂缓，没有 blur 自动恢复；宿主需要返回编辑区并更新选区。测试不代表任意嵌套编辑器产品、DOM 防篡改或真实设备 IME 全面兼容，也不回滚宿主回调或扩展副作用。详见[编辑区交互契约](../features/editor-interactions.md)。
