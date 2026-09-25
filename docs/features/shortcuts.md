# 编辑快捷键

编辑器使用统一快捷键解析入口区分格式命令和 History 动作，并在输入法组合期间暂停执行。

## 默认映射

| 快捷键                  | 动作             | 执行位置         |
| ----------------------- | ---------------- | ---------------- |
| `Ctrl/Meta + B`         | 加粗             | `RichTextEditor` |
| `Ctrl/Meta + I`         | 斜体             | `RichTextEditor` |
| `Ctrl/Meta + U`         | 下划线           | `RichTextEditor` |
| `Ctrl/Meta + Shift + X` | 删除线           | `RichTextEditor` |
| `Ctrl/Meta + Alt + 0`   | 恢复正文         | `RichTextEditor` |
| `Ctrl/Meta + Alt + 1–6` | 设置对应级别标题 | `RichTextEditor` |
| `Ctrl/Meta + Shift + 7` | 切换有序列表     | `RichTextEditor` |
| `Ctrl/Meta + Shift + 8` | 切换无序列表     | `RichTextEditor` |
| `Ctrl/Meta + Shift + 9` | 切换引用         | `RichTextEditor` |
| `Ctrl/Meta + Z`         | 撤销             | 宿主 History     |
| `Ctrl/Meta + Shift + Z` | 重做             | 宿主 History     |
| `Ctrl/Meta + Y`         | 重做             | 宿主 History     |

`getEditorShortcutAction(input)` 返回 `{ type: "command" }` 或 `{ type: "history" }`。Command action 可携带 payload，例如标题层级；History 映射优先解析，避免与普通 command 冲突。无主修饰键、修饰键不完全匹配和输入法组合事件不会触发命令。

命令快捷键由组件读取当前 DOM Selection、执行默认 Command，并通过 `onTransaction` 输出 `inputType: "formatShortcut"`。标题 payload 会透传给 `setHeading`，引用和列表直接复用已有 toggle command；组件不持有 History 状态，因此撤销和重做仍由宿主在 `onKeyDown` 中处理并调用 `preventDefault()`。

`CommandShortcutBinding` 支持可选 `payload`。宿主可用 `getCommandShortcutFromInput` 读取完整绑定，也可用 `getCommandNameFromShortcut` 只读取 command name；两者均支持传入自定义映射表。
