# 选区双向同步（第一版）

选区双向同步负责在浏览器 `Selection` 和模型 `RangeSelection` 之间转换，并为受控编辑后的 DOM 选区恢复提供基础能力。

## DOM 选区到模型选区

`domSelectionToModelSelection(document, selection)` 会读取浏览器选区的 anchor/focus：

- 使用 `domPointToModelPoint` 把 DOM 节点和偏移转换为模型 `Point`。
- anchor/focus 都能映射成功时返回 `RangeSelection`。
- 没有范围或任一端无法映射时返回 `undefined`。

## DOM 偏移规则

浏览器端点的 offset 含义由节点类型决定，不是统一的字符位置：

- Text 节点：offset 是该 DOM 节点内部的 UTF-16 单元数。同一模型文字叶子含多个直接 Text 子节点时，先累计前面兄弟的长度，再加局部 offset；可覆盖 `splitText()` 产生的空片段或代理对拆分，不按字素重新计算。
- 文字叶子元素：offset 是 `childNodes` 边界索引。`<strong data-crucialy-path="[0,0]">甲😀乙</strong>` 只有一个 Text 子节点，元素 offset 1 表示模型文字末尾 4，不是字符 1。叶子被拆成两个 Text 后，元素 offset 1 表示第一个片段末尾。
- 文本块、普通/任务列表项：按实际 DOM 子节点寻找相邻直属文字叶子，边界优先取右侧文字起点，无右侧文字时取左侧末尾。块内排版空白、注释和自身的任务 checkbox 不占模型文字索引；不忽略可读的游离文本或未知结构。
- 列表项文字后的子列表边界可落到父项文字末尾；子列表之后的边界不折算成父项末尾，也不跨层级猜测端点。表格 cell 中的 paragraph 可映射，table/tbody/tr/td 和编辑器根的结构边界不直接映射为文字 Point。

元素 offset 必须在实际子节点范围内，Text offset 不得超过局部 DOM 长度，累计位置还须在模型中合法；不截断、不夹到末尾。input/img/hr/br 本身不产生文字端点。模型路径缺失、非直属路径、无对应模型位置、未知嵌套包装或不支持的结构返回 `undefined`。

这不是 DOM 导入或修复功能：文字叶子只接受直接 Text 子节点，不遍历任意行内包装，也不把 DOM 文字/样式当成模型内容。复制仍从模型读取文字和格式；宿主应避免直接改写 React 管理的 DOM，测试拆分节点仅用于验证映射与浏览器边界。

## 模型选区到 DOM 选区

`createDomRangeFromModelSelection(root, document, selection)` 会把模型选区转换为按文档顺序排列的 DOM `Range`，用于布局和范围查询，不表达选区方向。

`applyModelSelectionToDom(root, document, selection)` 会把模型端点应用到浏览器选区：

- 先清空当前浏览器选区。
- 再通过 `Selection.setBaseAndExtent` 设置原始 anchor/focus，保留反向选区方向。
- 成功返回 `true`；任一端无法映射时返回 `false`，保留原 DOM 选区。

反向映射会遍历同一文字叶子的直接 Text 子节点，把模型 offset 转成对应局部位置；片段分界优先落在前一节点末尾，视觉位置与模型偏移相同。空叶子仍用元素 offset 0。若当前 DOM 太短或结构不支持，不把模型位置强行截到第一个 Text 节点末尾。

## 演示同步入口

演示渲染区当前监听 `mouseup` 和 `keyup`：

- 浏览器选区变化后同步到模型选区。
- 选区调试面板展示最新 `RangeSelection` JSON。
- 文档 JSON 映射继续高亮 anchor 路径对应节点。

## 菜单类交互

链接输入弹层采用模型选区快照处理焦点转移：

1. 链接按钮在获得焦点前使用 `cloneRangeSelection` 保存当前模型选区。
2. 弹层输入获得焦点或浏览器 `Selection` 被清空时，快照保持不变。
3. 确认链接使用快照作为 command context 和 History before selection。
4. command 返回重映射后的模型选区；受控 `selection` 在新文档渲染后通过 `applyModelSelectionToDom` 恢复浏览器范围。
5. 关闭弹层或切换模型示例会丢弃快照，不复用过期位置。

## 当前限制

- 当前验证折叠和非折叠选区，以及链接弹层中的单块与连续文本块非折叠选区恢复。
- 已覆盖正反向选区、跨块恢复、剪切 History 往返和恢复后的继续输入；浏览器需支持 `Selection.setBaseAndExtent`。
- 选区同步模块本身不处理 IME、beforeinput、输入、删除或换行，这些行为由输入集成和命令层负责。
- 已覆盖当前直接文字结构、marks/链接叶子、CodeBlock、嵌套列表项/任务项及 cell 内 paragraph；不处理任意复杂行内包装、void 内部、根/表格结构端点或新的矩形/块选择。
- 端点映射不等于编辑命令支持该范围；跨项、跨 cell、跨图片等删除/剪切和粘贴目标限制仍由命令层决定。Core 映射函数本身不识别编辑器实例归属，React 仍要求 DOM 两端属于当前根，ref 在 DOM 不可用时仍可按原契约回退宿主 selection。
