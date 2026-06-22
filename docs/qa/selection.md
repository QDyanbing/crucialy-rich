# QA：Selection（第一版）

## 范围

验证 model selection 的 Path、Point、RangeSelection、文本读取和 demo 调试入口。

## 自动化测试

- `packages/core/tests/selection/path.test.ts`：Path 节点查询。
- `packages/core/tests/selection/point.test.ts`：Point 有效性和顺序比较。
- `packages/core/tests/selection/range.test.ts`：Range collapsed、normalize 和比较。
- `packages/core/tests/selection/text-range.test.ts`：range 文本读取和 split。
- `tests/e2e/demo-shell.spec.ts`：demo selection 调试面板 smoke。

命令：

```sh
pnpm test
pnpm test:e2e
```

## 手测场景

| 场景                 | 操作                                              | 期望                           | 结果 |
| -------------------- | ------------------------------------------------- | ------------------------------ | ---- |
| Path 定位 root       | `getNodeAtPath(document, [])`                     | 返回 document                  | 通过 |
| Path 定位 text       | `getNodeAtPath(document, [0, 0])`                 | 返回 text 节点                 | 通过 |
| Point offset 边界    | `isValidPoint` 校验 `0..text.length`              | 合法 offset 通过，越界失败     | 通过 |
| 反向 range normalize | anchor 在 focus 后面                              | normalize 后 anchor/focus 对调 | 通过 |
| 同段文本读取         | 输入 `[0,0] 0 -> [0,0] 5`                         | demo 显示 `Hello`              | 通过 |
| 手动修改选区         | demo 中把 anchor offset 改为 `6`，focus 改为 `14` | demo 显示 `crucialy`           | 通过 |
| JSON 节点高亮        | demo 中把 anchor path 改为 `1,0`                  | 文档映射中高亮第二段 text 节点 | 通过 |

## 当前限制

- 未接入浏览器原生 selection。
- 未实现 DOM 到 model 的映射。
- 文本切片只返回纯文本，不修改文档结构。
- 跨段落文本用 `\n` 表示段落边界。

## 结论

Selection 第一版 model 能力已闭环，demo 可验证文本读取、选区 JSON 和 path 对应节点高亮，后续可以进入基础渲染和 DOM 映射阶段。
