# QA：复制与剪切

## 执行范围

2026-10-23 在本地验证模型纯文本读取、React 原生 copy/cut、宿主事件接管、剪切 History 及反向选区恢复。Demo 使用组件原生事件，无需额外按钮。

2026-10-24 补充可选 HTML 复制/剪切验收，默认纯文本契约不变。Demo 提供中文“复制格式”选择，格式切换本身不修改文档或 History。

2026-10-25 补充同层跨列表项 HTML 复制，覆盖结构、编号、checked、选区内子列表、源文档隔离及纯文本回退；跨项剪切仍不支持。Demo 新增“列表复制”样例，原有示例 ID 不变。

2026-10-26 补充同一行跨 cell 及完整连续行 HTML 复制，覆盖多段 cell、首尾裁剪、样式、安全链接、源文档隔离、正文粘贴及 History。部分跨行/跨表仍回退完整纯文本，跨 cell 剪切和表格内富片段粘贴边界不变。Demo 新增中文“表格复制”样例。

## 自动化覆盖

- `packages/core/tests/clipboard/text.test.ts`：10 项，验证正反向选区、复制隔离、非法/折叠端点、空白和 UTF-16 字面文字。
- `packages/core/tests/clipboard/text-structure.test.ts`：7 项，验证 marks、块换行、空段、代码、嵌套列表、表格行列与 cell 段落、void 降级及实际为空的范围。
- `packages/core/tests/history/clipboard-cut.test.ts`：6 项，验证顶层段落、列表项、同 cell 多段范围的正反向剪切，快照、marks、选区方向及撤销重做；扩展验证 HTML 重导出、正文富格式与列表/cell 纯文本粘贴降级，以及粘贴后的独立 History。
- `packages/core/tests/public-api.test.ts`：公共入口可无 DOM 读取复制文字。
- `packages/core/tests/render/selection-sync.test.ts`：新增四项，验证正反向选区往返、跨块方向、按序 DOM Range 及非法端点不破坏现有选区。
- `packages/core/tests/clipboard/selection-blocks.test.ts` 与 `selection-block-boundaries.test.ts`：共 12 项，验证范围裁剪、克隆、块类型、空段、单嵌套列表项、同 cell 多段及跨结构拒绝，新增空边界和嵌套路径的共享文字裁剪。
- `packages/core/tests/clipboard/export-html.test.ts`、`export-html-safety.test.ts`、`html-export-roundtrip.test.ts`：共 13 项，验证 HTML 片段、转义、属性白名单、链接/颜色过滤、代码与链接组合、默认下划线不外溢，以及组合 marks/元数据/代码块的 parser 往返。
- `packages/core/tests/clipboard/selection-list.test.ts`、`selection-list-ordered.test.ts`、`selection-list-task.test.ts`：共 19 项，验证列表片段、正反向裁剪、克隆、子列表/末项后代边界、编号调整、溢出与非法值、任务状态和嵌套列表自身导出。
- `packages/core/tests/clipboard/export-list-html.test.ts` 与 `export-list-boundaries.test.ts`：共 11 项，验证三类列表 HTML/parser 往返、属性过滤、单项片段兼容、父子/不同列表拒绝、空边界、嵌套独立根及安全降级。
- `packages/core/tests/history/list-clipboard.test.ts`：6 项，覆盖三类列表的正反向复制、正文富格式粘贴、编号/checked、一次撤销重做、选区恢复和源文档不变。
- `packages/core/tests/clipboard/selection-table.test.ts` 与 `selection-table-rows.test.ts`：共 10 项，覆盖双向裁剪、多段 cell、完整行与单列表格、片段克隆及部分跨行拒绝。
- `packages/core/tests/clipboard/export-table-html.test.ts`、`export-table-boundaries.test.ts`、`export-table-safety.test.ts`：共 14 项，覆盖表格/parser 往返、未选行列/段落隔离、单 cell 兼容、空边界、UTF-16、链接/代码/样式、转义、非法源表格及跨表回退。
- `packages/core/tests/history/table-clipboard.test.ts`：5 项，覆盖同一行/完整行的双向复制、正文粘贴、单条 History、撤销重做与源文档不变，以及现有 cell 的实际纯文本降级。
- `packages/react/tests/clipboard-copy-cut.test.ts`：44 项，覆盖受控/非受控、只读、宿主接管、多编辑器与外部选区、模型文字优先、IME、写入失败、Registry 缺失/禁用/异常/空结果、跨 cell 保护及事务元数据；验证双格式失败不删除、列表与表格结构、默认 plain 兼容、跨层级/部分跨行完整回退和跨项/跨 cell 剪切拒绝。
- `tests/e2e/clipboard.spec.ts`：27 项 Chromium 用例，覆盖纯文本/HTML、撤销重做、目标降级、原生快捷键及手机控件；本轮新增 5 项验证正反向同一行片段、完整行复制粘贴与撤销重做、手机表格布局、部分跨行回退和剪切拒绝，更新原有同一行 HTML 用例。
- 同一浏览器文件另验证真实系统复制、剪切、粘贴快捷键往返；只该用例申请测试上下文的剪贴板权限，其他用例使用独立 DataTransfer，不共享系统剪贴板。
- `scripts/verify-package-exports.mjs`：构建包运行时与声明导出、`onCopy` / `onCut`、`deleteByCut` 与 `clipboardFormat` 类型，以及纯文本/HTML parser 往返、链接代码组合、列表编号/checked、同一行/完整行表格、未选内容过滤、片段隔离和部分跨行拒绝。

