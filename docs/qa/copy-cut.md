# QA：复制与剪切

## 执行范围

2026-10-23 在本地验证模型纯文本读取、React 原生 copy/cut、宿主事件接管、剪切 History 及反向选区恢复。Demo 使用组件原生事件，无需额外按钮。

2026-10-24 补充可选 HTML 复制/剪切验收，默认纯文本契约不变。Demo 提供中文“复制格式”选择，格式切换本身不修改文档或 History。

2026-10-25 补充同层跨列表项 HTML 复制，覆盖结构、编号、checked、选区内子列表、源文档隔离及纯文本回退；跨项剪切仍不支持。Demo 新增“列表复制”样例，原有示例 ID 不变。

2026-10-26 补充同一行跨 cell 及完整连续行 HTML 复制，覆盖多段 cell、首尾裁剪、样式、安全链接、源文档隔离、正文粘贴及 History。部分跨行/跨表仍回退完整纯文本，跨 cell 剪切和表格内富片段粘贴边界不变。Demo 新增中文“表格复制”样例。

2026-10-27 补充顶层混合片段 HTML 复制：首尾在顶层文本块时，保留中间完整列表、表格和 Divider。验证首尾裁剪、原顺序、编号/checked、安全转义、非法源块与含图片回退、源模型隔离、正文粘贴和单条 History；结构内部端点与跨结构剪切边界不变。Demo 新增中文“混合结构复制”样例。

2026-10-28 补充安全图片引用 HTML 复制：两端在顶层文本块时保留完整 ready、无凭据的 HTTP/HTTPS 图片、alt 与正安全整数宽高；临时/非就绪图片整段回退，不新增文件 MIME 或图片剪切。Demo 新增中文“图文复制”样例。

2026-10-29 补充独立图片 BlockSelection HTML 复制，输出单张安全图片和空纯文本；验证焦点/DOM 归属、遗留文字保护、默认 plain、不支持图片、宿主/IME/失败、正文粘贴及 rich-only 目标拒绝。复用“图文复制”样例，不新增图片剪切或文件 MIME。

2026-10-30 补充可编辑 HTML 单图剪切，复用 `deleteImage`，写入成功才删除和通知清除受控块选区；剪切、随后粘贴各占一次 History。修正图片删除的旧文字选区快照，没有合法范围时省略 `beforeSelection`。复用既有样例，不扩展跨图片文字范围剪切、文件 MIME 或受限粘贴目标。

2026-10-31 补充可选 `beforeBlockSelection` 到 History 快照的接入验收，撤销可恢复图片高亮，重做或文字快照清除旧值。旧调用不自动恢复选中态，复制仍要求根聚焦且 DOM 端点未越界，剪贴板格式和安全规则不变。

## 自动化覆盖

