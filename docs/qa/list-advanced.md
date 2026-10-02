# QA：列表增强闭环

## 能力矩阵

| 场景             | 预期                                          | 状态 |
| ---------------- | --------------------------------------------- | ---- |
| 嵌套模型         | 列表项可携带 nested list，最大深度为三层      | 通过 |
| 嵌套路径         | 查询、输入、范围读取与 DOM 映射支持递归路径   | 通过 |
| Tab              | 非首项缩进到前一项，内容与子列表不丢失        | 通过 |
| Shift+Tab        | 嵌套项提升一级并保持合法选区                  | 通过 |
| 列表 Backspace   | 顶层项转段落，嵌套项提升一级                  | 通过 |
| 嵌套 Enter       | 普通项分裂，空项提升一级                      | 通过 |
| 任务列表模型     | taskList/taskItem 保存 checked                | 通过 |
| 任务列表 Command | paragraph、普通列表和任务列表可互相切换       | 通过 |
| checkbox         | 勾选状态通过 set_task_item_checked 写入 model | 通过 |
| HTML 粘贴        | checkbox 无序列表保留任务文字与 checked 状态  | 通过 |
| HTML 嵌套粘贴    | 保留三层混合列表、marks、链接和深层选区       | 通过 |
| History          | 缩进、反缩进和 checked 均可撤销、重做         | 通过 |
| 中文 Demo        | “嵌套与任务列表”覆盖键盘和勾选流程            | 通过 |

## 自动化入口

- 模型：`packages/core/tests/model`。
- 嵌套路径与渲染：`packages/core/tests/selection`、`packages/core/tests/render`。
- 结构操作：`indent-list-item.test.ts`、`outdent-list-item.test.ts`、`set-task-item-checked.test.ts`。
- 输入：`tab.test.ts`、`backspace.test.ts`、`enter.test.ts`。
- Command：`task-list.test.ts`。
- HTML 粘贴：Clipboard parser、Paste Command/History、React 原生事件和 Chromium 端到端测试。
- 浏览器：`tests/e2e/demo-shell.spec.ts` 的高级列表场景。

```sh
pnpm check:all
```

## 结论

第 16 周列表增强范围已闭环，并补齐 HTML 嵌套普通/任务列表粘贴。嵌套层级、键盘行为、任务状态、History 和中文 Demo 均有自动化覆盖。
