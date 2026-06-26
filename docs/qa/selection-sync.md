# QA：Selection 双向同步（第一版）

## 范围

验证浏览器 collapsed selection 和 model `RangeSelection` 的双向同步。

## 自动化测试

- `packages/core/tests/render/selection-sync.test.ts`：读取 collapsed browser selection、生成 DOM range、恢复 browser selection。
- `tests/e2e/demo-shell.spec.ts`：demo 渲染区 selection 同步到调试面板。

命令：

```sh
pnpm test
pnpm test:e2e
```

## 手测场景

| 场景                | 操作                           | 期望                              | 结果 |
| ------------------- | ------------------------------ | --------------------------------- | ---- |
| 读取 collapsed 光标 | 在渲染文本中设置浏览器光标     | 返回同位置 model selection        | 通过 |
| 恢复 collapsed 光标 | 传入 collapsed model selection | browser selection 落到对应 DOM 点 | 通过 |
| demo selection 同步 | 在渲染区改变浏览器 selection   | Selection JSON 同步更新           | 通过 |
| 无 selection range  | 清空 browser selection 后读取  | 返回 `undefined`                  | 通过 |

## 当前限制

- 当前自动化只覆盖 collapsed selection。
- 不保留反向 selection 方向。
- 不处理编辑输入、IME、删除或换行。

## 结论

Selection 双向同步第一版已闭环，可以进入 React 组件 API 接入阶段。
