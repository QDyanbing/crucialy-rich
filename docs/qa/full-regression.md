# QA：0.1.0 全量回归

## 执行信息

- 日期：2026-11-13
- 版本：`0.1.0`
- 分支：`master`
- 命令：`pnpm check:all`

## 自动化结果

| 检查项     | 结果 | 说明                                                                                      |
| ---------- | ---- | ----------------------------------------------------------------------------------------- |
| Prettier   | 通过 | 全仓文件格式一致                                                                          |
| ESLint     | 通过 | 0 warning、0 error                                                                        |
| TypeScript | 通过 | 根工程与 core/react/demo 包级检查全部通过                                                 |
| Vitest     | 通过 | 311 个测试文件，2466 项测试                                                               |
| Core 构建  | 通过 | ESM、source map、类型声明生成成功                                                         |
| React 构建 | 通过 | ESM、source map、类型声明生成成功                                                         |
| Demo 构建  | 通过 | Vite 生产构建成功                                                                         |
| 包产物导入 | 通过 | 导出/声明、Clipboard、History、CodeBlock、Office、Native Input、Slash 与 Toolbar 冒烟通过 |
| Playwright | 通过 | Chromium 331 项测试                                                                       |

Demo 主 JS 产物约 516.13 KB，Vite 给出超过 500 KB 的非阻断分包提示；构建退出码为 0，本轮未调整打包策略。

## 核心路径

