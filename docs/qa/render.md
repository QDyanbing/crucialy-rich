# QA：基础渲染（第一版）

## 范围

验证模型到渲染树、HTML 序列化、路径属性绑定、DOM 与模型映射、React 组件渲染和演示渲染入口。

## 自动化测试

- `packages/core/tests/render/attributes.test.ts`：模型路径属性编码、解码和非法输入。
- `packages/core/tests/render/dom-mapping.test.ts`：DOM 位置和模型位置双向映射、非法输入和根节点 helper。
- `packages/core/tests/render/render.test.ts`：document、paragraph、text、空 document 和空 paragraph 的渲染树结构。
- `packages/core/tests/render/html.test.ts`：HTML 序列化和文本转义。
- `packages/core/tests/public-api.test.ts`：渲染公开 API 导出。
- `packages/react/tests/public-api.test.ts`：React 组件渲染 value、defaultValue、空 document 和受控优先级。
- `tests/e2e/demo-shell.spec.ts`：演示编辑区、组件示例和渲染边界示例。

命令：

```sh
pnpm test
pnpm test:e2e
```

## 手测场景

| 场景          | 操作                       | 期望                                    | 结果 |
| ------------- | -------------------------- | --------------------------------------- | ---- |
| 普通文档渲染  | 打开演示                   | 编辑区显示 `你好，crucialy-rich。`      | 通过 |
| 多段落渲染    | 使用默认模型示例           | 编辑区显示两段文本                      | 通过 |
| 空 document   | 查看边界示例               | root 保留 `data-crucialy-path="[]"`     | 通过 |
| 空 paragraph  | 查看边界示例               | paragraph 保留 `[0]`，不生成 text path  | 通过 |
| 三段落边界    | 查看边界示例               | 第三段包含 `data-crucialy-path="[2,0]"` | 通过 |
| 规范化后渲染  | 选择非法示例并点击“规范化” | 编辑区显示规范化后的合法 paragraph      | 通过 |
| path 属性绑定 | 检查渲染出的 text 节点     | 节点包含 `data-crucialy-path="[0,0]"`   | 通过 |
| DOM 到模型    | 传入 text 节点和偏移       | 返回对应模型位置                        | 通过 |
| 模型到 DOM    | 传入模型位置               | 返回对应 DOM 节点和偏移                 | 通过 |

## 当前限制

- 暂不实现真实编辑输入。
- 暂不包含标记、标题、列表等扩展节点渲染。

## 结论

基础模型到 DOM 结构渲染、DOM 与模型位置映射、React 组件渲染和演示边界验收已完成第一版闭环，下一步进入操作和事务。
