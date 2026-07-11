# @crucialy-rich/react

crucialy-rich 编辑内核的 React 集成包，对外暴露可集成的 React 富文本组件。

> 当前处于早期阶段，`RichTextEditor` 已支持通过 `value` / `defaultValue` 渲染文档模型，并接入 `beforeinput insertText` 普通文本输入、collapsed selection 下的 Backspace、collapsed selection 下的 Delete 和 collapsed selection 下的 Enter；普通文本输入和非折叠删除选区已复用文本 command。

## 安装

```sh
pnpm add @crucialy-rich/react @crucialy-rich/core react react-dom
```

`react` 与 `react-dom` 为同伴依赖，需要宿主项目自行安装（支持 `>=18 <20`）。

## 使用

```tsx
import { RichTextEditor } from "@crucialy-rich/react";
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";

const value = createDocument([createParagraph([createText("你好，crucialy-rich。")])]);

export function Demo() {
  return (
    <RichTextEditor
      contentEditable
      label="编辑器"
      onChange={(nextValue) => {
        console.log(nextValue);
      }}
      value={value}
    />
  );
}
```

`RichTextEditor` 当前支持：

- `value`：受控文档。
- `defaultValue`：非受控初始文档。
- `onChange`：输入后输出最新文档。
- `selection` / `onSelectionChange`：受控模型选区和输入后的选区回调。
- `contentEditable`：开启普通文本输入、Backspace、Delete 和 Enter。
- 输入事件：通过模型 transaction 更新文档，并在输入后回传稳定模型选区；普通文本输入和非折叠删除选区复用 core command。
- `label`、`className` 和基础 DOM 事件属性。

完整说明见 [组件 API](../../docs/features/component-api.md)。

## 许可

[MIT](./LICENSE) © QDyanbing
