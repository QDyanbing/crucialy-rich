# QA：第 18 周斜杠菜单闭环

## 当前进度

第 18 周 Day 1 至 Day 5 已全部完成。

☑️ 当前指针：第 19 周 Day 1「Image 模型设计」待开始。

## 每日完成情况

- Day 1：完成 Slash Command 配置、默认目录、过滤、触发条件、测试和设计文档。
- Day 2：完成菜单开关状态、光标浮层、上下翻转、视口约束和 Escape 关闭。
- Day 3：完成上下键循环选择、活动项解析和 Enter 执行入口。
- Day 4：完成 `/query` 跨 text 清理、目标命令执行、Transaction 合并和 History 往返。
- Day 5：完成 React 公共导出、中文 Demo、浏览器综合回归和独立 QA。

## 自动化结果

- 配置、过滤、触发、状态、键盘、定位、渲染和执行器由 Vitest 覆盖。
- 跨相邻 text 节点删除由 core operation 回归覆盖。
- Playwright 覆盖 `/` 打开、Escape 关闭、上下键回绕、`/h2` 过滤、Enter 执行、无残留触发文本和撤销恢复。
- 全量入口：`pnpm check:all`。

## 结论

实现与第 18 周任务清单一致。斜杠菜单已完成代码、测试、中文 Demo、文档和验收闭环，下一步进入图片模型设计。
