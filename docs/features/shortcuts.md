# 编辑快捷键

编辑器使用统一快捷键解析入口区分格式命令和 History 动作，并在输入法组合期间暂停执行。

## 默认映射

| 快捷键                  | 动作   | 执行位置         |
| ----------------------- | ------ | ---------------- |
| `Ctrl/Meta + B`         | 加粗   | `RichTextEditor` |
| `Ctrl/Meta + I`         | 斜体   | `RichTextEditor` |
| `Ctrl/Meta + U`         | 下划线 | `RichTextEditor` |
| `Ctrl/Meta + Z`         | 撤销   | 宿主 History     |
| `Ctrl/Meta + Shift + Z` | 重做   | 宿主 History     |
| `Ctrl/Meta + Y`         | 重做   | 宿主 History     |

`getEditorShortcutAction(input)` 返回 `{ type: "command" }` 或 `{ type: "history" }`。History 映射优先解析，避免与普通 command 冲突；`Alt` 组合、无修饰键和输入法组合事件不会触发格式命令。

格式快捷键由组件读取当前 DOM Selection、执行默认 Command，并通过 `onTransaction` 输出 `inputType: "formatShortcut"`。组件不持有 History 状态，因此撤销和重做仍由宿主在 `onKeyDown` 中处理并调用 `preventDefault()`。
