# QA：图片闭环

## 验收范围

验证图片模型、URL 安全、本地预览、插入/删除命令、块选区、渲染、React、History、中文 Demo 和浏览器交互符合第 19 周任务清单。

## 能力矩阵

| 场景       | 预期                                               | 状态 |
| ---------- | -------------------------------------------------- | ---- |
| 图片模型   | 包含 src、alt、width、height、status 和空 children | 通过 |
| URL 安全   | 仅接受绝对 HTTP、HTTPS 和 blob 地址                | 通过 |
| 规范化     | 移除危险图片并修复 attrs、状态和 children          | 通过 |
| URL 插入   | 折叠光标处拆分文本块并插入图片                     | 通过 |
| 本地入口   | image 文件生成可释放的 object URL，不上传          | 通过 |
| 语义渲染   | core、HTML 与 React 输出一致的 void img            | 通过 |
| 块选区     | 点击图片输出独立 BlockSelection 和选中态           | 通过 |
| 键盘删除   | Backspace/Delete 删除图片并恢复文本光标            | 通过 |
| 空文档边界 | 删除最后一张图片后补空 paragraph                   | 通过 |
| History    | 插入和删除均通过 Transaction 进入撤销栈            | 通过 |

## 自动化覆盖

- 模型与安全：`packages/core/tests/model`。
- Operation 与 History 值隔离：`packages/core/tests/operation/insert-block.test.ts`、`packages/core/tests/history/snapshot.test.ts`。
- 命令与默认注册表：`packages/core/tests/command/image.test.ts`、`integration.test.ts`。
- 块选区：`packages/core/tests/selection/block.test.ts`。
- Renderer 与公共 API：core/react 的 render 和 public API 测试。
- 本地文件生命周期：`packages/react/tests/local-image.test.ts`。
- 浏览器：`tests/e2e/demo-shell.spec.ts` 覆盖 URL 插入、点击选中、Delete 删除和本地文件预览。

## 本地验收

```sh
pnpm check:all
```

## 结论

第 19 周图片能力已形成代码、测试、中文 Demo、文档和浏览器验收闭环。上传服务仍由集成方提供，下一步进入第 20 周粘贴闭环。
