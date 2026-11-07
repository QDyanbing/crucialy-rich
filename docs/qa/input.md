# QA：输入事件闭环

## 范围

验证输入、Backspace、Delete 和 Enter 通过 command/transaction 更新模型，同时覆盖 CodeBlock 换行/退出与 Divider 前后删除。

## 自动化测试

- `packages/core/tests/input/insert-text.test.ts`：输入文本转换为 `insert_text` transaction、反向 selection 规范化、通过 operation pipeline 应用、输入后 selection 落点。
- `packages/core/tests/input/backspace.test.ts`：Backspace 转换为 `delete_text` 或 `merge_block` transaction、段中删除、段首合并、空段删除、首段开头 no-op 和 selection 落点。
- `packages/core/tests/input/delete.test.ts`：Delete 转换为 `delete_text` 或 `merge_block` transaction、段中删除、段尾合并、空段删除、末段结尾 no-op 和 selection 落点。
- `packages/core/tests/input/enter.test.ts`：Enter 转换为 `split_block` transaction、段首/段中/段尾/空段分裂、非折叠 selection no-op 和 selection 落点。
- `packages/core/tests/input/tab.test.ts`：列表 Tab/Shift+Tab、首项 no-op、三层上限和 selection 落点。
- CodeBlock 与 Divider 测试：代码块换行/退出、void block 相邻 Backspace/Delete 和选区 path 调整。
- `packages/core/tests/command/insert-text.test.ts`：collapsed 插入、同容器跨 text 替换和跨顶层文本块替换。
- `packages/core/tests/command/delete-selection.test.ts`：同容器跨 text 与跨顶层文本块的 Backspace/Delete 共用删除命令。
- `packages/core/tests/command/split-block.test.ts`：collapsed、同容器与跨块选区 Enter，以及 CodeBlock、列表项和结构边界。
- `packages/core/tests/operation/delete-range.test.ts`：跨块范围校验、正反向删除、块类型与 marks 边界、选区映射和非法结构拒绝。
- `packages/core/tests/command/block-type-interaction.test.ts`：Block Type 切换后继续输入，文字、marks 和选区保持稳定。
- `packages/react/tests/public-api.test.ts`：可编辑语义、输入 transaction 与组件回调契约。
- `tests/e2e/demo-shell.spec.ts`：真实输入、range 删除、Backspace/Delete 合并、Enter 分段、Quote 内输入/删除/换行、History 和组合编辑。

命令：

```sh
pnpm test
pnpm test:e2e
```

## 字素删除回归（2026-11-05）

- `character-range.test.ts`：9 项，验证代理对、组合重音、肤色、旗帜、ZWJ、键帽、CRLF、簇内光标及容器边界；内部范围 helper 未新增公共包导出。
- `backspace-unicode.test.ts` / `delete-unicode.test.ts`：各 8 项，验证两个方向整体删除、韩文组合、簇内 UTF-16 光标、合法恢复点与源模型不变。
- `character-containers.test.ts`：22 项，覆盖 paragraph、heading、quote、codeBlock、普通/有序/任务列表项、嵌套项与 cell paragraph，保留 marks/link、start/checked、子列表、邻段/邻格；拆到不同 marks 叶子的代理对也按完整簇删除。
- `character-boundaries.test.ts`：21 项，验证非法 offset/path 不触发结构回退、显式范围不扩张及空格式占位之间的删除。
- `packages/core/tests/history/character-deletion.test.ts`：10 项，验证一次删除的一条事务、原 UTF-16 光标/格式恢复、重做和独立续编；以上共新增 78 项 Core 测试。
- React 新增 24 项：`forward-merge-boundary.test.ts` 3 项，验证中间叶子末尾不合并、无关失败 merge 扩展不被调用及真实段尾合并；`character-deletion.test.ts` 10 项，验证按键事务、旧光标、无 typing batch 和链接保留；`character-deletion-guards.test.ts` 11 项，验证只读/宿主/IME、受控回传及多实例隔离。
- Chromium 新增 14 项：`character-deletion.spec.ts` 8 项，使用桌面真实键盘验证整簇删除、History 和续编；`character-structured.spec.ts` 6 项，在手机视口验证跨格式删除、任务勾选及表格邻格/邻段保留。富格式粘贴保留前置空段，测试按实际模型定位目标段，不假定它必为第一段。
- 构建入口冒烟验证两个方向的 Unicode 删除、跨格式、非法点、UTF-16 结果与 History。桌面/手机截图已查看，删除后文字、链接样式及未选段落正常，无溢出或遮挡；本轮未新增 Demo 样例或控件。
- 本地 `pnpm check:all` 退出码 0：格式、lint、根工程与包级类型、269 个文件/2109 项单测、构建/包产物与 264 项 Chromium 全部通过，详见[全量回归](./full-regression.md)。

