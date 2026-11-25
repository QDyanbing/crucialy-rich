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
| 选中态恢复 | 宿主记录图片块选区，撤销恢复高亮、重做清除         | 通过 |

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

## 本地图片资源验收

2026-11-21 分配与适配器定向验收通过：`pnpm exec vitest run packages/react/tests/local-image*.test.ts` 为 8 个文件、39 项，含本轮新增 7 个文件、36 项；`pnpm exec playwright test tests/e2e/local-image*.spec.ts` 为 10 项，含新增 8 项。根类型检查、生产构建与构建包导入验证通过；全仓结果见[全量回归](./full-regression.md)。

- capabilities/allocation：能力缺失不分配，分配抛错无半成品，后续成功调用可恢复。
- protocol/adapter/release：非 blob 与空 blob 拒绝，原字符串清理；创建时方法与接收者绑定，payload 修改不重定向释放，多适配器独立，抛错及重入只尝试一次，不打断其他资源清理。
- mime/file：完整 MIME 标签与真实 File 名称、大小写及 SVG 子类型验证；只检查元数据，不读取或解码文件字节。
- `local-image-guards.spec.ts`：无合法插入上下文或活跃 Composition 时不分配，输入复位，组合结束可重选同一文件。
- `local-image-recovery.spec.ts`：桌面/手机分配抛错、非 blob 结果后模型/History 不变，再选同一文件可成功解码，新增一次 History，无 pageerror。
- `local-image-multiple.spec.ts`：两张图片各有独立 URL，撤销/重做及取消文件选择后均可 fetch，不因暂离当前模型而提前释放。
- 构建产物验证缺失能力、分配失败、非 blob 拒绝、原方法/原 URL 释放及错误隔离，公共类型签名不变。

1280×844 / 390×844 的恢复结果截图已检查，文字与编辑区边界正常；1px PNG 仅为解码夹具，不代表产品照片。失败清理不重试、不保证适配器实际回收，不提供上传、持久化、内容安全检查或真机 IME 全面认证。

2026-11-16 `local-image-lifecycle.spec.ts` 两条 Chromium 用例通过：真实 PNG 的 blob URL 在插入后、普通控件重渲染、撤销与重做后仍可 fetch，图片 naturalWidth 为 1；无合法插入上下文时不增加图片或 History，文件输入复位。成功资源仅在 Demo 卸载 cleanup 中回收，失败资源仍立即回收；原有 `local-image.test.ts` 的资源创建/幂等释放回归通过。

本轮没有创建上传服务、永久 URL 或资源引用计数；当前文档外的 History 仍可能引用 blob，所以撤销不能成为释放条件。长会话容量、跨会话存储不在验收范围，全量结果见[全量回归](./full-regression.md)。

## 结论

### 块选区输入归属验收

2026-11-25 本地 `pnpm check:all` 通过：366 个文件、2958 项单测及 447 项 Chromium，全部类型、构建和包导入门禁通过。

- `image-text-input-guard.test.ts`：11 项先复现后修复，覆盖受控/非受控旧文字范围下的普通文本、Space、输入规则及 HTML/纯文本粘贴；不读剪贴板数据、不提交模型/选区/事务通知。
- `image-shortcut-guard.test.ts`：18 项，8 类文字格式快捷键在两种模式下不改旧文字、块高亮或 History，不调用自定义扩展；Delete 仍可删除图片。
- `image-input-ownership.spec.ts`：4 项，1280×844 / 390×844 保留旧 DOM Range 后真实键盘/粘贴不修改正文；重新点击文字恢复输入，Delete 和撤销恢复图片及高亮。主流程无 pageerror，手机截图已检查；图片为离线 PNG 夹具，不验证远端照片内容。
- 构建包实际挂载验证旧文字范围下格式快捷键、粘贴数据零读取，以及随后正常删除图片。

不自动替换图片或在图片旁插入文字；宿主必须回传清除后的 blockSelection 才能恢复文字编辑。宿主事件仍先执行，只读/组合优先级不变；不限制显式 ref 命令或外部按钮，不宣称全局权限或所有真机输入法兼容。

第 19 周图片能力已形成代码、测试、中文 Demo、文档和浏览器验收闭环，并补齐安全 HTML 图片粘贴。上传服务仍由集成方提供。

2026-10-20 补齐普通段落的 HTML／Markdown 图文混排导入验收；图片仍为顶层 void block，不引入行内布局、图片链接或列表／cell 内图片。

2026-10-30 补齐安全单图剪切和图片删除旧选区快照验收：无合法旧文字选区时不伪造 Point，撤销恢复图片但不自动恢复块高亮。桌面/手机离线夹具截图、图片解码和独立撤销/重做通过；全量 `pnpm check:all` 为 1762 项单测与 226 项 Chromium 用例通过。不包含跨图片文字范围剪切、文件字节复制或远端可达性验证。

2026-10-31 补齐可选图片选中态快照：React 原生剪切与 Backspace/Delete 输出独立 `beforeBlockSelection`，Demo 将其传给 History 快照第三参数，撤销恢复图片高亮，重做清除；旧快照不猜造选中态。新增浏览器用例覆盖桌面/手机无 DOM Range 的再次复制/删除、原生 History 快捷键、文字编辑和旧高亮清除。截图发现手机旧悬浮文字工具栏遮挡后，已在图片选中/History 应用时清除锚点并重跑验证，最终截图无遮挡或溢出。离线夹具不代表远端照片内容，全量结果为 1787 项单测和 234 项 Chromium 用例通过。
