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

文件 MIME 必须是完整的 image 子类型（如 image/png、image/svg+xml），大小写不敏感；空子类型、通配符、参数或空白不接受。这只校验 File.type 标签，不读取、解码或判断文件内容安全性，空文件也不因此被识别为损坏。

缺少 URL 能力、分配抛错或适配器返回非 blob/空 blob 地址时返回 undefined；被拒绝的已分配地址会按原始字符串尝试释放。默认读取 globalThis.URL，自定义 ObjectUrlApi 的创建与释放函数都须存在，且应提供普通可读取的方法属性；不保证捕获 Proxy/属性 getter 等任意外部副作用。

创建时绑定原始适配器方法及接收者，后续替换方法或修改 payload 不会重定向清理目标。revoke 在调用外部适配器前标记已尝试，重复/重入最多尝试一次；释放抛错被隔离，避免打断其他资源清理，但不重试，也不保证失败适配器实际释放成功。签名仍为 void，宿主需要错误监控时应在适配器内部记录。

Demo 在选择事件开始时复位文件输入；不可插入的选区、图片块选中或编辑器组合期间不分配 URL，恢复合法折叠光标后可重选同一文件。预检查通过后仍由实际 Command 复核，只有完整成功结果才保留资源并应用事务；不会把网络图片地址字段误作为本地分配条件。

Demo 在插入失败时立即 revoke；成功资源保留到 Demo 卸载，不在普通重渲染、撤销或图片暂时离开当前文档时释放，因为 History 可能仍引用该 URL。卸载 cleanup 只注册一次，修复旧实现每次重渲染就撤销地址的问题。长会话宿主若需提前回收，必须同时检查当前模型和全部 History 引用；当前 Demo 不做引用计数或内存上限管理，也不能把 blob URL 持久化成跨会话地址。

本地入口只提供当前浏览器会话内的预览，不读取文件内容、不上传、不生成永久地址。生产环境应由外部上传适配器取得 HTTPS 地址，再执行 `insertImage`。

## HTML 粘贴

Clipboard parser 可把顶层 HTML `img`、独立图片 paragraph 和普通 paragraph 中的图文混排转换为 Image block。混排按源顺序拆成文字 paragraph 和图片块，支持行内包装里的图片；图片前后文字保留独立 marks 与安全链接，图片不继承包装链接。Markdown 段落图片复用同一映射。解析过程复用模型的 URL 白名单，保留纯文本 `alt` 和正整数 `width` / `height`；危险协议、相对地址、data URL、事件属性、CSS 尺寸和未知属性会被拒绝或忽略。

解析后的图片通过 `paste` command 以 `split_block + insert_block` 插入，并作为一条 History 记录。React 原生 paste 事件不会直接把剪贴板 HTML 写入 DOM。

## HTML 复制

显式开启 `clipboardFormat="html"` 后，两端位于顶层文本块的选区可复制中间完整图片。只写出模型状态为 `ready`、不含账号密码的 HTTP/HTTPS URL 引用，保留转义的 alt 和正安全整数宽高；小数或过大尺寸只省略该属性，不改源模型。

blob、loading/error、凭据 URL 或非法源模型使整个 HTML 范围片段回退纯文本，不丢掉图片后只导出其他块。复制不读取图片文件、不上传、不验证远端是否可达；正文粘贴可形成一条 History，受限目标仍使用实际纯文本。未新增图片文件 MIME 或跨图片剪切，完整规则见[图片引用](./copy-cut.md#图片引用)。

`getClipboardHtml` 也接受指向单张顶层图片的 BlockSelection。React HTML 模式下，根聚焦且选区归属合法时可复制已选图片，输出 HTML 与空纯文本，不使用遗留文字。默认 plain 模式不导出图片；只读块选区和焦点由宿主管理，见[图片块选区](./copy-cut.md#图片块选区)。可编辑模式还可通过 `deleteImage` 剪切单张安全图片，全部格式写入成功才删除并清除块选区；失败不删除，不支持临时图片或跨图片文字范围剪切，见[单图剪切](./copy-cut.md#单图剪切)。

## 选中与删除

`BlockSelection` 使用 `{ type: "block", path }` 表达完整块选区，与文本 `RangeSelection` 分离。`RichTextEditor` 通过 `blockSelection` 和 `onBlockSelectionChange` 暴露受控图片选区：点击图片输出块选区，选中图片带有 `data-selected="true"`。

选中图片后按 Backspace 或 Delete 会执行 `deleteImage`。删除后优先把光标放到后方文本，再回退到前方文本；若没有可编辑文本，则插入空 paragraph，保证可以继续输入。

有受控 blockSelection 时，普通文字、Space、输入规则和原生粘贴不会借用残留 DOM 文字 Range；已识别的文字格式快捷键也被取消，不进入 Registry。粘贴在读取格式/数据和解析前停止，不改变文字、图片、高亮或 History。当前不把输入解释为替换图片，也不自动在图片旁插入段落。

宿主 onBeforeInput/onPaste/onKeyDown 仍先执行，取消、只读和组合保护优先级不变；React 不会因此替宿主禁用外部按钮或限制 ref。Demo 另把块选区/组合状态接入外部文档命令，具体范围见[Demo 宿主命令策略](./component-api.md#demo-宿主命令策略)。点击文字时组件通知清除块选区，宿主须回传清除后的状态才能恢复文字编辑；仅改变浏览器 Range 不表示受控块选区已解除。Backspace/Delete、单图复制/剪切和宿主 History 的原路径保持可用。

图片删除和剪切没有合法旧文字选区时，事务省略 `beforeSelection`；宿主读取前须判空。事务另外提供 `beforeBlockSelection`，传给 History 快照第三参数后，宿主可回传撤销结果中的块选区来恢复高亮；未接入时仍只恢复内容。Demo 已接入，重做清除高亮并恢复文字光标，见[块选区恢复](./history.md#块选区恢复)。

## 渲染与边界

- Renderer 输出带模型 path、alt、状态及可选宽高的不可编辑 `img`。
- HTML 序列化把 `img` 作为 void 元素，不输出结束标签。
- React 复用统一 RenderedNode，并阻止浏览器直接编辑图片内部。
- 混排粘贴生成独立图片 block，不引入行内图片、图片链接或文字环绕；heading、quote、列表项和 cell 内不提升混排图片。具体规则见[粘贴文档](./paste.md#html)。
- 当前不支持上传进度适配器、图片替换、缩放手柄、图注、对齐和多图片块选择。

完整验收记录见[图片闭环 QA](../qa/image.md)。
