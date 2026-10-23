# QA：纯文本复制与剪切

## 执行范围

2026-10-23 在本地验证模型纯文本读取、React 原生 copy/cut、宿主事件接管、剪切 History 及反向选区恢复。Demo 使用组件原生事件，无需额外按钮。

## 自动化覆盖

- `packages/core/tests/clipboard/text.test.ts`：10 项，验证正反向选区、复制隔离、非法/折叠端点、空白和 UTF-16 字面文字。
- `packages/core/tests/clipboard/text-structure.test.ts`：7 项，验证 marks、块换行、空段、代码、嵌套列表、表格行列与 cell 段落、void 降级及实际为空的范围。
- `packages/core/tests/history/clipboard-cut.test.ts`：6 项，验证顶层段落、列表项、同 cell 多段范围的正反向剪切，快照、marks、选区方向及撤销重做。
- `packages/core/tests/public-api.test.ts`：公共入口可无 DOM 读取复制文字。
- `packages/core/tests/render/selection-sync.test.ts`：新增四项，验证正反向选区往返、跨块方向、按序 DOM Range 及非法端点不破坏现有选区。
- `packages/react/tests/clipboard-copy-cut.test.ts`：22 项，覆盖受控/非受控、只读、宿主接管、多编辑器与外部选区、模型文字优先、IME、写入失败、Registry 缺失/禁用/异常/空结果、跨 cell 保护及事务元数据。
- `tests/e2e/clipboard.spec.ts`：9 项 Chromium 用例，验证正反向复制、段落分隔、只读链接纯文本、剪切撤销重做、范围方向、续编、跨块/同 cell 删除及跨 cell 拒绝。
- 同一浏览器文件另验证真实系统复制、剪切、粘贴快捷键往返；只该用例申请测试上下文的剪贴板权限，其他用例使用独立 DataTransfer，不共享系统剪贴板。
- `scripts/verify-package-exports.mjs`：构建包运行时与声明导出、`onCopy` / `onCut` 和 `deleteByCut` 类型，以及复制—删除—History—纯文本粘贴往返。

## 本地结果

`pnpm check:all` 通过，包含格式、lint、全仓与包级类型检查、单测、构建、包产物和浏览器回归。详细数量见[全量回归](./full-regression.md)。

反向选区验收曾暴露受控回写将选区规范化为正向的问题，现已改为保留 anchor/focus；重新设置前仍清空旧浏览器选区，确保通过撤销/重做按钮恢复后继续输入会进入编辑事务，而不是仅修改 DOM。

## 保留边界

- 只输出纯文本，不导出 HTML、Markdown、图片块或文件，不尝试恢复文字格式。
- 复制范围可跨结构；剪切仍只覆盖现有删除命令支持的范围，不支持跨项、跨 cell 或穿越 void block 的删除。
- 表格多段 cell 的纯文本输出不做 TSV 引号转义，不保证原表格往返。
- 同步 ClipboardData 写入成功不等同于操作系统最终提交成功，组件不额外申请系统权限。
- 浏览器回归仅在 Chromium 执行，未做真实桌面 Office、其他浏览器或系统菜单的跨平台人工验收。
