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
| HTML 粘贴  | 安全图片和独立图片段落进入模型并保留受控属性       | 通过 |
| 图文混排   | HTML／Markdown 段落按源顺序拆分文字和独立图片块    | 通过 |
| 本地入口   | image 文件生成可释放的 object URL，不上传          | 通过 |
| 语义渲染   | core、HTML 与 React 输出一致的 void img            | 通过 |
| 块选区     | 点击图片输出独立 BlockSelection 和选中态           | 通过 |
| 键盘删除   | Backspace/Delete 删除图片并恢复文本光标            | 通过 |
| 单图剪切   | 可编辑 HTML 模式写入成功才删除，失败保留图片       | 通过 |
| 空文档边界 | 删除最后一张图片后补空 paragraph                   | 通过 |
| History    | 插入和删除均通过 Transaction 进入撤销栈            | 通过 |

## 自动化覆盖

- 模型与安全：`packages/core/tests/model`。
- Operation 与 History 值隔离：`packages/core/tests/operation/insert-block.test.ts`、`packages/core/tests/history/snapshot.test.ts`。
- 命令与默认注册表：`packages/core/tests/command/image.test.ts`、`integration.test.ts`。
- 块选区：`packages/core/tests/selection/block.test.ts`。
- Renderer 与公共 API：core/react 的 render 和 public API 测试。
- 本地文件生命周期：`packages/react/tests/local-image.test.ts`。
- HTML 粘贴：core parser、Command/History、React 原生事件和 Chromium 端到端测试。
- 图文混排：HTML/Markdown Parser、Command/History、React 和构建产物测试覆盖嵌套包装、连续图片、文字样式、安全属性、正反向范围与末尾图片光标；Chromium 七条用例覆盖图片资源实际加载、History、续编、受限目标和 Office 来源策略。
- 浏览器：`tests/e2e/demo-shell.spec.ts` 覆盖 URL 插入、HTML 粘贴、点击选中、Delete 删除和本地文件预览。
- 单图剪切：`packages/core/tests/history/image-cut.test.ts`、React 剪贴板测试和 `tests/e2e/clipboard.spec.ts` 验证 `deleteImage` 复用、写入/命令失败不删除、焦点/只读/受控边界、默认 plain/临时图片拒绝、仅图片文档补段落及剪切/粘贴独立 History；声明检查验证可选 `beforeSelection`。

## 本地验收

```sh
pnpm check:all
```

## 结论

第 19 周图片能力已形成代码、测试、中文 Demo、文档和浏览器验收闭环，并补齐安全 HTML 图片粘贴。上传服务仍由集成方提供。

2026-10-20 补齐普通段落的 HTML／Markdown 图文混排导入验收；图片仍为顶层 void block，不引入行内布局、图片链接或列表／cell 内图片。

2026-10-30 补齐安全单图剪切和图片删除旧选区快照验收：无合法旧文字选区时不伪造 Point，撤销恢复图片但不自动恢复块高亮。桌面/手机离线夹具截图、图片解码和独立撤销/重做通过；全量 `pnpm check:all` 为 1762 项单测与 226 项 Chromium 用例通过。不包含跨图片文字范围剪切、文件字节复制或远端可达性验证。
