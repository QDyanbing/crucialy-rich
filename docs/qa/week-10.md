# QA：第 10 周 Underline 和 Strike 闭环

## 当前进度

第 10 周 Day 1「样式叠加规则」已完成。

☑️ 当前指针：第 10 周 Day 2「Underline」待开始。

## 已完成范围

- `TextMarkType` 新增 `underline` 和 `strike`。
- `TEXT_MARK_TYPES` 统一包含 bold、italic、underline 和 strike。
- 同一个 text 节点可以同时启用四种 boolean mark。
- 工厂函数会复制完整 marks 对象。
- mark helper 可以独立添加、移除和设置四种 mark。
- 校验会接受四种 mark，并继续拒绝未知 mark 和非 `true` 值。
- 规范化会保留四种合法 mark，并丢弃未知或未启用 mark。
- `toggle_mark` 可以修改 underline/strike，同时保留其他已启用 mark。
- History 快照会深拷贝四种 boolean mark。
- 功能文档已记录四种 mark 的叠加与合并规则。

## 自动化覆盖

- `packages/core/tests/model/types.test.ts`
- `packages/core/tests/model/factories.test.ts`
- `packages/core/tests/model/marks.test.ts`
- `packages/core/tests/model/validate.test.ts`
- `packages/core/tests/model/normalize.test.ts`
- `packages/core/tests/operation/toggle-mark.test.ts`
- `packages/core/tests/history/snapshot.test.ts`
- `packages/core/tests/public-api.test.ts`

## 当前边界

- Underline command、renderer 和 demo 按钮尚未实现。
- Strike command、renderer 和 demo 按钮尚未实现。
- React 组件仍未提供内置 toolbar。
- mark 应用范围仍限制在同一个 paragraph 内。

## 结论

四种 boolean mark 已能在同一个 text 节点上稳定共存。下一步进入 Underline command 与 renderer。