## 本地结果

`pnpm check:all` 通过，包含格式、lint、全仓与包级类型检查、单测、构建、包产物和浏览器回归。详细数量见[全量回归](./full-regression.md)。

桌面 1280×720、手机 390×844 的 Playwright 截图已检查：新增格式控件文字可读，不超出视口；手机标签保持完整行显示。截图由 Playwright 输出目录管理，不写入仓库。

新增任务列表粘贴后的编辑器截图已检查，两个 checkbox 分别保持已完成/待办状态；撤销后消失，重做后结构和状态恢复。编号校验在加法前执行，字符串、BigInt、Symbol、非整数及溢出均有回归，未触发隐式转换或异常。

本轮桌面片段截图保留两格与首格的两个段落、粗体/斜体；手机 390×844 截图中的两行三列表格完整可读、不溢出或重叠。撤销/重做按解析后的 JSON 内容比较，不依赖对象属性的序列化顺序。

反向选区验收曾暴露受控回写将选区规范化为正向的问题，现已改为保留 anchor/focus；重新设置前仍清空旧浏览器选区，确保通过撤销/重做按钮恢复后继续输入会进入编辑事务，而不是仅修改 DOM。

## 保留边界

- 默认只输出纯文本；可选 HTML 支持文字、同层跨项列表、同一行跨 cell 与完整连续行表格片段，不导出任意跨层级列表、部分跨行/跨表结构、Markdown、图片块或文件。
- 列表单项和单 cell 文字按 paragraph 导出，不保留编号、checked、嵌套层级或表格外壳；目标粘贴仍按当前 Command 能力选择 HTML 或实际纯文本。
- 同层跨项可保留所选列表结构、编号与 checked；最后项文字后的子列表不选入，嵌套片段不带祖先，跨不同列表/层级或编号非法仍回退。复制能力不扩展跨项剪切和列表目标富格式插入。
- HTML 第二次写入失败时，纯文本可能已写入事件数据，不承诺剪贴板回滚，但文档和 History 不变。HTML block 片段粘贴不保证任意部分选区的原段落结构往返。
- 复制范围可跨结构；剪切仍只覆盖现有删除命令支持的范围，不支持跨项、跨 cell 或穿越 void block 的删除。
- 表格多段 cell 的纯文本输出不做 TSV 引号转义，不保证原表格往返。
- 同步 ClipboardData 写入成功不等同于操作系统最终提交成功，组件不额外申请系统权限。
- 浏览器回归仅在 Chromium 执行，未做真实桌面 Office、其他浏览器或系统菜单的跨平台人工验收。
