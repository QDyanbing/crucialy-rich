# 组件 API

`@crucialy-rich/react` 当前暴露 `RichTextEditor` 组件，用于把文档模型渲染到 React 应用中。

## 属性

| 属性                | 类型                                                            | 说明                                           |
| ------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| `value`             | `DocumentNode`                                                  | 受控文档。传入后组件会按该文档渲染内容。       |
| `defaultValue`      | `DocumentNode`                                                  | 非受控初始文档。仅用于组件初始化时的渲染内容。 |
| `onChange`          | `(value: DocumentNode) => void`                                 | 文本输入后输出最新文档。                       |
| `selection`         | `RangeSelection`                                                | 受控模型选区，用于输入后回写 DOM selection。   |
| `onSelectionChange` | `(selection: RangeSelection) => void`                           | 输入后输出新的模型选区。                       |
| `onTransaction`     | `(event: RichTextEditorTransactionEvent) => void`               | 输入后输出 before、after、transaction 和选区。 |
| `label`             | `string`                                                        | 编辑器区域的可访问名称。                       |
| `className`         | `string`                                                        | 传给编辑器根节点的样式类名。                   |
| DOM 事件属性        | `onBeforeInput`、`onKeyDown`、`onMouseUp`、`onKeyUp` 等基础事件 | 用于输入和选区同步。                           |

## 受控用法

```tsx
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { RichTextEditor } from "@crucialy-rich/react";

const value = createDocument([createParagraph([createText("受控文档。")])]);

export function ControlledEditor() {
  return <RichTextEditor label="受控编辑器" value={value} />;
}
```

## 非受控用法

```tsx
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { RichTextEditor } from "@crucialy-rich/react";

const defaultValue = createDocument([createParagraph([createText("初始文档。")])]);

export function UncontrolledEditor() {
  return <RichTextEditor defaultValue={defaultValue} label="非受控编辑器" />;
}
```

## 当前行为

- 组件内部复用 `@crucialy-rich/core` 的 `renderDocument`。
- 渲染出的节点会保留 `data-crucialy-path`，用于 DOM 与模型映射和选区同步。
- `value` 优先级高于 `defaultValue`。
- `defaultValue` 只在组件初始化时读取。
- `contentEditable` 开启后，普通 `insertText`、collapsed selection 下的 Backspace、collapsed selection 下的 Delete 和 collapsed selection 下的 Enter 会通过 transaction 更新模型并触发 `onChange`。
- 输入后会通过 `onSelectionChange` 输出新的折叠选区。
- 非空 transaction 输入后会通过 `onTransaction` 输出输入前文档、输入后文档、输入前 selection、输入后 selection、transaction 和 inputType。
- 普通文本输入的 `onTransaction` 事件会带有 `batch: "typing"`，宿主可用于连续输入合并。
- 输入处理会复用当前 DOM selection，先转换为模型 selection，再创建输入 transaction。
- 普通文本输入会通过 `insertTextCommand` 创建 transaction。
- 非折叠 selection 下的 Backspace/Delete 会通过 `deleteSelectionCommand` 创建 transaction。
- Enter 会通过 `splitBlockCommand` 创建 transaction。
- 段首 Backspace 会通过 `mergeBlockCommand` 创建 transaction。
- 输入、删除、分段和段落合并都不会直接信任浏览器默认修改后的 DOM。
- 外部 `onBeforeInput` / `onKeyDown` 会先执行，若已 `preventDefault`，内部不再处理对应输入。
- 初始渲染或浏览器选区变化不会触发 `onChange`。

## 当前边界

当前组件仍不内置 history 状态、输入法完整处理、粘贴解析或序列化能力；Backspace、Delete 和 Enter 当前只覆盖基础编辑路径。
