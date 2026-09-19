# 中文输入法

中文输入法处理使用浏览器 Composition 事件维护独立状态，候选词变化期间不直接修改文档模型，结束时只提交一次 transaction。

## 生命周期

1. `compositionstart` 读取当前 DOM Selection，并保存为起始模型选区。
2. `compositionupdate` 更新候选文本和最近一次可用选区。
3. 组合期间忽略普通 `beforeinput`、编辑快捷键和粘贴，避免候选文本被重复写入。
4. `compositionend` 使用最终事件文本和起始选区创建一次文本插入。
5. 空文本结束或失效状态不会生成 transaction。

最终提交的 `onTransaction` 事件使用 `inputType: "insertCompositionText"` 和 `batch: "composition"`。候选阶段的 Backspace 交给输入法处理，不会触发模型删除。

## Core API

- `createCompositionState()`：创建空闲状态。
- `startComposition(selection)`：记录组合开始时的模型选区。
- `updateComposition(state, data, selection?)`：更新候选文本和选区。
- `finishComposition(state, data?)`：生成最终提交数据。
- `cancelComposition()`：放弃当前组合并恢复空闲状态。

`CompositionState` 的 `active` 表示是否正在组合，`data` 保存候选文本，`startSelection` 保证最终文本写回组合开始时的位置。

## React 接入

`RichTextEditor` 内部处理 `onCompositionStart`、`onCompositionUpdate` 和 `onCompositionEnd`，并保留宿主传入的同名事件回调。宿主可通过 `onCompositionStateChange` 展示输入法状态，但不需要自行提交候选文本。

当前文本插入边界与普通输入命令一致：支持折叠选区、同一文本容器内跨 text 节点选区，以及连续顶层文本块选区；不跨越列表、表格或 void block 等结构边界。
