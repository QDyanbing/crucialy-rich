# QA：0.1.0 全量回归

## 执行信息

- 日期：2026-10-26
- 版本：`0.1.0`
- 分支：`master`
- 命令：`pnpm check:all`

## 自动化结果

| 检查项     | 结果 | 说明                                                   |
| ---------- | ---- | ------------------------------------------------------ |
| Prettier   | 通过 | 全仓文件格式一致                                       |
| ESLint     | 通过 | 0 warning、0 error                                     |
| TypeScript | 通过 | 根工程与 core/react/demo 包级检查全部通过              |
| Vitest     | 通过 | 221 个测试文件，1614 项测试                            |
| Core 构建  | 通过 | ESM、source map、类型声明生成成功                      |
| React 构建 | 通过 | ESM、source map、类型声明生成成功                      |
| Demo 构建  | 通过 | Vite 生产构建成功                                      |
| 包产物导入 | 通过 | 导出/声明、Clipboard、CodeBlock 与 Office 产物冒烟通过 |
| Playwright | 通过 | Chromium 205 项测试                                    |

Demo 主 JS 产物约 508.43 KB，Vite 给出超过 500 KB 的非阻断分包提示；构建退出码为 0，本轮未调整打包策略。

## 核心路径

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
- Demo 的 18 个模型示例按五个验收区域展示，本轮新增中文“表格复制”样例，原有示例 ID 和行为保持不变。

## 结论

未发现阻断 `0.1.0` 发布候选的回归。当前仍需由维护者决定 tag 和 npm 发布时机。