## 原生删除回归（2026-11-06）

- 新增 `onNativeBeforeInput`，同步观察根节点原始 beforeinput，宿主可取消。两个可取消的原生删除类型复用键盘管线，不伪造 React 合成事件，不新增 Core API、事务类型或 Demo 控件。
- React 新增 88 项：`native-input-hook` 5 项、`native-delete-backward` 8 项、`native-delete-forward` 9 项、`native-delete-image` 8 项、`native-delete-guards` 22 项、`native-delete-history` 4 项、`native-input-lifecycle` 7 项、`native-delete-errors` 24 项，公开 API 文件新增 1 项 SSR 回归。
- 覆盖无 keydown 的整簇与显式范围、真实边界合并、相邻 void、图片优先/失败不退回文字、无 DOM Range、图片单节点修复、History 和受控续编；只读、宿主取消、组合期、不可取消事件、内嵌控件、无归属选区及跨 cell 拒绝均保持模型不变。
- 验证 Registry 查找/guard/execute failure 不继续 fallback；普通折叠 guard 返回 false 仍保留原 helper 行为，不扩大 Registry 的权限语义。props、文档、回调和 Registry 更新后不读取旧闭包，StrictMode 单次提交，卸载删除监听器。
- Chromium 新增 12 项：`native-deletion.spec.ts` 6 项，覆盖桌面合成原生事件、反向跨段范围、History/续编和真实键盘单次入栈；`native-deletion-mobile.spec.ts` 6 项，覆盖任务、cell 和图片选区恢复后再次删除。图片使用已解码的离线 PNG 夹具，不验证外部图片服务。
- 构建产物检查验证可选 InputEvent 回调声明、SSR 不执行/不序列化回调、实际挂载后的两个删除方向与卸载清理。桌面 1280×720 与手机 390×844 的截图已查看，内容和图片高亮清楚，无溢出或工具栏遮挡。
- 本地 `pnpm check:all` 退出码 0：277 个文件/2197 项 Vitest、276 项 Chromium，格式、lint、根工程/包级类型、构建及公开包检查全部通过。主 JS 约 513.99 KB，已有非阻断分包提示不变，详见[全量回归](./full-regression.md)。
- 平台范围：Chromium 合成原生事件与键盘验证不等同于真机软键盘验收；不转换 deleteWord/软行等类型，不读取 targetRanges 扩张选区，也不事后修复不可取消 beforeinput 的 DOM 修改。

## 换段与软换行回归（2026-11-07）

