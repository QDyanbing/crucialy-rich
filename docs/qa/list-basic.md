# QA：基础列表闭环

## 能力矩阵

| 场景        | 预期                                           | 状态 |
| ----------- | ---------------------------------------------- | ---- |
| List schema | 表达 bulletList、orderedList、listItem 和 text | 通过 |
| Normalize   | 修复空列表、空 item 和非法 children            | 通过 |
| Path        | 查询三层路径并校验 text Point                  | 通过 |
| Renderer    | 输出带 model path 的 ul/ol/li                  | 通过 |
| 无序列表    | paragraph 与 bulletList 双向切换               | 通过 |
| 有序列表    | paragraph 与 orderedList 双向切换              | 通过 |
| 类型互换    | bulletList 与 orderedList 原位互换             | 通过 |
| 普通输入    | 列表项内插入和删除文字                         | 通过 |
| 普通 Enter  | 分裂当前 item 并落到下一项                     | 通过 |
| 空项 Enter  | 退出列表并保留前后项目                         | 通过 |
| History     | 列表结构和 selection 可撤销、重做              | 通过 |
| 中文 Demo   | 展示有序、无序列表与完整交互                   | 通过 |

## 自动化入口

- 模型：`packages/core/tests/model`。
- 选区与渲染：`packages/core/tests/selection`、`packages/core/tests/render`。
- Command：`bullet-list.test.ts`、`ordered-list.test.ts`。
- Operation 与输入：`split-list-item.test.ts`、`exit-list-item.test.ts`、`enter.test.ts`。
- 浏览器：`tests/e2e/demo-shell.spec.ts` 中的中文列表场景。

```sh
pnpm check:all
```

## 结论

第 15 周基础列表范围已闭环。当前未实现嵌套列表、Tab/Shift+Tab、列表 Backspace 和 TaskList，下一步进入第 16 周列表增强。
