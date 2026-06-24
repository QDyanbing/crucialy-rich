# 脚手架补项清单

当前初始化阶段已覆盖：

- [x] MIT 协议和 package license。
- [x] pnpm workspace。
- [x] Node.js、pnpm、Volta 和安装前版本校验。
- [x] TypeScript project references。
- [x] tsup package 构建。
- [x] Vite demo 构建。
- [x] Vitest smoke。
- [x] Playwright e2e smoke。
- [x] ESLint 和 Prettier。
- [x] commitlint、lint-staged 和 Git hooks。
- [x] GitHub Actions CI。
- [x] Issue 模板和 PR 模板。
- [x] CONTRIBUTING、SECURITY、CODEOWNERS。
- [x] Dependabot。
- [x] 初始化流程文档。
- [x] 清理生成产物命令。
- [x] CHANGELOG。
- [x] 包开源发布元信息（publishConfig、repository、各包 README 和 LICENSE）。
- [x] 文档模型第一版。
- [x] Selection 第一版。
- [x] React 空编辑器外壳。
- [x] model demo 示例切换、校验状态和 normalize 验收入口。
- [x] selection demo 的 path 对应 JSON 节点高亮。
- [x] 基础 model 渲染和 demo 渲染验收。

暂不处理：

- [ ] 文档站，例如 VitePress 或 Docusaurus。
- [ ] 发布流水线与自动化 npm 发布，例如 changesets 或 semantic-release。
- [ ] React 富文本组件、DOM 到 model 映射和真实编辑行为。

这些暂不处理项需要等第一个可用包 API 或明确发布目标出现后再定。
