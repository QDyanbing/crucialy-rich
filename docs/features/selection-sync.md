# 选区双向同步（第一版）

选区双向同步负责在浏览器 `Selection` 和模型 `RangeSelection` 之间转换，并为受控编辑后的 DOM 选区恢复提供基础能力。

## DOM 选区到模型选区

`domSelectionToModelSelection(document, selection)` 会读取浏览器选区的 anchor/focus：

- 使用 `domPointToModelPoint` 把 DOM 节点和偏移转换为模型 `Point`。
- anchor/focus 都能映射成功时返回 `RangeSelection`。
- 没有范围或任一端无法映射时返回 `undefined`。

## 模型选区到 DOM 选区

`createDomRangeFromModelSelection(root, document, selection)` 会把模型选区转换为 DOM `Range`。

`applyModelSelectionToDom(root, document, selection)` 会把生成的 DOM 范围应用到浏览器选区：

- 先清空当前浏览器选区。
- 再添加由模型选区生成的范围。
- 成功返回 `true`，无法映射时返回 `false`。

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

- 当前验证基础折叠选区，以及链接弹层中的同段非折叠选区恢复。
- 恢复 DOM 选区时会使用规范化后的正向范围，不保留反向选择方向。
- 不处理 IME、beforeinput、输入、删除或换行。
- 不处理跨复杂行内节点、标记、图片、表格等未来节点。
