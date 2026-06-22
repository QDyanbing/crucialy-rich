# @crucialy-rich/react

crucialy-rich 编辑内核的 React 集成包，对外暴露可集成的 React 富文本组件。

> 当前处于早期阶段，只提供空的 `RichTextEditor` 外壳组件，尚未提供 DOM 渲染、事件绑定或真实编辑行为。

## 安装

```sh
pnpm add @crucialy-rich/react @crucialy-rich/core react react-dom
```

`react` 与 `react-dom` 为 peer 依赖，需要宿主项目自行安装（支持 `>=18 <20`）。

## 使用

```tsx
import { RichTextEditor } from "@crucialy-rich/react";

export function Demo() {
  return <RichTextEditor label="Editor shell" />;
}
```

## 许可

[MIT](./LICENSE) © QDyanbing
