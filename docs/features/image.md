# 图片

图片以顶层 void block 存入文档，由 core 负责模型安全、命令和渲染，React 层负责本地文件预览及块选区交互。当前范围不包含上传服务。

## 模型

```ts
interface ImageNode {
  type: "image";
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
  status: "loading" | "ready" | "error";
  children: [];
}
```

`createImage(src, options)` 会补齐默认值。`src` 只允许绝对 `http:`、`https:` 和浏览器生成的 `blob:` 地址；宽高必须是有限正数或 `null`。校验器拒绝非法图片，规范化会移除危险地址、清空 children，并修复 alt、尺寸和状态。

## URL 插入

`insertImageCommand` 的注册名为 `insertImage`，payload 类型为 `InsertImageCommandPayload`。命令要求折叠且合法的文本选区，在当前 Point 执行 `split_block + insert_block`，图片位于分割后的两个文本块之间，完成后光标位于后方文本块起点。

```ts
executeCommand(registry, INSERT_IMAGE_COMMAND_NAME, {
  context: { document, selection },
  payload: {
    src: "https://example.com/cover.png",
    alt: "封面",
    width: 640,
    height: 360,
  },
});
```

## 本地文件

React 包导出 `createLocalImageResource(file)`。它只接受 `image/*` 文件，通过 `URL.createObjectURL` 生成可插入的 `blob:` payload，并返回幂等的 `revoke()`。集成方必须在图片不再使用或组件卸载时释放地址。

本地入口只提供当前浏览器会话内的预览，不读取文件内容、不上传、不生成永久地址。生产环境应由外部上传适配器取得 HTTPS 地址，再执行 `insertImage`。

## 选中与删除

`BlockSelection` 使用 `{ type: "block", path }` 表达完整块选区，与文本 `RangeSelection` 分离。`RichTextEditor` 通过 `blockSelection` 和 `onBlockSelectionChange` 暴露受控图片选区：点击图片输出块选区，选中图片带有 `data-selected="true"`。

选中图片后按 Backspace 或 Delete 会执行 `deleteImage`。删除后优先把光标放到后方文本，再回退到前方文本；若没有可编辑文本，则插入空 paragraph，保证可以继续输入。

## 渲染与边界

- Renderer 输出带模型 path、alt、状态及可选宽高的不可编辑 `img`。
- HTML 序列化把 `img` 作为 void 元素，不输出结束标签。
- React 复用统一 RenderedNode，并阻止浏览器直接编辑图片内部。
- 当前不支持上传进度适配器、图片替换、缩放手柄、图注、对齐和多图片块选择。

完整验收记录见[图片闭环 QA](../qa/image.md)。
