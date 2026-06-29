# @crucialy-rich/react

crucialy-rich 编辑内核的 React 集成包，对外暴露可集成的 React 富文本组件。

> 当前处于早期阶段，`RichTextEditor` 已支持通过 `value` / `defaultValue` 渲染文档模型，但尚未提供真实编辑行为。

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
  return <RichTextEditor label="编辑器" value={value} />;
}
```

`RichTextEditor` 当前支持：

- `value`：受控文档。
- `defaultValue`：非受控初始文档。
- `onChange`：预留回调，当前阶段不会主动触发。
- `label`、`className` 和基础 DOM 事件属性。

完整说明见 [组件 API](../../docs/features/component-api.md)。

## 许可

[MIT](./LICENSE) © QDyanbing
