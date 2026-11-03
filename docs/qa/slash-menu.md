# QA：斜杠菜单闭环

## 能力矩阵

| 场景         | 预期                                               | 状态 |
| ------------ | -------------------------------------------------- | ---- |
| 配置校验     | 空字段与重复 ID 被拒绝，输入配置被防御性复制       | 通过 |
| 默认目录     | 正文、标题、引用、代码块、三类列表和分割线均可发现 | 通过 |
| 查询过滤     | 中文、英文关键词忽略大小写并按前缀匹配             | 通过 |
| 触发识别     | 仅 paragraph 折叠光标的段首或空白后 `/query` 生效  | 通过 |
| 浮层定位     | 菜单靠近光标、可上下翻转且不超出视口               | 通过 |
| 关闭行为     | Escape 关闭当前菜单且不修改正文                    | 通过 |
| 键盘选择     | ArrowUp/ArrowDown 首尾循环，Enter 执行活动项       | 通过 |
| 触发文本清理 | 同一 text 或跨 mark text 的 `/query` 都不会残留    | 通过 |
| History      | 清理与目标命令合并为一次 Transaction，可一次撤销   | 通过 |
| 失败保护     | 目标命令失败时不提交仅清理触发文本的 Transaction   | 通过 |

## 自动化入口

- React 单测：`packages/react/tests/slash-menu-*.test.ts`、`floating-slash-menu.test.ts`。
- `packages/react/tests/slash-menu-errors.test.ts`：5 项验证目标 Registry/guard/execute 抛错时返回失败、不暴露清理事务、源 `/query` 保留；正常禁用仍 skipped，修复后可重试，触发清理和目标事务组成单条 History 并正确撤销/重做。
- Core 回归：`packages/core/tests/operation/delete-text.test.ts`。
- 浏览器闭环：`tests/e2e/demo-shell.spec.ts` 中的斜杠菜单场景。

```sh
pnpm check:all
```

## 结论

斜杠菜单的配置、打开关闭、定位、键盘选择、命令执行、触发清理、History 和中文 Demo 均有自动化覆盖。

2026-11-03 同步扩展异常回归通过，全量本地结果为 1951 项单测、250 项 Chromium 用例。隔离保证基于纯函数扩展和合法事务，不回滚插件自行产生的外部副作用。
