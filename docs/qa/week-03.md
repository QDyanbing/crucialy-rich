# QA：第 3 周 Path、Point、RangeSelection

## 范围

验证 model selection 的 Path 查询、Point 定位、RangeSelection、文本切片、demo selection 调试面板和 JSON 节点高亮。

## 自动化测试

- `packages/core/tests/selection/path.test.ts`：Path 查询和非法路径。
- `packages/core/tests/selection/point.test.ts`：Point 有效性和排序。
- `packages/core/tests/selection/range.test.ts`：collapsed、normalize 和 range 比较。
- `packages/core/tests/selection/text-range.test.ts`：文本读取和切片。
- `tests/e2e/demo-shell.spec.ts`：selection 调试面板和 JSON 节点高亮。

命令：

```sh
pnpm test
pnpm test:e2e
```

## 手测场景

| 场景           | 操作                              | 期望                        | 结果 |
| -------------- | --------------------------------- | --------------------------- | ---- |
| root path 查询 | `getNodeAtPath(document, [])`     | 返回 document               | 通过 |
| text path 查询 | `getNodeAtPath(document, [0, 0])` | 返回 text 节点              | 通过 |
| offset 边界    | 校验 `0..text.length`             | 合法通过，越界失败          | 通过 |
| 反向 range     | anchor 在 focus 后面              | normalize 后返回正向 range  | 通过 |
| demo 文本读取  | 调整 anchor/focus offset          | Selected text 同步变化      | 通过 |
| JSON 节点高亮  | 修改 anchor path                  | 文档映射高亮对应 model 节点 | 通过 |

## 结论

第 3 周 model selection 已闭环，当前能力限定在文档模型层，不包含浏览器 selection 或 DOM 映射。
