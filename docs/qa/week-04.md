# QA：第 4 周基础渲染和 DOM 映射闭环

## 范围

验证基础 renderer、DOM/model 映射、selection 同步、React 组件渲染入口和 demo 边界示例。

## 自动化覆盖

- `packages/core/tests/render/render.test.ts`：普通文档、空 document、空 paragraph 和多段落 path。
- `packages/core/tests/render/dom-mapping.test.ts`：DOM/model point 双向映射、非法输入和 root helper。
- `packages/core/tests/render/selection-sync.test.ts`：collapsed selection 读取和恢复。
- `packages/react/tests/public-api.test.ts`：`RichTextEditor` 的 `value`、`defaultValue`、空 document、受控优先级和 `onChange` 初始渲染契约。
- `tests/e2e/demo-shell.spec.ts`：主编辑区渲染、selection 同步、组件示例和渲染边界示例。

## 验收结果

| 场景                   | 结果 |
| ---------------------- | ---- |
| renderer path 输出     | 通过 |
| DOM/model point 映射   | 通过 |
| browser selection 同步 | 通过 |
| React 组件渲染         | 通过 |
| demo 边界示例          | 通过 |

## 结论

第 4 周基础渲染、DOM 映射、selection 同步和 React 组件渲染入口已闭环，下一步进入 operation 和 transaction。
