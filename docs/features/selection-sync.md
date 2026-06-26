# Selection 双向同步（第一版）

Selection 双向同步负责在浏览器 `Selection` 和 model `RangeSelection` 之间转换。当前阶段只做同步，不处理真实编辑输入。

## DOM Selection 到 Model Selection

`domSelectionToModelSelection(document, selection)` 会读取浏览器 selection 的 anchor/focus：

- 使用 `domPointToModelPoint` 把 DOM node/offset 转为 model `Point`。
- anchor/focus 都能映射成功时返回 `RangeSelection`。
- 没有 range 或任一端无法映射时返回 `undefined`。

## Model Selection 到 DOM Selection

`createDomRangeFromModelSelection(root, document, selection)` 会把 model selection 转为 DOM `Range`。

`applyModelSelectionToDom(root, document, selection)` 会把生成的 DOM range 应用到浏览器 selection：

- 先清空当前 browser selection。
- 再添加由 model selection 生成的 range。
- 成功返回 `true`，无法映射时返回 `false`。

## Demo 同步入口

demo 的渲染区当前监听 `mouseup` 和 `keyup`：

- 浏览器 selection 变化后同步到 model selection。
- selection 调试面板展示最新 `RangeSelection` JSON。
- 文档 JSON 映射继续高亮 anchor path 对应节点。

## 当前限制

- 当前只验证 collapsed selection。
- 恢复 DOM selection 时会使用规范化后的正向 range，不保留反向选择方向。
- 不处理 IME、beforeinput、输入、删除或换行。
- 不处理跨复杂 inline 节点、marks、图片、表格等未来节点。