- `packages/core/tests/clipboard/text.test.ts`：10 项，验证正反向选区、复制隔离、非法/折叠端点、空白和 UTF-16 字面文字。
- `packages/core/tests/clipboard/text-structure.test.ts`：7 项，验证 marks、块换行、空段、代码、嵌套列表、表格行列与 cell 段落、void 降级及实际为空的范围。
- `packages/core/tests/history/clipboard-cut.test.ts`：6 项，验证顶层段落、列表项、同 cell 多段范围的正反向剪切，快照、marks、选区方向及撤销重做；扩展验证 HTML 重导出、正文富格式与列表/cell 纯文本粘贴降级，以及粘贴后的独立 History。
- `packages/core/tests/public-api.test.ts`：公共入口可无 DOM 读取复制文字，验证 `RangeSelection | BlockSelection` HTML 签名及附加 `type` 字段的旧 RangeSelection 兼容。
- `packages/core/tests/render/selection-sync.test.ts`：新增四项，验证正反向选区往返、跨块方向、按序 DOM Range 及非法端点不破坏现有选区。
- `packages/core/tests/clipboard/selection-blocks.test.ts` 与 `selection-block-boundaries.test.ts`：共 12 项，验证范围裁剪、克隆、块类型、空段、单嵌套列表项、同 cell 多段及跨结构拒绝，新增空边界和嵌套路径的共享文字裁剪。
- `packages/core/tests/clipboard/export-html.test.ts`、`export-html-safety.test.ts`、`html-export-roundtrip.test.ts`：共 13 项，验证 HTML 片段、转义、属性白名单、链接/颜色过滤、代码与链接组合、默认下划线不外溢，以及组合 marks/元数据/代码块的 parser 往返。
- `packages/core/tests/clipboard/selection-list.test.ts`、`selection-list-ordered.test.ts`、`selection-list-task.test.ts`：共 19 项，验证列表片段、正反向裁剪、克隆、子列表/末项后代边界、编号调整、溢出与非法值、任务状态和嵌套列表自身导出。
- `packages/core/tests/clipboard/export-list-html.test.ts` 与 `export-list-boundaries.test.ts`：共 11 项，验证三类列表 HTML/parser 往返、属性过滤、单项片段兼容、父子/不同列表拒绝、空边界、嵌套独立根及安全降级。
- `packages/core/tests/history/list-clipboard.test.ts`：6 项，覆盖三类列表的正反向复制、正文富格式粘贴、编号/checked、一次撤销重做、选区恢复和源文档不变。
- `packages/core/tests/clipboard/selection-table.test.ts` 与 `selection-table-rows.test.ts`：共 10 项，覆盖双向裁剪、多段 cell、完整行与单列表格、片段克隆及部分跨行拒绝。
- `packages/core/tests/clipboard/export-table-html.test.ts`、`export-table-boundaries.test.ts`、`export-table-safety.test.ts`：共 14 项，覆盖表格/parser 往返、未选行列/段落隔离、单 cell 兼容、空边界、UTF-16、链接/代码/样式、转义、非法源表格及跨表回退。
- `packages/core/tests/history/table-clipboard.test.ts`：5 项，覆盖同一行/完整行的双向复制、正文粘贴、单条 History、撤销重做与源文档不变，以及现有 cell 的实际纯文本降级。
- `packages/core/tests/clipboard/selection-fragment.test.ts`：4 项，验证混合片段双向裁剪、完整结构、克隆和空边界；纯文本块范围仍交给原有路径。
- `packages/core/tests/clipboard/export-fragment-html.test.ts` 与 `export-fragment-boundaries.test.ts`：共 17 项，验证嵌套/有序/任务列表、表格/Divider、首尾块类型与 marks、代码字面内容、安全链接、UTF-16 复用、非法编号/marks/表格、临时图片与结构内部端点回退。
- `packages/core/tests/history/fragment-clipboard.test.ts`：5 项，验证双向复制与正文范围替换、块顺序、前后文字/选区、单条 History、源模型隔离，以及列表/代码块/cell 的实际纯文本降级与 rich-only 拒绝。
- `packages/core/tests/clipboard/image.test.ts` 与 `image-dimensions.test.ts`：共 19 项，验证 URL/状态、凭据拒绝、规范化、尺寸保留/省略、非法尺寸及源对象隔离。
- `packages/core/tests/clipboard/export-image-html.test.ts`、`export-image-safety.test.ts`、`export-image-boundaries.test.ts`：共 16 项，验证双向图文片段、URL/alt 转义、属性过滤、宽高往返、连续图片、未选不支持图片隔离、非法图片整段回退及列表/表格混排。
- `packages/core/tests/history/image-clipboard.test.ts`：5 项，验证双向图文粘贴、alt/尺寸、单条 History、撤销/重做、源模型隔离，以及列表/代码块/cell 的实际纯文本降级与 rich-only 拒绝。
- `packages/core/tests/clipboard/export-image-block.test.ts`：15 项，验证独立图片元数据、转义、状态/协议/凭据/尺寸、非法路径、其他块拒绝、无邻文和源模型隔离。
- `packages/core/tests/history/image-block-clipboard.test.ts`：5 项，验证独立图片粘贴、正反向文字范围替换、光标/单条 History、快照恢复及列表/代码块/cell 对 HTML 与空纯文本的拒绝。
- `packages/core/tests/history/image-cut.test.ts`：3 项，验证单张图片剪切后补段落或保留邻文、单条 History、无旧文字选区、元数据/文档隔离，以及剪切/粘贴两条独立记录的撤销/重做。
- `packages/react/tests/clipboard-copy-cut.test.ts`：105 项，覆盖受控/非受控、只读、宿主接管、多编辑器与外部选区、模型文字优先、IME、写入失败、Registry 缺失/禁用/异常/缺结果、跨 cell 保护及事务元数据；本轮新增 3 项验证原生剪切、Backspace、Delete 的独立 `beforeBlockSelection`，宿主记录后的图片高亮恢复和重做清除，既有失败保护保持通过。
- `tests/e2e/clipboard.spec.ts`：48 项 Chromium 用例，覆盖纯文本/HTML、撤销重做、目标降级、原生快捷键及手机控件；本轮新增 6 项验证桌面/手机单图剪切与粘贴独立 History、三处 ClipboardData 写入失败和临时图片拒绝，并扩展失焦/外部选区的剪切保护。
- `tests/e2e/image-history.spec.ts`：8 项，验证桌面/手机撤销后的图片高亮、无 DOM Range 再次复制/剪切/删除、快捷键、文字快照清除旧高亮和选中图片时隐藏悬浮文字工具栏。
- 同一浏览器文件另验证真实系统复制、剪切、粘贴快捷键往返；只该用例申请测试上下文的剪贴板权限，其他用例使用独立 DataTransfer，不共享系统剪贴板。
- `scripts/verify-package-exports.mjs`：构建包运行时与声明导出、`onCopy` / `onCut`、`deleteByCut`、`clipboardFormat` 与可选 `beforeSelection` 类型，以及纯文本/HTML parser 往返、链接代码组合、列表编号/checked、同一行/完整行表格、混合片段/图片元数据、独立图片块与联合类型声明、未选内容过滤、片段隔离和不支持图片回退。

## 本地结果

`pnpm check:all` 通过，包含格式、lint、全仓与包级类型检查、单测、构建、包产物和浏览器回归。详细数量见[全量回归](./full-regression.md)。

