# QA：选区

## 范围

验证模型选区的 Path、Point、RangeSelection、文本读取，以及浏览器 DOM 映射和同步入口。

## 自动化测试

- `packages/core/tests/selection/path.test.ts`：Path 节点查询。
- `packages/core/tests/selection/point.test.ts`：Point 有效性和顺序比较。
- `packages/core/tests/selection/range.test.ts`：Range 折叠、规范化和比较。
- `packages/core/tests/selection/text-range.test.ts`：范围文本读取和切分。
- `packages/core/tests/render/dom-mapping.test.ts`：DOM 点与模型 Point 的双向映射。
- `packages/core/tests/render/selection-sync.test.ts`：浏览器选区读取、DOM Range 创建和恢复。
- `tests/e2e/demo-shell.spec.ts`：演示选区调试面板、浏览器同步和链接弹层选区恢复。

命令：

```sh
pnpm test
pnpm test:e2e
```

## 手测场景

| 场景            | 操作                                        | 期望                           | 结果 |
| --------------- | ------------------------------------------- | ------------------------------ | ---- |
| Path 定位根节点 | `getNodeAtPath(document, [])`               | 返回 document                  | 通过 |
| Path 定位 text  | `getNodeAtPath(document, [0, 0])`           | 返回 text 节点                 | 通过 |
| Point 偏移边界  | `isValidPoint` 校验 `0..text.length`        | 合法偏移通过，越界失败         | 通过 |
| 反向范围规范化  | anchor 在 focus 后面                        | 规范化后 anchor/focus 对调     | 通过 |
| 同段文本读取    | 输入 `[0,0] 0 -> [0,0] 5`                   | 演示显示 `你好`                | 通过 |
| 手动修改选区    | 演示中把锚点偏移改为 `3`，焦点偏移改为 `11` | 演示显示 `crucialy`            | 通过 |
| JSON 节点高亮   | 演示中把锚点路径改为 `1,0`                  | 文档映射中高亮第二段 text 节点 | 通过 |
| 浏览器同步模型  | 在渲染文本中改变浏览器选区                  | 选区 JSON 同步更新             | 通过 |
| 模型恢复浏览器  | 执行链接命令并完成受控渲染                  | 浏览器选区恢复到命令结果范围   | 通过 |

## 当前限制

- 文本切片只返回纯文本，不修改文档结构。
- 跨 block 文本用 `\n` 表示块边界。
- 当前只支持 text Point，以及 paragraph、heading、quote 的直接文本结构。
- 不支持非连续选区和图片、表格等未来非文本节点。

## 结论

选区模型、DOM 映射和浏览器双向同步已闭环，演示可验证文本读取、路径高亮、浏览器同步和受控选区恢复。
