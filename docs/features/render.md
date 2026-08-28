# 基础渲染（第一版）

基础渲染负责把当前文档模型转换为可展示的 DOM 结构描述。当前覆盖 `document`、`paragraph`、1–6 级 `heading`、`quote`、`text`、四种 boolean text mark、安全字号、文字颜色、背景色和 Link Mark。

## 渲染结构

当前映射规则：

- `document` → `div`
- `paragraph` → `p`
- `heading level=1..6` → `h1`–`h6`
- `quote` → `blockquote`
- `text` → `span`
- `text` + `marks.bold` → `strong`
- `text` + `marks.italic` → `em`
- `text` + `marks.underline` → `u`
- `text` + `marks.strike` → `s`
- `text` + `marks.bold` + `marks.italic` → `strong style="font-style: italic;"`
- underline 与 bold/italic 叠加 → 当前 text path 元素增加 `text-decoration: underline;`
- strike 与其他 mark 叠加 → 当前 text path 元素增加 `text-decoration: line-through;`
- underline 与 strike 叠加 → `text-decoration: underline line-through;`
- 合法 `marks.fontSize` → 当前 text path 元素增加 `font-size: <value>px;`
- 合法 `marks.textColor` → 当前 text path 元素增加 `color: #rrggbb;`
- 合法 `marks.backgroundColor` → 当前 text path 元素增加 `background-color: #rrggbb;`
- 合法 `marks.link` → `a`，输出 href 和可选 target / rel
- link 与其他 marks 叠加 → 当前 `a` 增加对应样式，不创建嵌套模型路径

`renderDocument(document)` 返回 `RenderedElementNode` 树：

```ts
interface RenderedElementNode {
  tagName:
    | "a"
    | "blockquote"
    | "div"
    | "em"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "p"
    | "s"
    | "span"
    | "strong"
    | "u";
  path: Path;
  attributes: Record<string, string>;
  children?: RenderedElementNode[];
  style?: {
    backgroundColor?: string;
    color?: string;
    fontSize?: `${number}px`;
    fontStyle?: "italic";
    fontWeight?: "700";
    textDecoration?: string;
  };
  text?: string;
}
```

## 模型路径属性

每个渲染节点都会带 `data-crucialy-path`：

```html
<span data-crucialy-path="[0,0]">Hello</span>
```

相关 API：

- `MODEL_PATH_ATTRIBUTE`：当前固定为 `data-crucialy-path`。
- `encodeModelPath(path)`：把 `Path` 编码为 JSON 字符串。
- `decodeModelPath(value)`：把 DOM 属性值解析回 `Path`，非法值返回 `undefined`。
- `createModelPathAttributes(path)`：生成渲染节点属性。

## HTML 序列化

`renderNodeToHtml(node)` 用于把渲染树序列化为 HTML 字符串，主要用于测试和调试。序列化时会转义文本和属性值中的 HTML 特殊字符，并把结构化 `style` 转换为 CSS 字符串；React 集成层则直接把该对象传给 React，避免把 HTML style 字符串误作组件属性。

## DOM 映射

当前提供模型位置和 DOM 位置的双向映射：

- `domPointToModelPoint(document, domPoint)`：把 DOM 节点和偏移转换成模型 `Point`。
- `modelPointToDomPoint(root, document, point)`：把模型 `Point` 转换成 DOM 节点和偏移。
- `getElementModelPath(element)`：读取元素上的模型路径。
- `findElementByModelPath(root, path)`：按 `data-crucialy-path` 查找 DOM 元素。
- `findClosestModelPathElement(node)`：从 DOM 节点向上查找最近的模型路径元素。

当前规则：

- text 节点内的偏移映射到对应的 text 模型节点。
- 空 text 没有文本 DOM 节点时，落在对应 `span` 元素的偏移 `0`。
- paragraph 元素的偏移 `0` 映射到段首。
- paragraph 元素的末尾偏移映射到段尾。
- 非法 DOM 偏移、没有模型路径的 DOM 节点、非法模型位置都返回 `undefined`。

## 边界渲染

渲染层只按传入的合法文档结构生成 DOM 描述，不隐式 normalize：

- 空 document 渲染为带根路径的空 `div`。
- 空 paragraph 渲染为带路径的空 `p`。
- 多段落按块顺序分配 `[0]`、`[1]`、`[2]` 等路径。
- heading 按 level 输出 `h1`–`h6`，继续保留 block path 和 text path。
- quote 输出 `blockquote`，继续保留 block path 和 text path。
- 加粗 text 渲染为带 text path 的 `strong`，斜体 text 渲染为带 text path 的 `em`，不改变 DOM 与模型路径对应关系。
- 下划线 text 渲染为带 text path 的 `u`。
- 删除线 text 渲染为带 text path 的 `s`。
- 同时带有加粗和斜体的 text 会渲染为 `strong style="font-style: italic;"`，保持 text path 元素下仍是直接文本节点。
- 下划线与加粗或斜体叠加时写入同一个路径元素的 style，不产生嵌套路径元素。
- 删除线与其他 mark 叠加时复用同一个路径元素；同时启用下划线时合并 text decoration。
- `fontSize` 只有在 `8–72` 的整数范围内才会输出，且可以与四种 boolean mark 共用同一个路径元素。
- `textColor` 只有在 sanitize 后才会输出，并可与字号和四种 boolean mark 共用同一个路径元素。
- `backgroundColor` 只有在 sanitize 后才会输出，并可与文字颜色、字号和四种 boolean mark 共用同一个路径元素。
- Link Mark 只有在 href sanitize 成功后才输出 `<a>`；target / rel 只输出规范化值。
- Link Mark 与其他 marks 叠加时复用同一个 `<a>` 和 text path，保持文本 DOM 节点可直接参与双向选区映射。

## 演示验收

演示主编辑区会使用 React 组件渲染规范化后的文档。切换模型示例或点击“规范化”后，编辑区内容会随合法文档更新。

演示还提供渲染边界示例：

- 空文档边界。
- 空段落边界。
- 多段落边界。

## 当前限制

- 浏览器选区同步当前只覆盖已验证的基础场景。
- 不处理 `contentEditable`、`beforeinput` 或真实编辑行为。
- 当前包含标题、引用、四种 boolean mark、字号、文字颜色、背景色和链接渲染；列表等扩展节点尚未实现。
