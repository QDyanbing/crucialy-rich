# 组件 API

`@crucialy-rich/react` 当前暴露 `RichTextEditor`、`RichTextEditorHandle`、`Toolbar`、`FixedToolbar` 和 `FloatingToolbar`。编辑器负责模型渲染与输入，工具栏负责 Command 状态与交互，ref 负责宿主主动聚焦、读取状态和执行命令。

## 属性

| 属性                       | 类型                                                                              | 说明                                            |
| -------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| `value`                    | `DocumentNode`                                                                    | 受控文档。传入后组件会按该文档渲染内容。        |
| `defaultValue`             | `DocumentNode`                                                                    | 非受控初始文档。仅用于组件初始化时的渲染内容。  |
| `onChange`                 | `(value: DocumentNode) => void`                                                   | 文本输入后输出最新文档。                        |
| `selection`                | `RangeSelection`                                                                  | 受控模型选区，用于输入后回写 DOM selection。    |
| `onSelectionChange`        | `(selection: RangeSelection) => void`                                             | 输入后输出新的模型选区。                        |
| `cellSelection`            | `CellSelection`                                                                   | 受控单元格选中态。                              |
| `commandRegistry`          | `CommandRegistry`                                                                 | 覆盖组件使用的默认 Command 注册表。             |
| `clipboardFormat`          | `"plain" \| "html"`                                                               | 默认纯文本；HTML 模式追加可支持的文字格式片段。 |
| `onCellSelectionChange`    | `(selection: CellSelection \| undefined) => void`                                 | 点击、Tab 换格或离开表格时输出选中态。          |
| `onCompositionStateChange` | `(state: CompositionState) => void`                                               | 输入法组合状态变化时输出最新状态。              |
| `onTransaction`            | `(event: RichTextEditorTransactionEvent) => void`                                 | 输入后输出 before、after、transaction 和选区。  |
| `onCopy` / `onCut`         | `ClipboardEventHandler<HTMLDivElement>`                                           | 宿主先处理复制／剪切，取消默认事件后完全接管。  |
| `label`                    | `string`                                                                          | 编辑器区域的可访问名称。                        |
| `className`                | `string`                                                                          | 传给编辑器根节点的样式类名。                    |
| DOM 事件属性               | `onBeforeInput`、`onClick`、`onComposition*`、`onKeyDown`、`onMouseUp`、`onKeyUp` | 用于输入、链接交互和选区同步。                  |

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

## Command 与 Ref API

```tsx
import { BOLD_COMMAND_NAME, createDefaultCommandRegistry } from "@crucialy-rich/core";
import { RichTextEditor, type RichTextEditorHandle } from "@crucialy-rich/react";
import { useRef } from "react";

export function CommandEditor() {
  const editorRef = useRef<RichTextEditorHandle>(null);
  const commandRegistry = createDefaultCommandRegistry();

  return (
    <>
      <button onClick={() => editorRef.current?.executeCommand(BOLD_COMMAND_NAME)}>
        加粗
      </button>
      <RichTextEditor
        commandRegistry={commandRegistry}
        contentEditable
        label="命令编辑器"
        ref={editorRef}
      />
    </>
  );
}
```

`RichTextEditorHandle` 提供：

- `focus(options?)`：聚焦 contenteditable 根节点。
- `getElement()`：返回根 `HTMLDivElement`，未挂载时返回 `null`。
- `getDocument()`：返回组件当前使用的 `DocumentNode`。
- `getSelection()`：优先读取两个端点都属于当前编辑器根节点的 DOM Selection，并转换为模型选区；不可用时回退到宿主显式传入的 selection，不借用其他实例的浏览器选区。
- `executeCommand(name, payload?)`：使用当前文档、选区和 `commandRegistry` 执行命令；成功 transaction 通过 `onChange`、`onSelectionChange` 和 `onTransaction` 输出。

ref 命令事件的 `inputType` 为 `command`。受控模式不会自行替换 `value`，宿主必须在 `onChange` 后回传新文档；非受控模式会更新内部文档。`contentEditable={false}` 只禁止用户输入，宿主仍可主动执行 ref 命令。

## 当前行为

