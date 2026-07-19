# @crucialy-rich/react

crucialy-rich 编辑内核的 React 集成包，对外暴露可集成的 React 富文本组件。

> 当前处于早期阶段，`RichTextEditor` 已支持通过 `value` / `defaultValue` 渲染文档模型，并接入普通文本输入、Backspace、Delete 和 Enter；输入会通过 transaction 更新文档，并可通过 `onTransaction` 暴露给宿主记录 history。

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
- `onTransaction`：输入后输出 before、after、transaction、inputType 和输入前后 selection；普通文本输入会带有 `batch: "typing"`。
- `contentEditable`：开启普通文本输入、Backspace、Delete 和 Enter。
- 输入事件：通过模型 transaction 更新文档，并在输入后回传稳定模型选区；普通文本输入、非折叠删除选区、Enter 分段和段首 Backspace 合并复用 core command。
- `label`、`className` 和基础 DOM 事件属性。

完整说明见 [组件 API](../../docs/features/component-api.md)。

## 许可

[MIT](./LICENSE) © QDyanbing