桌面 1280×720、手机 390×844 的 Playwright 截图已检查：新增格式控件文字可读，不超出视口；手机标签保持完整行显示。截图由 Playwright 输出目录管理，不写入仓库。

新增任务列表粘贴后的编辑器截图已检查，两个 checkbox 分别保持已完成/待办状态；撤销后消失，重做后结构和状态恢复。编号校验在加法前执行，字符串、BigInt、Symbol、非整数及溢出均有回归，未触发隐式转换或异常。

2026-10-26 桌面片段截图保留两格与首格的两个段落、粗体/斜体；手机 390×844 截图中的两行三列表格完整可读、不溢出或重叠。撤销/重做按解析后的 JSON 内容比较，不依赖对象属性的序列化顺序。

2026-10-27 桌面与手机混合片段截图已检查：标题、起始编号 5、两列表格、分隔线、已完成/待办任务和引用按原顺序显示，无未选前后文字，无表格溢出或内容重叠。

2026-10-28 图文截图复用已有 1×1 PNG 离线夹具，验证 `naturalWidth > 0`、alt/宽高属性、图文顺序及撤销后移除/重做后解码。桌面和手机 390×844 截图无溢出、重叠，黑色夹具不代表远端照片内容；未验证外部图片服务可达性。复制不发起图片读取或下载，粘贴渲染才由目标浏览器加载引用。

本轮独立图片桌面/手机截图继续使用同一离线夹具，无未选文字、溢出或重叠，重做后图片解码成功。焦点用例显式聚焦格式控件来模拟失焦；IME 和遗留 Range 用例先聚焦根、再设置文字范围，避免浏览器聚焦重置选区导致假覆盖。

2026-10-30 单图剪切后的粘贴截图已检查，1280×720 与 390×844 两种视口均无溢出、重叠，邻段保持原文，离线夹具解码及 alt/宽高属性通过。连续两次撤销/重做分别恢复粘贴前、剪切前及最终文档，不恢复块高亮。HTML 写入失败可以留下空纯文本，但图片模型、块选区和 History 均保持不变。本轮全量回归为 234 个 Vitest 文件/1762 项测试、226 项 Chromium 用例；不验证远端照片内容或系统剪贴板最终提交。

2026-10-31 Demo 接入块选区快照后，撤销恢复图片和高亮，重做清除；最终桌面/手机截图无旧文字工具栏遮挡或溢出，离线图片解码通过。全量本地检查为 236 个文件/1787 项单测与 234 项 Chromium 用例通过，新增可选快照字段不改变剪切范围、粘贴目标和焦点契约。

反向选区验收曾暴露受控回写将选区规范化为正向的问题，现已改为保留 anchor/focus；重新设置前仍清空旧浏览器选区，确保通过撤销/重做按钮恢复后继续输入会进入编辑事务，而不是仅修改 DOM。

## 保留边界

- 默认只输出纯文本；可选 HTML 支持文字、同层跨项列表、同一行跨 cell 与完整连续行表格片段、顶层正文混排及单张安全图片 BlockSelection。不导出任意跨层级列表、部分跨行/跨表内部结构、Markdown、其他类型 BlockSelection 或文件。
- 独立图片复制/可编辑单图剪切要求根聚焦，现有 DOM Range 不得越界；HTML 写图片和空纯文本，默认 plain/非法图片不写格式，不读取遗留文字。只读块选区和根可聚焦性由宿主管理，只读剪切不产生模型事务；受限目标不会用 alt/URL 猜造文字。
- 混合片段要求两端在顶层文本块，不支持的图片或所选源块校验失败时整段回退纯文本，不只导出剩余块；不扩大剪切或列表/代码块/cell 的富片段粘贴。
- 图片引用仅限模型 ready、无凭据的 HTTP/HTTPS；不输出 blob/loading/error 或字节 MIME，不验证远端资源。合法小数/过大尺寸省略相应属性，非法尺寸整段回退，源模型不变。
- 列表单项和单 cell 文字按 paragraph 导出，不保留编号、checked、嵌套层级或表格外壳；目标粘贴仍按当前 Command 能力选择 HTML 或实际纯文本。
- 同层跨项可保留所选列表结构、编号与 checked；最后项文字后的子列表不选入，嵌套片段不带祖先，跨不同列表/层级或编号非法仍回退。复制能力不扩展跨项剪切和列表目标富格式插入。
- HTML 第二次写入失败时，纯文本可能已写入事件数据，不承诺剪贴板回滚，但文档和 History 不变。HTML block 片段粘贴不保证任意部分选区的原段落结构往返。
- 复制范围可跨结构；文字剪切仍只覆盖 `deleteSelection` 支持的范围，不支持跨项、跨 cell 或穿越 void block 的删除。单图剪切仅复用 `deleteImage`，不支持多个图片块或其他 BlockSelection。
- 表格多段 cell 的纯文本输出不做 TSV 引号转义，不保证原表格往返。
- 同步 ClipboardData 写入成功不等同于操作系统最终提交成功，组件不额外申请系统权限。
- 浏览器回归仅在 Chromium 执行，未做真实桌面 Office、其他浏览器或系统菜单的跨平台人工验收。
