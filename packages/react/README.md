# @crucialy-rich/react

crucialy-rich 编辑内核的 React 集成包，对外暴露可集成的 React 富文本组件。

> 当前已完成基础编辑、列表、Toolbar 和斜杠菜单闭环。所有输入、工具栏和斜杠菜单命令都通过 transaction 更新文档。

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
- `contentEditable`：开启普通文本输入、Backspace、Delete、Enter、列表 Tab 和 Shift+Tab。
- 输入事件：通过模型 transaction 更新文档，并在输入后回传稳定模型选区；普通文本输入、非折叠删除选区、Enter 分段和段首 Backspace 合并复用 core command。
- 任务列表：checkbox 点击通过 `set_task_item_checked` transaction 写回 `checked`，并进入宿主的 History 流程。
- `label`、`className` 和基础 DOM 事件属性。

Toolbar 当前支持：

- `createDefaultToolbarItems`：创建 Bold、Italic、Underline、Strike、Link、H2 和 Quote 默认配置。
- `FixedToolbar`：根据 document/selection 展示 active 和 disabled，并通过 `onCommand` 输出执行结果。
- `FloatingToolbar`：根据非折叠 selection 和宿主提供的 `anchorRect` 显示在选区附近。
- pointerdown 选区快照：点击工具栏后仍把命令应用到原选区。
- 固定/悬浮组件只提供结构 class，产品主题、History 应用和链接菜单由宿主负责。

斜杠菜单当前支持：

- `defineSlashCommandItems`：校验并复制自定义 Slash Command 配置。
- `createDefaultSlashCommandItems`：创建正文、标题、引用、代码块、列表和分割线默认目录。
- `filterSlashCommandItems`：按 ID、标签和关键词进行前缀过滤。
- `findSlashMenuTrigger`：识别 paragraph 折叠光标前的 `/query` 并返回待清理 Range。
- `SlashMenu` / `FloatingSlashMenu`：渲染可访问菜单并定位到浏览器光标附近。
- `getSlashMenuKeyboardAction` / `moveSlashMenuSelection`：处理 Escape、上下键循环和 Enter 选择。
- `executeSlashCommand`：清理触发文本、执行目标命令并合并 Transaction。

完整说明见[组件 API](../../docs/features/component-api.md)、[工具栏](../../docs/features/toolbar.md)和[斜杠菜单](../../docs/features/slash-menu.md)。

## 许可

[MIT](./LICENSE) © QDyanbing