- 原生 `insertParagraph` 接入现有 `splitBlock`，Shift+Enter 和原生 `insertLineBreak` 通过现有 `insertText` 插入 LF。新增软换行事务类型，两个操作均无 typing batch；不新增 Core API、模型节点、Operation 或 Demo 控件。
- Core 新增 `line-break-contract.test.ts` 10 项，验证六类文字容器、UTF-16、正反跨块范围、CodeBlock 字面 LF 不退出，以及模型纯文本/HTML 剪贴板数据保留 LF。
- React 新增 86 项：`line-break-keyboard` 8 项、`native-paragraph` 7 项、`native-line-break` 7 项、`newline-containers` 14 项、`newline-ranges` 12 项、`newline-protections` 26 项、`newline-history` 3 项、`newline-lifecycle` 8 项，公开 API 文件新增 1 项 SSR 回归。
- 覆盖段首/中/尾、marks/link、列表 start/checked 与子列表、空引用退出、CodeBlock 双 Enter 与软换行差异、cell 内多段落和邻格保留；范围只删除显式端点，不跨 cell。命令禁用/查找/guard/execute 异常、只读、宿主取消、IME、不可取消事件、无 DOM 选区和图片块保护均不提交错误事务。
- 受控宿主明确接受 after/selection 后才更新内容，undo/redo 恢复原光标和结构；续编独立撤销。StrictMode、最新回调/Registry、卸载和多实例监听器隔离继续通过。
- Chromium 新增 12 项：`newline.spec.ts` 6 项，验证物理 Enter/Shift+Enter、原生两种意图、反向跨段范围、一次入栈/撤销重做与续编；通过文字 Range 的几何位置确认 LF 显示为两行。`newline-mobile.spec.ts` 6 项，验证任务拆项/保留 checked、cell 分段/软换行和代码块退出差异。
- 构建包实际挂载验证四种原生编辑、软换行事件与无 batch、类型声明和监听器清理。桌面 1280×720、手机 390×844 截图已查看：软换行分行、任务复选框、编号与邻项正常，无溢出遮挡。
- 本地 `pnpm check:all` 退出码 0：286 个文件/2293 项 Vitest、288 项 Chromium，格式、lint、根工程/包级类型、构建及公开包检查全部通过。Demo 主 JS 约 514.47 KB，已有非阻断分包提示保留，详见[全量回归](./full-regression.md)。
- 集成限制：`RichTextEditorInputType` 新增 `insertLineBreak`，穷尽 switch 需补分支；LF 复用文字叶子，宿主须以 `white-space: pre-wrap` 等 CSS 显示，不保证外部应用排版。没有独立 br、软行删除、targetRanges 选区扩展或不可取消事件 DOM 修复，手机视口不等于真机软键盘兼容性验收。

## 手测场景

