# QA：基础渲染（第一版）

## 范围

验证 model 到渲染树、HTML 序列化、path 属性绑定和 demo 渲染入口。

## 自动化测试

- `packages/core/tests/render/attributes.test.ts`：model path 属性编码、解码和非法输入。
- `packages/core/tests/render/dom-mapping.test.ts`：DOM point 和 model point 双向映射。
- `packages/core/tests/render/render.test.ts`：document、paragraph、text 的渲染树结构。
- `packages/core/tests/render/html.test.ts`：HTML 序列化和文本转义。
- `packages/core/tests/public-api.test.ts`：render public API 导出。
- `tests/e2e/demo-shell.spec.ts`：demo 编辑区展示 renderer 输出内容。

命令：

```sh
pnpm test
pnpm test:e2e
```

## 手测场景

| 场景             | 操作                           | 期望                                    | 结果 |
| ---------------- | ------------------------------ | --------------------------------------- | ---- |
| 普通文档渲染     | 打开 demo                      | 编辑区显示 `Hello crucialy-rich.`       | 通过 |
| 多段落渲染       | 使用默认 model 示例            | 编辑区显示两段文本                      | 通过 |
| normalize 后渲染 | 选择非法示例并点击 `Normalize` | 编辑区显示 normalize 后的合法 paragraph | 通过 |
| path 属性绑定    | 检查渲染出的 text 节点         | 节点包含 `data-crucialy-path="[0,0]"`   | 通过 |
| DOM 到 model     | 传入 text node 和 offset       | 返回对应 model point                    | 通过 |
| model 到 DOM     | 传入 model point               | 返回对应 DOM node 和 offset             | 通过 |

## 当前限制

- 暂不实现浏览器 selection 同步。
- 暂不实现真实编辑输入。

## 结论

基础 model 到 DOM 结构渲染和 DOM/model point 映射已完成第一版闭环，下一步进入 selection 双向同步。
