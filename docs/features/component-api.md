# 组件 API

`@crucialy-rich/react` 当前暴露 `RichTextEditor` 组件，用于把文档模型渲染到 React 应用中。

## 属性

| 属性                | 类型                                               | 说明                                           |
| ------------------- | -------------------------------------------------- | ---------------------------------------------- |
| `value`             | `DocumentNode`                                     | 受控文档。传入后组件会按该文档渲染内容。       |
| `defaultValue`      | `DocumentNode`                                     | 非受控初始文档。仅用于组件初始化时的渲染内容。 |
| `onChange`          | `(value: DocumentNode) => void`                    | 文本输入后输出最新文档。                       |
| `selection`         | `RangeSelection`                                   | 受控模型选区，用于输入后回写 DOM selection。   |
| `onSelectionChange` | `(selection: RangeSelection) => void`              | 输入后输出新的模型选区。                       |
| `label`             | `string`                                           | 编辑器区域的可访问名称。                       |
| `className`         | `string`                                           | 传给编辑器根节点的样式类名。                   |
| DOM 事件属性        | `onBeforeInput`、`onMouseUp`、`onKeyUp` 等基础事件 | 用于输入和选区同步。                           |

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
- `contentEditable` 开启后，普通 `insertText` 会通过 transaction 更新模型并触发 `onChange`。
- 输入后会通过 `onSelectionChange` 输出新的折叠选区。
- 初始渲染或浏览器选区变化不会触发 `onChange`。

## 当前边界

当前组件仍不包含 Backspace、Delete、Enter、历史、输入法完整处理、粘贴解析或序列化能力。
