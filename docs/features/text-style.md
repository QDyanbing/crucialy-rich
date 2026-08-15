# 文字属性 Mark

文字属性 Mark 用于描述 text 节点上的字号、文字颜色和背景颜色。第 11 周 Day 1 已完成数据模型设计，Day 2 已完成字号闭环，Day 3 已完成文字颜色闭环。

## 数据结构

```ts
const TEXT_MARK_ATTRIBUTE_TYPES = ["fontSize", "textColor", "backgroundColor"] as const;

interface TextMarkAttributes {
  fontSize: number;
  textColor: string;
  backgroundColor: string;
}

type TextMarks = Partial<Record<TextMarkType, true>> & Partial<TextMarkAttributes>;
```

属性 Mark 与 `bold`、`italic`、`underline`、`strike` 共用 `TextNode.marks`，因此同一个 text 节点可以同时表达字号、前景色、背景色和多个 boolean mark。

```ts
createText("示例", {
  bold: true,
  fontSize: 18,
  textColor: "#1677ff",
  backgroundColor: "#fff1b8",
});
```

## 合法值

- `fontSize` 必须是 `8` 到 `72` 之间的整数，模型值不携带单位，renderer 统一输出像素。
- `textColor` 只接受 `#RGB` 或 `#RRGGBB`；规范化时去除首尾空白、转为小写，并把三位格式展开成六位。
- `backgroundColor` 必须是非空字符串；颜色格式白名单和安全过滤由背景颜色功能继续实现。
- 非法属性会被 `normalizeTextMarks` 移除，并由 `validateDocument` 返回带节点路径的错误。

## 公共 Helper

- `isValidTextMarkAttributeValue(attribute, value)`：判断属性值是否满足基础模型约束。
- `getTextMarkAttribute(marks, attribute)`：读取经过规范化的属性值。
- `setTextMarkAttribute(marks, attribute, value)`：写入属性，同时保留其他合法 mark。
- `removeTextMarkAttribute(marks, attribute)`：移除属性；没有剩余 mark 时返回 `undefined`。
- `normalizeTextMarks(value)`：同时规范化 boolean mark 和属性 Mark。
- `areTextMarksEqual(left, right)`：同时比较 boolean mark 与三个属性值。
- `isValidFontSize(value)`：使用 `MIN_FONT_SIZE` 和 `MAX_FONT_SIZE` 判断字号是否受支持。
- `sanitizeHexColor(value)`：返回规范化的六位十六进制颜色，非法值返回 `undefined`。

## 模型行为

- 相邻 text 节点只有在 boolean mark 和属性 Mark 全部一致时才会合并。
- boolean mark 的添加、移除和切换不会丢失属性 Mark。
- 文档规范化、段落拆分和 History 快照会保留合法属性 Mark。
- 工厂函数会复制传入的 marks，避免调用方后续修改原对象影响节点。

## 字号命令

`setFontSizeCommand` 已加入默认 Command 注册表，payload 为 `{ fontSize: number | null }`：

- `8–72` 的整数会通过 `set_mark_attribute` operation 应用到同一 paragraph 内的选区。
- `null` 会取消选区字号，同时保留 boolean mark 和其他属性 Mark。
- 越界值、小数、缺失 payload、非法选区或跨 paragraph 选区会跳过执行。
- 非折叠选区支持跨多个 text 节点切分与合并；折叠选区会创建可供后续输入继承字号的空 text 占位。
- operation 应用后会按 paragraph text offset 重新映射 selection，并可进入 Transaction 与 History 管线。

## 字号渲染与 Demo

- renderer 只把通过 `isValidFontSize` 的模型值输出为 `font-size: <value>px`。
- 字号与 bold、italic、underline、strike 共用同一个 text path 元素，不产生额外模型路径。
- HTML 序列化与 React 渲染复用同一结构化 style。
- 中文 demo 提供“默认字号”、12px、14px、16px、18px、24px 和 32px 选项。
- demo 字号修改会记录 Transaction、History 和验收报告；浏览器测试覆盖设置与取消。

## 文字颜色命令

`setTextColorCommand` 已加入默认 Command 注册表，payload 为 `{ textColor: string | null }`：

- `#RGB` 和 `#RRGGBB` 会先经过 `sanitizeHexColor`，再通过 `set_mark_attribute` operation 应用。
- `null` 会取消选区文字颜色，同时保留字号、boolean mark 和其他属性。
- CSS 颜色名、`rgb()`、带 alpha 的十六进制、缺失 `#` 和包含额外声明的字符串都会被拒绝。
- 非折叠选区支持跨 text 节点；折叠选区的后续输入会继承已设置的文字颜色。

## 文字颜色渲染与 Demo

- renderer 只从规范化模型读取 `textColor`，并输出结构化 `style.color`。
- HTML serializer 和 React renderer 不直接接收命令 payload，避免额外 CSS 声明污染结构。
- 中文 demo 提供原生颜色选择器和“取消文字颜色”按钮。
- demo 预置彩色字号与组合格式样例，浏览器测试覆盖应用、组合和取消。

## 当前边界

- 尚未提供 `setBackgroundColor` 命令。
- renderer 尚未输出背景颜色。
- React 组件与 demo 尚未提供背景颜色控件。
- `backgroundColor` 的安全过滤和样式序列化将在 Day 4 闭环。
