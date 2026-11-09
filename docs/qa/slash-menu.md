# QA：斜杠菜单闭环

## 能力矩阵

| 场景         | 预期                                                      | 状态 |
| ------------ | --------------------------------------------------------- | ---- |
| 配置校验     | 空字段与重复 ID 被拒绝，输入配置被防御性复制              | 通过 |
| 默认目录     | 正文、标题、引用、代码块、三类列表和分割线均可发现        | 通过 |
| 查询过滤     | 中文、英文关键词忽略大小写并按前缀匹配                    | 通过 |
| 触发识别     | 仅 paragraph 折叠光标的段首或空白后 `/query` 生效         | 通过 |
| 浮层定位     | 菜单靠近光标、可上下翻转且不超出视口                      | 通过 |
| 关闭行为     | Escape 关闭当前菜单且不修改正文                           | 通过 |
| 键盘选择     | ArrowUp/ArrowDown 首尾循环，Enter 执行活动项              | 通过 |
| 触发文本清理 | 同一 text 或跨 mark text 的 `/query` 都不会残留           | 通过 |
| History      | 清理与目标命令合并为一次 Transaction，可一次撤销          | 通过 |
| 失败保护     | 目标命令失败时不提交仅清理触发文本的 Transaction          | 通过 |
| 触发复核     | 失效文字、非法/多含前文/跨块范围不查 Registry、不输出事务 | 通过 |
| 快照隔离     | 执行事件、有效导航分支的 trigger/Range/path 独立          | 通过 |
| 多实例与水合 | 同树 DOM ID 唯一，水合稳定，pointerdown 不转移焦点        | 通过 |
| 组合输入     | 活跃/原生组合键盘与活跃组合点击不执行菜单，结束后恢复     | 通过 |
| 宿主与修饰键 | 已取消事件不操作菜单，修饰键绕过菜单，Shift+Enter 保留 LF | 通过 |

## 自动化入口

- React 单测：`packages/react/tests/slash-menu-*.test.ts`、`floating-slash-menu.test.ts`。
- `packages/react/tests/slash-menu-errors.test.ts`：5 项验证目标 Registry/guard/execute 抛错时返回失败、不暴露清理事务、源 `/query` 保留；正常禁用仍 skipped，修复后可重试，触发清理和目标事务组成单条 History 并正确撤销/重做。
- `slash-menu-stale.test.ts` / `slash-menu-range-boundaries.test.ts`：18 项验证当前文本、元数据、精确边界与结构拒绝；命令注册表不被调用，源模型不变。
- `slash-menu-marked-range.test.ts` / `slash-menu-history.test.ts`：27 项验证空查询、中文/emoji/组合重音、跨格式及等价叶子边界，以及十类默认命令的正文、层级、任务状态和一次撤销/重做。
- `slash-menu-snapshot.test.ts`、state/render/lifecycle：执行前及返回值隔离、导航分支隔离、同树 ID、水合、焦点、StrictMode 回调更新与卸载。
- `scripts/verify-package-exports.mjs`：构建包入口、类型导出、失效拒绝、原子 History、快照、同树 ID 与内部 helper 不外泄。
- Core 回归：`packages/core/tests/operation/delete-text.test.ts`。
- 浏览器闭环：`tests/e2e/demo-shell.spec.ts` 中的斜杠菜单场景。
- `tests/e2e/slash-menu-ime.spec.ts` / `slash-menu-modifiers.spec.ts` / `slash-menu-cancellation.spec.ts`：23 项覆盖两类组合输入键盘、桌面/手机组合点击与恢复、四种修饰键、软换行和原生宿主取消；未取消的下一次命令仍可执行，History 与模型保持正确。

```sh
pnpm check:all
```

## 结论

斜杠菜单的配置、打开关闭、定位、键盘选择、命令执行、触发清理、History 和中文 Demo 均有自动化覆盖。

2026-11-09 本地 `pnpm check:all` 通过：301 个单测文件、2406 项单测、323 项 Chromium 用例；桌面 1280×720 与手机 390×844 的执行结果截图已检查，中文标题和邻段布局正常。最后加强的命令矩阵断言单独复验 20 项通过。隔离保证基于纯函数扩展和合法事务，不回滚插件自行产生的外部副作用。校验不比较文档身份或当前光标，宿主仍需刷新/关闭菜单；独立 SSR 根需不同 identifierPrefix，不宣称真实设备输入法全面验收。