| 场景           | 操作                                   | 期望                              | 结果 |
| -------------- | -------------------------------------- | --------------------------------- | ---- |
| 单字符输入     | 在主编辑区光标处输入一个字符           | 文档 JSON 插入该字符              | 通过 |
| 连续输入       | 在主编辑区连续输入多个字符             | 字符按顺序插入，光标持续前进      | 通过 |
| 模型更新来源   | 输入时触发 `beforeinput`               | 通过 transaction 更新 model       | 通过 |
| 输入后选区     | 输入后读取选区 JSON                    | selection 折叠到插入文本后        | 通过 |
| 外部事件拦截   | 外部 `onBeforeInput` 已 preventDefault | 内部不再创建 transaction          | 通过 |
| 非可编辑渲染   | 不传 `contentEditable`                 | 不处理输入，保持只读语义          | 通过 |
| 可编辑语义     | 传入 `contentEditable`                 | 根节点 `aria-readonly` 为 `false` | 通过 |
| 连续输入稳定性 | 输入两个中文字符                       | 第二个字符插入到第一个字符之后    | 通过 |
| 选区替换       | 跨 text 或连续文本块选中文字后输入     | 先删除选区，再插入输入文字        | 通过 |
| 选区删除       | 跨 text 或连续文本块选中后按删除键     | 删除选区并折叠到起点              | 通过 |
| 段中 Backspace | 光标在 text 节点中间按 Backspace       | 删除光标前一个字符                | 通过 |
| 段首 Backspace | 第二段开头按 Backspace                 | 当前段合并到上一段                | 通过 |
| 空段 Backspace | 空段开头按 Backspace                   | 空段被并入上一段                  | 通过 |
| Backspace 选区 | Backspace 后读取选区 JSON              | selection 落到删除或合并后的落点  | 通过 |
| 段中 Delete    | 光标在 text 节点中间按 Delete          | 删除光标后一个字符                | 通过 |
| 段尾 Delete    | 第一段结尾按 Delete                    | 下一段合并到当前段                | 通过 |
| 空段 Delete    | 非末段空段开头按 Delete                | 下一段被并入当前空段              | 通过 |
| Delete 选区    | Delete 后读取选区 JSON                 | selection 落到删除或合并后的落点  | 通过 |
| 段中 Enter     | 光标在 text 节点中间按 Enter           | 当前段分裂为两个段落              | 通过 |
| 段首 Enter     | 光标在段首按 Enter                     | 前方创建空段，文本进入下一段      | 通过 |
| 段尾 Enter     | 光标在段尾按 Enter                     | 后方创建空段                      | 通过 |
| 空段 Enter     | 空段内按 Enter                         | 创建新的空段                      | 通过 |
| 选区 Enter     | 跨 text 或连续文本块选中后按 Enter     | 删除选区并在起点分段              | 通过 |
| Enter 后输入   | Enter 后继续输入文字                   | 文本进入新段开头                  | 通过 |
| 组合编辑       | 输入文字后 Enter，再输入并按 Delete    | 文档分段、删除和选区都稳定        | 通过 |
| 合并后输入     | 第二段段首 Backspace 后继续输入        | 合并段落保持合法并继续插入文本    | 通过 |
| Quote 输入     | Quote 内输入、删除并按 Enter           | Quote 类型、文字和选区保持稳定    | 通过 |
| 空 Quote 退出  | 空引用或选区清空引用后按 Enter         | 原地转为正文，History 可往返      | 通过 |
| CodeBlock 输入 | 输入、Enter 换行、连续 Enter 退出      | 纯文本和后续 paragraph 稳定       | 通过 |
| Divider 删除   | 从前后文本边界按 Delete/Backspace      | Divider 删除且选区保持合法        | 通过 |
| 列表 Enter     | 非空项分裂，空项退出                   | 项目和三层选区保持合法            | 通过 |
| 列表缩进       | 按 Tab、Shift+Tab 或项目开头 Backspace | nested 结构、内容和选区保持合法   | 通过 |
| 任务勾选       | 点击任务项 checkbox                    | checked 写回模型并可撤销          | 通过 |
| History        | 执行真实输入后撤销和重做               | 文档、Block Type 和选区正确往返   | 通过 |

## 当前限制

- 范围替换与删除接受同一文本容器、连续顶层文本块或同 cell 连续 paragraph，不跨列表项、不同 cell、进出表格、图片和分隔线。
- 整簇删除作用于键盘及已支持的可取消原生折叠删除，依赖运行时 `Intl.Segmenter`，没有内置 polyfill；Point、DOM 与显式范围仍使用 UTF-16 offset。手机视口和合成原生事件不构成真实软键盘/输入法验收，不支持按词删除、字素光标导航或不可取消事件的 DOM 修复。
- `createEnterInputTransaction` 低层 helper 仍只接受 collapsed selection；范围删除由 `splitBlockCommand` 组合。
- 原生 `insertParagraph` 与普通 Enter 复用现有规则；Shift+Enter/原生 `insertLineBreak` 为文字 LF，不拆块，新增同名事务类型。显示依赖保留 LF 的 CSS，暂不生成独立 br 或自动适配外部应用排版。
- React 组件通过 `onTransaction` 暴露记录入口，但 History 状态仍由宿主维护。
- 拖拽输入仍未实现。

## 结论

输入已接入 Command、Transaction、History 和文本/void block 流程。当前已验证同容器跨 text、连续顶层文本块、CodeBlock 与 Divider 边界；结构节点之间的跨块编辑继续保持显式限制。
