# QA：0.1.0 全量回归

## 执行信息

- 日期：2026-09-25
- 版本：`0.1.0`
- 分支：`master`
- 命令：`pnpm check:all`

## 自动化结果

| 检查项     | 结果 | 说明                                      |
| ---------- | ---- | ----------------------------------------- |
| Prettier   | 通过 | 全仓文件格式一致                          |
| ESLint     | 通过 | 0 warning、0 error                        |
| TypeScript | 通过 | 根工程与 core/react/demo 包级检查全部通过 |
| Vitest     | 通过 | 131 个测试文件，994 项测试                |
| Core 构建  | 通过 | ESM、source map、类型声明生成成功         |
| React 构建 | 通过 | ESM、source map、类型声明生成成功         |
| Demo 构建  | 通过 | Vite 生产构建成功                         |
| 包产物导入 | 通过 | core/react 运行时导出与声明文件校验成功   |
| Playwright | 通过 | Chromium 108 项测试                       |

## 核心路径

- 文档模型、Selection、Operation、Transaction、Command 和 History 全量单测通过。
- 基础编辑、文字样式、链接、块结构、列表、图片、粘贴、表格、输入法、快捷键和输入规则浏览器回归通过。
- 受控、非受控、只读、ref 状态读取和 ref Command 执行测试通过。
- Demo 的 16 个模型示例按五个验收区域展示，原有示例 ID 和行为保持不变。

## 结论

未发现阻断 `0.1.0` 发布候选的回归。当前仍需由维护者决定 tag 和 npm 发布时机。