- 2026-11-13 Toolbar 手势与状态修正通过：执行事件 selection 在进入扩展前独立捕获，按下快照绑定文档、Registry、按钮命令及 payload 引用，执行/回调前消费；归属不一致取消，失效操作不通知 onCommand。pointercancel、宿主已取消的按下/点击释放快照，非主指针、中/右键和禁用按钮不捕获。每次渲染刷新可变 Registry 状态，不增加注册订阅。新增可选 disabled 和低层 onCommandCancel，Demo 的固定/悬浮按钮在组合输入期间锁定，恢复不复活旧手势。新增 60 项 React 单测覆盖正反向范围、九类默认命令正文/格式及单条 History、重入/失败重试、归属、缺失选区、取消/禁用、回调更新、多实例、StrictMode、卸载重挂与 SSR；构建包实际挂载两类工具栏并验证声明、快照、归属和取消。新增 8 项桌面/手机 Chromium 验证组合锁定/恢复、模型替换后的旧手势拒绝、宿主取消、格式及撤销重做，截图中文字和选区正常，无 pageerror。公开 API 仅增加可选项，模型与 History 策略不变；宿主需稳定引用，不检测原地修改、不重映射旧范围、不提供窗口级拖拽释放监听，不承诺扩展副作用回滚、其他宿主控件的禁用或真机 IME 全面兼容。
- 2026-11-09 Slash 安全执行通过：执行前重识别当前 paragraph 的精确 `/query`，拒绝过期文本、元数据不一致、多含前文、折叠/反向/跨块范围、非法端点及块类型变化，不查 Registry、不泄露清理事务。执行事件与有效导航 Range 独立，同树菜单 ID 不重复，SSR 水合保持稳定。新增 56 项 React 单测验证 Unicode/跨 marks/等价边界、全部十类默认命令的正文、层级、任务状态和单条 History，以及多实例/焦点/回调生命周期；构建产物验证公开入口和内部 helper 不外泄。新增 23 项 Chromium 验证活跃/原生 Composition 键盘、组合期间点击、修饰键、Shift+Enter 和宿主已取消事件，结束后可执行并撤销/重做；桌面与手机结果截图排版正常。命令矩阵断言加强后，该组 20 项单测另行复验通过。公开签名、模型和 Demo 示例不变，不比较文档身份/当前光标，不重映射旧范围；内部 ID 不可从配置拼接，独立 SSR 根仍须设置 identifierPrefix，真机 IME 全面兼容未由此保证。
- 2026-11-08 Composition 生命周期修正通过：活跃候选和通知独立复制 Range，宿主取消 update/end 生效，同一 compositionend 的 React beforeinput 回退不重复发事务。文字会话绑定文档引用，替换/只读/块选区清理旧候选，未配对结束不插入；无关 props/selection 更新保留原锚点。新增 6 项 Core、51 项 React 和 12 项 Chromium，覆盖通知变异、取消/失效/失败恢复、内嵌控件/多实例、受控 History、既有 batch 合并、StrictMode/卸载与构建包实际挂载。全量检查发现并修正图片块 start 的旧剪贴板保护冲突：使用无文字起点的 active 保护状态，保留复制/剪切/删除保护，结束只清理不写文字，原 105 项剪贴板测试继续通过。桌面/手机合成事件验证任务、代码、同 cell 正反范围、撤销重做和续编，截图内容与布局正常。API、模型、History 策略和 Demo 控件不变；受控 value 需稳定引用，不检测原地修改、不重映射旧锚点、不宣称所有平台真实 IME 事件序列已验收。
- 2026-11-07 原生换段与软换行通过：`insertParagraph` 复用现有 Enter 规则，Shift+Enter/`insertLineBreak` 复用文字 LF，不新增模型节点、Operation 或公共 Core API。新增 10 项 Core、86 项 React 和 12 项 Chromium 测试，覆盖普通/格式/结构容器、空引用、CodeBlock 退出差异、任务 checked/编号、cell 邻段、正反范围原子替换、LF 剪贴板数据、独立 History/受控续编、失败与宿主/只读/IME/选区归属、监听器/SSR。已选图片的键盘 Enter 即使没有 DOM Range 也不改旧文字。构建包验证四类原生编辑及新事务成员，桌面真实键盘/原生事件不重复入栈；浏览器 Range 几何和桌面/手机截图确认软换行实际分行，任务复选框、邻项与布局正常。`RichTextEditorInputType` 增加 `insertLineBreak`，穷尽 switch 需适配；显示需保留 LF 的 CSS。未增加 Demo 控件、独立 br 节点、targetRanges 扩展或不可取消事件修复，不宣称真机软键盘全面兼容。
- 2026-11-06 原生删除意图闭环通过：新增可选 `onNativeBeforeInput` 接收/取消原始 DOM InputEvent，可取消 `deleteContentBackward/Forward` 复用既有文字、范围、合并、void 和已选图片删除，事务类型、UTF-16 与结构边界保持原样。新增 88 项 React 单测和 12 项 Chromium，用例覆盖无 keydown、真实键盘单次入栈、History/续编、图片选中态恢复、任务 checked、cell 邻格、宿主/只读/IME/控件/选区归属、命令失败、最新 props/Registry、StrictMode/卸载与 SSR；构建包完成类型和实际挂载/卸载验证。桌面/手机截图已检查，图片离线夹具解码、高亮、尺寸及无工具栏遮挡通过。未新增 Core API、模型、Demo 控件、按词/软行删除、targetRanges 扩展或不可取消事件修复，不宣称真实 Android/iOS 软键盘全面兼容。
- 2026-11-05 字素删除闭环通过：折叠 Backspace/Delete 使用运行时 `Intl.Segmenter` 删除完整簇，修复 emoji/组合序列被单个 UTF-16 删除拆坏的问题；同一容器内跨 marks、链接、空文字占位或拆分代理对仍可删除，非法光标不进入结构回退。React Delete 只在真实段尾合并，不在中间格式叶子末尾提前合并下一段。新增 78 项 Core、24 项 React 和 14 项 Chromium 测试，覆盖九类文本容器、邻项/邻格元数据、History/续编、受控、只读、宿主、IME 和多实例保护，构建产物公开入口验证通过。桌面 1280×720 与手机 390×844 的删除结果截图已检查，文字格式保留且无溢出遮挡。公开 API/Point 仍为 UTF-16，显式范围不扩张；无新模型/示例、Unicode 规范化、polyfill、按词删除或软键盘 beforeinput 删除入口，手机视口不代表真实设备兼容性验收。
- 2026-11-04 History 状态引用隔离通过：修复初始化、空事务记录及追加/合并保留 entry 的共享引用；旧状态、新分支和重复栈位置独立。新增 53 项 Core、3 项 React 测试，覆盖任务子列表/编号、表格多段落、marks/link、图片元数据、文字/块选区、19 种 Operation、显式合并、撤销/重做与 Command 的各返回通道，以及宿主保留检查点后的撤销、重做和续编。构建产物验证初始化与两种策略下的三条记录路径，既有 250 项 Chromium 回归通过。本轮不改变 UI、Demo 示例、公开签名或合并规则；栈顶查询仍返回当前 entry 引用，未新增冻结、自动容量限制、持久化或通用宿主对象复制，复制成本随保留快照总体积增长。
- 2026-11-03 同步扩展异常边界通过：Command guard/execute/Registry 查找、状态查询、异常 message getter 和非 Error 抛出均转为失败/不可用；正常工具栏项继续可用，Slash 目标失败不暴露清理事务，修复后可重试并单次撤销。剪贴板 MIME 一次快照、源读取/parser/直接过滤回调异常中止、正常拒绝降级、Office 来源预检及后续恢复通过。React 键盘 failure 不继续旧删除 fallback，图片失败不误用旧文字范围，Enter/格式快捷键不退回原生 DOM 修改，Delete 合并保留实际 before 光标。新增 41 项 Core、49 项 React 和 8 项桌面/手机 Chromium 用例，构建包公开入口与既有 API 通过；故障注入后的模型/DOM/选区/History 保持、正常复制/粘贴与撤销重做、无 pageerror 及截图检查通过。不承诺异步错误、宿主回调、React 构造事件前的原生 clipboardData 属性异常或扩展副作用回滚；候选 guard 异常转 false 后，仅后续被明确允许的实际格式可继续。
- 2026-11-01 DOM 端点映射修正通过：文字元素按真实子节点边界换算，拆分 Text 累计 UTF-16 前缀，反向恢复不截到首节点末尾；段落/标题/引用/代码块、普通与任务项、cell 内 paragraph、外层排版空白/注释、checkbox 与子列表边界、空叶子、异常路径及越界保护通过。新增 59 项 Core 与 15 项 React 测试覆盖正反向范围、剪切 History、输入/ref、多实例归属及模型内容来源；构建包验证同一行为和既有声明。新增 8 项桌面/手机 Chromium 用例验证完整复制、剪切/粘贴独立撤销、拆分节点原生输入与续编、任务 checked/邻项保留，截图无溢出或遮挡。不导入 DOM 改写内容、不新增 API/模型/示例、不扩大嵌套包装、根/表格结构端点或跨结构编辑范围。
- 2026-10-31 图片块选区 History 闭环通过：可选快照第三参数、独立路径克隆、undo/redo 与 Command 结果透传、两种合并策略的块选区边界、旧快照兼容及空事务不入栈通过。React 原生图片键盘删除/剪切输出 `beforeBlockSelection`，宿主记录后撤销可恢复高亮，重做清除；仅图片文档与剪切/粘贴独立 History 通过。新增 22 项 Core、3 项 React 和 8 项 Chromium 用例，构建运行时/声明同步。桌面/手机无 DOM Range 再次复制/删除、快捷键、旧高亮清除、离线图片解码及截图通过；图片选中与 History 应用时清除旧文字悬浮工具栏锚点，手机遮挡修复。焦点/路径校验仍由宿主负责，不扩大多块、cell 或剪切能力。
- 2026-10-30 单图剪切通过：React HTML 模式复用 `deleteImage`，全部格式写入成功才删除，通知清除受控块选区，输出无 batch 的独立 `deleteByCut`。默认 plain、不安全图片、只读、宿主/IME、焦点/DOM 归属、命令缺失/禁用/异常/缺结果及写入失败保护通过；仅图片文档补空段落仍是一次 History。修正图片删除旧选区快照，无合法文字范围时省略 `beforeSelection`，构建声明同步；历史快照可直接接收缺省选区，撤销不恢复图片块高亮。新增 3 项 Core History、25 项 React 和 6 项 Chromium 用例，桌面/手机剪切与粘贴独立撤销/重做、离线图片解码/尺寸及无溢出截图通过。不扩展跨图片文字范围剪切、受限目标或文件 MIME。
- 独立图片 BlockSelection 导出的元数据/安全规则、非法路径/其他块拒绝、联合类型声明和带宿主 `type` 元数据的旧文字范围兼容通过。React 的聚焦/DOM 归属、无 Range/遗留文字、默认 plain、聚焦只读、宿主/IME、非法图片和写入失败保护通过；图片块剪切不误删文字。Core/History 与五条新增 Chromium 用例验证单张图片正文粘贴、一次撤销重做及受限目标对空纯文本的拒绝，桌面/手机离线夹具截图无溢出或邻文，不验证远端服务。
- 安全图片引用的 ready/协议/凭据检查、alt 转义、宽高保留/省略、连续图片、选区边界、未选不支持图片隔离和整段回退通过。Core、React、History 与构建产物验证纯文本、只读、宿主、DOM 隔离、写入失败、正文图文粘贴/单条 History 及受限目标降级；此前六条 Chromium 用例通过。离线 PNG 解码与桌面/手机截图通过，不验证外部图片服务，不新增跨图片文字范围剪切或文件 MIME。
- 顶层混合片段的首尾裁剪、块顺序、完整嵌套列表/表格/Divider、有序编号、任务 checked、安全 marks/链接、代码字面文字、空边界、片段隔离、非法源块/不支持图片/结构内部端点回退通过。Core、React、History 和构建产物验证默认 plain、只读、宿主接管、写入失败、正文粘贴、单条撤销重做与受限目标降级；此前四条 Chromium 用例及桌面/手机截图通过，不扩大跨结构剪切范围。
- 表格 HTML 复制的同一行跨 cell/完整连续行、双向首尾裁剪、多段与空段 cell、未选行列隔离、安全文字格式/链接、非法源表格和部分跨行/跨表拒绝通过。Core、React、History 与构建产物验证纯文本兼容、只读、写入失败、正文粘贴及一次撤销重做；五条新增 Chromium 用例覆盖桌面/手机，截图无溢出或重叠。单 cell 仍为 paragraph，不扩大跨 cell 剪切或表格目标富片段插入。
- 同层列表片段的 bullet/ordered/task 结构、正反向首尾裁剪、编号调整与加法前校验、checked、选区内子列表、未选后代/祖先隔离、跨层级拒绝、默认 plain 兼容、复制不入 History 及跨项剪切拒绝通过。新增六条 Chromium 用例与构建包验证复制/粘贴/撤销/重做，任务截图状态正确；不扩大跨项删除或粘贴目标范围。
- 可选 HTML 导出的范围裁剪、marks/链接安全白名单、代码与链接组合、默认链接下划线隔离、parser 往返及构建包运行时/声明验证通过。React 默认 plain 兼容、HTML 双格式与第二次写入失败不删除通过；此前七条 Chromium 用例覆盖模式切换、复制粘贴、正反向剪切、目标降级和手机控件，桌面/手机截图已检查。仍不导出任意跨层级列表或部分跨行/跨表结构，不扩大剪切/粘贴目标范围。
- 模型纯文本复制、结构分隔与非法边界、剪切 Command/History、React 受控/非受控/只读/宿主/IME/Registry/写入失败/多实例保护，以及公共包类型与剪切粘贴往返均通过。新增九条 Chromium 用例覆盖只读链接、跨块、同 cell、跨 cell 拒绝、原生快捷键和 History；反向选区同步修复后，方向恢复与继续输入均通过。范围与跨平台限制见[复制与剪切验收](./copy-cut.md)。
- History 可选相邻合并的 19 条 Core 与 4 条 React 测试通过，默认 batch 兼容、合法折叠 Point、缺失/非法/非折叠选区、不同模型 path、redo 分支与空事务均有覆盖。新增五条 Chromium 用例验证表格 Tab、段内/跨段光标跳变、选区替换及撤销后续编的分步撤销、重做与光标恢复；构建包验证两种策略、默认行为、类型声明和 entry 结构不变。
- 表格相邻 cell 查询、行优先跨行导航、同 cell 正反向范围、非法/跨 cell/跨表边界、独立路径、当前行列尺寸、TSV/Enter 后导航及输入 History 的 Core 验证通过；React 受控/非受控、DOM/ref 同步、cell 高亮、IME/修饰键/宿主/只读保护、列表回归及多实例隔离通过。Chromium 七条导航用例和构建包导出/声明、输入撤销冒烟通过；导航不新增事务或扩表。
- HTML／Markdown 普通段落的图文混排、包装图片、连续图片、URL/属性过滤、文字 marks/链接、换行、引用式 Markdown 图片、代码字面语法、容器边界、正反向范围、末尾图片光标、单条 History 与续编的 Core/React/包产物验证通过；Chromium 七条用例覆盖 HTML/Markdown 优先级、实际图片加载、撤销重做、受限目标纯文本降级和 Office rich-only 拒绝。
- Office 来源的 Mso 类名、mso 样式、命名空间和 generator 元数据识别、误判边界、实际纯文本降级、rich-only 拒绝、直接富格式入口拒绝、无匹配 parser 不读取、自定义 parser、正反向范围和 History 的 Core/React/包产物验证通过；Chromium 六条用例验证正文、代码、cell TSV 与选区、History 和续编。未执行真实桌面 Word/Excel/PowerPoint 的跨平台剪贴板兼容性验收。
- 文档模型、Selection、Operation、Transaction、Command 和 History 全量单测通过。
- CodeBlock 多行粘贴、LF/缩进/空行、规范化起点策略、片段形状拒绝、富格式降级、归一化光标、UTF-16 offset、History、继续输入与构建产物冒烟通过；代码块单节点和既有 Enter 退出规则保持正常。
- Clipboard 可选候选过滤、默认优先级兼容、目标降级、实际纯文本保留、History、默认 DOM 写入保护、宿主/只读/Registry 策略、失败不重试及构建产物调用的 Core/React/Chromium 路径通过。
- 同一普通/有序/任务列表项内纯文本插入与替换、多行拆项、空项保留、二/三层嵌套、原子树归属、start/checked、History、宿主拦截及继续输入的 Core/React/Chromium 路径通过，跨项与富片段继续被 Core 拒绝。
- 基础编辑、文字样式、链接、块结构、列表、图片、粘贴、表格、输入法、快捷键和输入规则浏览器回归通过。
- HTML 表格解析、Command 插入、History 往返、React 原生事件和 Demo 两条浏览器粘贴路径均通过。
- HTML 图片 URL/属性过滤、独立图片段落、Command/History、React 原生事件和 Chromium 粘贴路径均通过。
- HTML 任务列表识别、checked/marks/link 保留、安全降级、Command/History、React 与 Chromium 粘贴路径均通过。
- HTML `hr` 与 Markdown 分隔线解析、混合块顺序、安全降级、Command/History、React 与 Chromium 粘贴路径均通过。
- HTML `b/i/u/s/strike/del` 标记别名、嵌套组合、安全链接、Command/History、React 与 Chromium 粘贴路径均通过。
- HTML `font-size`、`color`、`background-color` 白名单、嵌套覆盖、安全降级、列表/表格复用、Command/History、React 与 Chromium 粘贴路径均通过。
- HTML `font-weight`、`font-style`、`text-decoration` boolean mark 映射、合法重置、组合继承、安全降级、列表/表格复用、Command/History、React 与 Chromium 粘贴路径均通过。
- Inline Code 模型、编辑保留、Command、语义渲染、默认 Toolbar、HTML/Markdown 粘贴、History、React 与 Chromium 路径均通过。
- 清除格式 operation、单块与跨块 Command、collapsed 输入占位、默认 Toolbar、History 和 Chromium 路径均通过。
- 列表项及同一表格单元格连续段落内的 boolean mark、文字属性、链接、清除格式、正反向状态、History、React 快捷键和 Toolbar Chromium 路径均通过。
- 同一 cell 跨段落范围删除、输入替换、Composition 事件提交、选区 Enter、边界 marks/link 保留、空段落、结构拒绝、选区映射及 History 的 Core/React/Chromium 路径通过；邻格与行列结构不变。
- 连续顶层纯文本/HTML/Markdown 范围粘贴、同 cell 多段落纯文本/TSV 替换、删除后插入点恢复、结构拒绝、History 与继续输入的 Core/React/Chromium 路径通过；折叠光标 TSV 填表回归通过。
- HTML 链接 target/rel 规范化、安全降级、任务列表与表格复用、Command/History、React 与 Chromium 粘贴路径均通过。
- HTML 三层嵌套普通/任务列表、混合类型、marks/链接、深层选区、Command/History、React 与 Chromium 粘贴路径均通过。
- OrderedList 安全整数起始编号、规范化、渲染、前后段续编、HTML 粘贴、Command/History、React 与 Chromium 路径均通过。
- 受控、非受控、只读、ref 状态读取和 ref Command 执行测试通过。
- Demo 的 20 个模型示例继续按五个验收区域展示，本轮复用常规文档验证剪贴板失败和恢复，未新增示例 ID；DOM 边界、列表、表格、图片与 History 的既有回归继续通过。

## 结论

未发现阻断 `0.1.0` 发布候选的回归。当前仍需由维护者决定 tag 和 npm 发布时机。
