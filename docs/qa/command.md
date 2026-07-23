# QA：Command 闭环验收

## 验收范围

Command 验收覆盖注册、查询、状态读取、执行结果、内置 Bold 命令、内置文本命令、内置块命令、React 输入层复用和 demo 调试区。

当前内置 command：

- `insertTextCommand`
- `deleteSelectionCommand`
- `boldCommand`
- `splitBlockCommand`
- `mergeBlockCommand`

## 自动化覆盖

- `packages/core/tests/command/result.test.ts`：成功、失败、跳过结果。
- `packages/core/tests/command/registry.test.ts`：注册、覆盖和列表读取。
- `packages/core/tests/command/can-execute.test.ts`：可执行判断。
- `packages/core/tests/command/execute.test.ts`：按名称执行和异常保护。
- `packages/core/tests/command/insert-text.test.ts`：插入和 range 替换。
- `packages/core/tests/command/delete-selection.test.ts`：range 删除和反向 range 规范化。
- `packages/core/tests/command/bold.test.ts`：选区加粗、取消加粗、collapsed 后续输入继承和 active 状态。
- `packages/core/tests/command/split-block.test.ts`：段落分裂 command。
- `packages/core/tests/command/merge-block.test.ts`：段落合并 command。
- `packages/core/tests/command/state.test.ts`：状态读取和默认命令状态矩阵。
- `packages/core/tests/command/integration.test.ts`：默认注册表综合执行闭环。
- `tests/e2e/demo-shell.spec.ts`：demo 操作区、真实键盘输入和 Command 状态面板。

## 手测场景

| 场景       | 操作                                            | 预期                                            | 状态 |
| ---------- | ----------------------------------------------- | ----------------------------------------------- | ---- |
| 文本插入   | 在 demo 操作区输入文本后点击“插入”              | 文档 JSON 更新，最近 transaction 包含 insert    | 通过 |
| 选区删除   | 设置非折叠选区后点击“删除选区”                  | 文档 JSON 更新，selection 折叠到删除起点        | 通过 |
| 加粗       | 设置同 text 选区后点击“加粗”                    | 文档 JSON 出现 bold marks，渲染输出 strong      | 通过 |
| 分段       | 设置 collapsed selection 后点击“分段”           | 文档新增 paragraph，最近 transaction 包含 split | 通过 |
| 合并段落   | 设置第二段段首 collapsed selection 后点击“合并” | 两段合并，最近 transaction 包含 merge           | 通过 |
| 状态读取   | 调整 selection 的 anchor/focus                  | Command 状态面板在可用/不可用/激活之间同步切换  | 通过 |
| React 输入 | 在编辑器中输入、Enter、Backspace、Delete        | 输入层优先复用 command，文档和 selection 同步   | 通过 |
| 默认注册表 | demo 和 React 使用默认 command registry         | 两侧内置 command 顺序和可执行状态保持一致       | 通过 |

## 当前限制

- 文本 command 当前只支持同一 text 节点内的 range selection。
- Bold command 当前只支持同一 text 节点内的 selection。
- block command 当前只支持 collapsed selection。
- collapsed Backspace/Delete 的单字符删除仍保留 input helper；跨段合并路径会优先复用 block command。
- 当前还没有 toolbar 分组和快捷键映射；history/undo/redo 已由 History 模块提供。

## 结论

Command 系统已经完成默认注册表、内置编辑命令和 Bold command 第一版：demo 和 React 复用同一套 registry，状态面板可验证 command 可用性和 active 状态，自动化测试覆盖默认注册、状态矩阵、综合执行和浏览器交互。
