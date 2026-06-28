# 基础渲染（第一版）

基础渲染负责把当前文档模型转换为可展示的 DOM 结构描述。第一版只覆盖 `document`、`paragraph` 和 `text`。

## 渲染结构

当前映射规则：

- `document` → `div`
- `paragraph` → `p`
- `text` → `span`

`renderDocument(document)` 返回 `RenderedElementNode` 树：

```ts
interface RenderedElementNode {
  tagName: "div" | "p" | "span";
  path: Path;
  attributes: Record<string, string>;
  children?: RenderedElementNode[];
  text?: string;
}
```

## Model Path 属性

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

`renderNodeToHtml(node)` 用于把渲染树序列化为 HTML 字符串，主要用于测试和调试。序列化时会转义文本和属性值中的 HTML 特殊字符。

## DOM 映射

当前提供 model point 和 DOM point 的双向映射：

- `domPointToModelPoint(document, domPoint)`：把 DOM node/offset 转成 model `Point`。
- `modelPointToDomPoint(root, document, point)`：把 model `Point` 转成 DOM node/offset。
- `getElementModelPath(element)`：读取元素上的 model path。
- `findElementByModelPath(root, path)`：按 `data-crucialy-path` 查找 DOM element。
- `findClosestModelPathElement(node)`：从 DOM node 向上查找最近的 model path element。

当前规则：

- text node 内的 offset 映射到对应 text model node。
- 空 text 没有 text node 时，落在对应 `span` element 的 offset `0`。
- paragraph element 的 offset `0` 映射到段首。
- paragraph element 的末尾 offset 映射到段尾。
- 非法 DOM offset、没有 model path 的 DOM node、非法 model point 都返回 `undefined`。

## 边界渲染

渲染层只按传入的合法文档结构生成 DOM 描述，不隐式 normalize：

- 空 document 渲染为带根 path 的空 `div`。
- 空 paragraph 渲染为带 path 的空 `p`。
- 多段落按 block 顺序分配 `[0]`、`[1]`、`[2]` 等 path。

## Demo 验收

demo 的主编辑区会使用 React 组件渲染 normalize 后的文档。切换 model 示例或点击 Normalize 后，编辑区内容会随合法文档更新。

demo 还提供渲染边界示例：

- Empty document boundary。
- Empty paragraph boundary。
- Multiple paragraph boundary。

## 当前限制

- 浏览器 selection 同步当前只覆盖已验证的基础场景。
- 不处理 contentEditable、beforeinput 或真实编辑行为。
- 不包含 marks、heading、list 等扩展节点渲染。
