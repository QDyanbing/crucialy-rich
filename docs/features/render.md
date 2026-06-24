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

## Demo 验收

demo 的编辑区当前会使用 renderer 渲染 normalize 后的文档。切换 model 示例或点击 Normalize 后，编辑区内容会随合法文档更新。

## 当前限制

- 不包含 DOM 到 model 的反向映射。
- 不读取或恢复浏览器 selection。
- 不处理 contentEditable、beforeinput 或真实编辑行为。
- 不包含 marks、heading、list 等扩展节点渲染。
