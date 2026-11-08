# 中文输入法

中文输入法处理使用浏览器 Composition 事件维护独立状态，候选词变化期间不直接修改文档模型，结束时只提交一次 transaction。

## 生命周期

1. `compositionstart` 读取当前 DOM Selection，并保存为起始模型选区。
2. `compositionupdate` 更新候选文本和最近一次可用选区。
3. 组合期间忽略普通 `beforeinput`、编辑快捷键和粘贴，避免候选文本被重复写入。
4. `compositionend` 使用最终事件文本和起始选区创建一次文本插入。
5. 空文本结束或失效状态不会生成 transaction。

当前活跃会话还绑定开始时的文档引用。换成新文档对象、切到只读或出现块选区后，会话恢复空闲；迟到的 update/end 不会往新文档复用旧位置。仅更新标签、回调、Registry 或文字 selection 不会改变起始锚点。新的合法 start 可重新定义锚点；被取消、没有归属选区、来自内嵌控件或图片选中时的新 start 会丢弃旧会话。

最终提交的 `onTransaction` 事件使用 `inputType: "insertCompositionText"` 和 `batch: "composition"`。候选阶段的 Backspace 交给输入法处理，不会触发模型删除。

## Core API

- `createCompositionState()`：创建空闲状态。
- `startComposition(selection)`：记录组合开始时的模型选区。
- `updateComposition(state, data, selection?)`：更新候选文本和选区。
- `finishComposition(state, data?)`：生成最终提交数据。
- `cancelComposition()`：放弃当前组合并恢复空闲状态。

`CompositionState` 的 `active` 表示是否正在组合，`data` 保存候选文本，`startSelection` 保证最终文本写回组合开始时的位置。

`startComposition`、活跃的 `updateComposition` 和最终 commit 的文字范围彼此独立复制。更新未传新 selection 时也复制保留的当前范围，避免前后候选状态共享 path；显式新 selection 不替换原 startSelection。空闲状态上的 update 仍返回原对象，Core helper 不持有文档，也不负责验证/修复路径或追踪替换文档。

## React 接入

`RichTextEditor` 内部处理 `onCompositionStart`、`onCompositionUpdate` 和 `onCompositionEnd`，并保留宿主传入的同名事件回调。宿主可通过 `onCompositionStateChange` 展示输入法状态，但不需要自行提交候选文本。

## 取消与通知

- 三个宿主事件回调均先执行。start 的 `preventDefault()` 拒绝开始并清理旧会话；update 的取消只跳过本次候选状态更新，不取消整个会话，未取消的 end 仍可提交最终文本。
- end 的取消不提交模型，但一定释放正常活跃会话；空文本也释放会话。重复/未配对 end 不发事务或多余空闲通知。来自内嵌表单控件、不可编辑后代的事件不编辑正文。
- `onCompositionStateChange` 收到独立对象及独立的当前/起始 Range，修改通知不会改变组件内部状态。通知不冻结；宿主保留的旧快照也不会被后续候选更新改写。
- 结束提交使用捕获的原始范围，即使候选阶段 DOM/受控文字选区移动，仍不猜测新位置。只在 start 检查 DOM 归属；结束并不要求仍有同一个 DOM Range，也不以焦点变化单独推断取消。
- guard、execute 或 Registry 查找失败时，会话已回到空闲，不继续普通文本 fallback，后续可更换命令并重试。宿主回调抛错不在此异常保护内，不承诺吞错、回滚或异步错误处理。

文档身份按引用判断：宿主在组合期间创建一个语义相等的新 value 对象，也视为替换并取消。受控接入应保持未编辑文档引用稳定，接受最终 after 后再回传新对象；本规则不检测原地修改模型对象，也不映射旧起点到新模型。无关 props 更新不取消会话，最终执行仍使用当前 Registry。

## 单次提交与 History

React 回退事件系统可能从同一个 `compositionend` 再合成 beforeinput；该 native event 不再进入普通插入管线，避免模型看似只更新一次却输出两条 transaction。此修正不使用定时器或“吞掉下一输入”标记，也不拒绝之后真正独立的文字输入事件。

每个有效结束事件输出一次 `insertCompositionText`，沿用 `batch: "composition"`。候选更新、取消和失效不记录 History。单次事件不等于强制独立 undo：两个不同会话的相邻 composition batch 仍可能按宿主原有 mergePolicy 合并，本轮未新增会话批次标识或修改 History 策略。

## 验收边界

已验证 Core 快照隔离、React 受控/非受控、通知变异、取消/替换/失败恢复、StrictMode/props/卸载、多实例、正反范围与 History，以及构建包挂载。Chromium 桌面和手机视口通过合成 CompositionEvent 验证文字、任务项、代码块和同 cell 多段范围，结果见[输入法 QA](../qa/ime-shortcuts-input-rules.md)。

合成事件不模拟操作系统候选窗、真实候选 DOM 改写、所有浏览器在结束后另发 textInput/insertFromComposition 的序列或真机输入法。本轮只修正同一 compositionend 的 React 回退重复路径，不宣称 Android/iOS/macOS 所有 IME 全面兼容；没有新增不可取消事件的事后 DOM 修复、Composition beforeinput 解析或候选内容持久化。

当前文本插入边界与普通输入命令一致：支持折叠选区、同一文本容器内跨 text 节点选区、连续顶层文本块选区，以及同一表格单元格内连续 paragraph 选区；不跨越列表项、不同 cell、进出表格或 void block 等结构边界。同 cell 跨段落替换由 React 事件测试和 Chromium Composition 事件测试覆盖，操作只记录一条 History。
