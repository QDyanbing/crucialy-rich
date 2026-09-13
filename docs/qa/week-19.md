# QA：第 19 周图片闭环

## 当前进度

第 19 周 Day 1 至 Day 5 已全部完成。

☑️ 当前指针：第 20 周 Day 1「Clipboard 架构」待开始。

## 每日完成情况

- Day 1：完成 ImageNode、工厂、守卫、协议清洗、校验、规范化及模型测试。
- Day 2：完成语义渲染、HTML 序列化、`insertImage` 命令、默认注册和 URL 插入 Demo。
- Day 3：完成本地 image 文件筛选、object URL 创建/释放和“不上传”中文入口。
- Day 4：完成 BlockSelection、图片点击选中态、Backspace/Delete 删除及光标恢复。
- Day 5：完成公共导出、History/Operation 隔离测试、浏览器综合回归、功能文档和 QA。

## 自动化结果

- Vitest 覆盖模型、命令、选区、渲染、本地文件和公共 API。
- Playwright 覆盖 URL 图片、本地图片、图片选中、键盘删除、History 和模型合法性。
- 全量入口：`pnpm check:all`。

## 结论

实现与第 19 周任务清单一致，没有提前引入粘贴解析或真实上传服务。图片闭环完成后进入 Clipboard 架构设计。
