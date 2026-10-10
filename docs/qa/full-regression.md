# QA：0.1.0 全量回归

## 执行信息

- 日期：2026-10-10
- 版本：`0.1.0`
- 分支：`master`
- 命令：`pnpm check:all`

## 自动化结果

| 检查项     | 结果 | 说明                                      |
| ---------- | ---- | ----------------------------------------- |
| Prettier   | 通过 | 全仓文件格式一致                          |
| ESLint     | 通过 | 0 warning、0 error                        |
| TypeScript | 通过 | 根工程与 core/react/demo 包级检查全部通过 |
| Vitest     | 通过 | 160 个测试文件，1138 项测试               |
| Core 构建  | 通过 | ESM、source map、类型声明生成成功         |
| React 构建 | 通过 | ESM、source map、类型声明生成成功         |
| Demo 构建  | 通过 | Vite 生产构建成功                         |
| 包产物导入 | 通过 | core/react 运行时导出与声明文件校验成功   |
| Playwright | 通过 | Chromium 125 项测试                       |

## 核心路径

- 文档模型、Selection、Operation、Transaction、Command 和 History 全量单测通过。
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
- 列表项与表格单元格段落内的 boolean mark、文字属性、链接、清除格式、React 快捷键和 Toolbar Chromium 路径均通过。
- HTML 链接 target/rel 规范化、安全降级、任务列表与表格复用、Command/History、React 与 Chromium 粘贴路径均通过。
- HTML 三层嵌套普通/任务列表、混合类型、marks/链接、深层选区、Command/History、React 与 Chromium 粘贴路径均通过。
- OrderedList 安全整数起始编号、规范化、渲染、前后段续编、HTML 粘贴、Command/History、React 与 Chromium 路径均通过。
- 受控、非受控、只读、ref 状态读取和 ref Command 执行测试通过。
- Demo 的 16 个模型示例按五个验收区域展示，原有示例 ID 和行为保持不变。

## 结论

未发现阻断 `0.1.0` 发布候选的回归。当前仍需由维护者决定 tag 和 npm 发布时机。