- 表格内 Tab／Shift+Tab 导航仅更新 DOM 选区及 `onSelectionChange`、`onCellSelectionChange`，不触发 `onChange` 或 `onTransaction`，并清除旧 blockSelection。受控选区和 cell 高亮由宿主回传；首尾无目标不阻止默认行为，具体边界见[表格](./table.md#键盘导航)。
- 组件内部复用 `@crucialy-rich/core` 的 `renderDocument`。
- 渲染出的节点会保留 `data-crucialy-path`，用于 DOM 与模型映射和选区同步。
- `value` 优先级高于 `defaultValue`。
- `defaultValue` 只在组件初始化时读取。
- `contentEditable` 开启后，普通 `insertText`、Backspace、Delete 和 Enter 会通过 transaction 更新模型并触发 `onChange`。
- 输入后会通过 `onSelectionChange` 输出新的折叠选区。
- 非空 transaction 输入后会通过 `onTransaction` 输出输入前文档、输入后文档、输入前 selection、输入后 selection、transaction 和 inputType。
- `beforeSelection` 为可选 `RangeSelection`：文字输入仍提供旧文字范围；图片删除/剪切只保存当前 DOM 或宿主传入的合法旧文字选区，没有时省略，不把删除后的光标冒充旧选区。接入方读取端点前须判断是否存在，传给 `createHistorySnapshot(event.before, event.beforeSelection)` 无需特殊分支。History 不保存图片块高亮，撤销恢复图片内容但不自动重选图片。
- 普通文本输入的 `onTransaction` 事件会带有 `batch: "typing"`，宿主可用于连续输入合并。
- 输入处理会复用当前 DOM selection，先转换为模型 selection，再创建输入 transaction。
- 普通文本输入会通过 `insertTextCommand` 创建 transaction。
- 非折叠 selection 下的 Backspace/Delete 会通过 `deleteSelectionCommand` 创建 transaction。
- 原生复制输出模型选区的纯文本；剪切复用 `deleteSelection` 并输出独立 `deleteByCut` transaction，写入失败、禁用命令及不支持的范围不删除。只读支持复制，详见[复制与剪切](./copy-cut.md)。
- `clipboardFormat="html"` 还可复制同一列表同一层级的跨项结构、编号和任务状态；单项片段仍为 paragraph，跨项剪切和列表内富格式粘贴能力不变，不支持的结构范围回退完整纯文本。
- 同一表格同一行跨 cell 或完整连续行可复制 HTML 表格，保留文字样式与多段 cell；单 cell 仍输出 paragraph，部分跨行/跨表回退纯文本，跨 cell 剪切与 cell 内富片段粘贴能力不变。
- 两端在顶层文本块的混合范围，可复制中间完整列表、表格、分隔线及安全图片引用；首尾裁剪，保留原顺序，不支持的图片/非法结构或端点进出结构内部仍回退纯文本，不扩大剪切范围。
- 图片引用仅限模型 ready、无凭据的 HTTP/HTTPS，保留 alt 和正安全整数宽高；不复制文件、blob 或 loading/error，不验证远端资源。
- HTML 模式可使用受控图片 `blockSelection` 复制独立图片，要求根聚焦且 DOM 选区没有越界，写 HTML 与空纯文本；默认 plain/非法图片不写出，不使用遗留文字选区。只读块选区与根可聚焦性由宿主管理；可编辑单图剪切复用 Registry 的 `deleteImage`，写入成功后输出独立 `deleteByCut` 事务并通知清除块选区，详见[单图剪切](./copy-cut.md#单图剪切)。
- Enter 会通过 `splitBlockCommand` 创建 transaction；受支持的非折叠 selection 会先删除再执行分段规则。
- 段首 Backspace 会通过 `mergeBlockCommand` 创建 transaction。
- 表格单元格内复用相同输入链路；Enter 只在当前 cell 内新增 paragraph，Backspace/Delete 不跨 cell 合并。
- 点击 `td[data-crucialy-table-cell="true"]` 会输出 `CellSelection`；传回 `cellSelection` 后目标 cell 获得 `data-selected="true"`。
- 纯文本 TSV 粘贴会从当前 cell 向右、向下填充，不改变表格尺寸。
- 顶层 HTML 表格粘贴会经过 core 白名单解析，并作为一个结构化 block 和一条 History 记录插入。
- 安全 HTML 图片粘贴会保留 alt 和正整数宽高，并通过同一 `insertFromPaste` transaction 插入 Image block。
- HTML checkbox 列表粘贴会保留任务文字和 checked 状态，并通过 `insertFromPaste` 插入 taskList。
- HTML 文字标签别名粘贴会保留 bold、italic、underline 和 strike 的嵌套组合，并通过同一 `insertFromPaste` transaction 提交。
- HTML 链接粘贴会保留规范化后的 href、target 和 rel，并通过同一 `insertFromPaste` transaction 提交。
- HTML 列表粘贴会保留最多三层的直接有序、无序和任务子列表，并把选区移动到最深的最后项末尾。
- 宿主可在 `onKeyDown` 中用 `getHistoryShortcutAction` 接入撤销/重做快捷键；外部 `preventDefault` 后组件不会继续执行普通输入处理。
- Ctrl/Meta 主修饰键组合可执行默认 boolean mark、标题、引用和列表 Command；绑定 payload 会透传，并输出 `formatShortcut` transaction。
- Composition 候选阶段暂停普通输入、编辑快捷键和粘贴；结束时只输出一次 `insertCompositionText` transaction。
- paragraph 开头命中 Markdown 前缀时输出 `insertFromInputRule` transaction，并把选区移动到目标结构起点。
- 输入、删除、分段和段落合并都不会直接信任浏览器默认修改后的 DOM。
- 外部 `onBeforeInput` / `onKeyDown` 会先执行，若已 `preventDefault`，内部不再处理对应输入。
- 组件内部输入、快捷键、粘贴和 ref 命令统一使用 `commandRegistry`；未传入时使用 core 默认注册表。
- 编辑态点击 Link Mark 渲染的 `<a>` 时会先调用外部 `onClick`，再阻止浏览器默认跳转，文字仍可正常选择。
- 只读态不会阻止 `<a>` 的默认行为，href、target 和 rel 由浏览器处理。
- 受控 `selection` 会在文档或选区更新后的 layout effect 中回写 DOM，可用于菜单 command 完成后恢复浏览器选区。
- 初始渲染或浏览器选区变化不会触发 `onChange`。

## Toolbar API

- `Toolbar`：接收已经解析状态的 items，只负责语义渲染。
- `FixedToolbar`：接收 `document`、`selection`、items 和可选 Registry，自动查询状态并执行命令。
- `FloatingToolbar`：在 FixedToolbar 基础上接收 `anchorRect`、`toolbarSize` 和 `viewport`，非空选区时按视口定位。
- `createDefaultToolbarItems(options)`：创建四种 Boolean Mark、Link、Heading 和 Quote 默认配置。
- `defineToolbarItems(items)`：校验并复制自定义配置。
- `resolveToolbarItems(items, registry, context)`：把 CommandState 映射到配置。
- `executeToolbarCommand(item, registry, context)`：执行命令并返回 `ToolbarCommandEvent`。
- `createToolbarSelectionSnapshot(selection)`：为 pointerdown 到 click 之间保存独立模型选区。

Toolbar 通过 class name 暴露样式入口，不捆绑主题 CSS。完整契约见[工具栏](./toolbar.md)。

## 当前边界

当前组件仍不内置 history 状态、链接菜单或完整结构剪贴板写出；悬浮 Toolbar 的 Range 矩形由宿主同步。Clipboard 纯文本与可选 HTML 导出、parser 和粘贴命令来自 core，图片上传仍由宿主接入。`clipboardFormat="html"` 可保留受支持文字范围的格式，另支持单张安全图片块复制/剪切；不支持的文字范围回退纯文本，跨结构文字剪切或受限粘贴目标边界不变。

宿主可把 `onTransaction` 的前后快照、selection、transaction 和 batch 交给 Core `recordHistory`，并选择 `mergePolicy: "adjacent"`，让换格、光标跳变或选区替换后的输入分开撤销；该选项不是组件 prop，默认 batch 行为不变。接入与限制见 [History](./history.md#可选的相邻输入策略)。
