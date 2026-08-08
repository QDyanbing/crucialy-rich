# 文字属性 Mark

文字属性 Mark 用于描述 text 节点上的字号、文字颜色和背景颜色。第 11 周 Day 1 已完成数据模型设计；当前只建立可校验、可规范化、可组合的属性容器，不包含命令、渲染器和 demo 交互。

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

- `fontSize` 必须是大于 `0` 的有限数值；单位、可选范围和渲染策略由字号功能继续约束。
- `textColor` 必须是非空字符串；颜色格式白名单和安全过滤由文字颜色功能继续实现。
- `backgroundColor` 必须是非空字符串；颜色格式白名单和安全过滤由背景颜色功能继续实现。
- 非法属性会被 `normalizeTextMarks` 移除，并由 `validateDocument` 返回带节点路径的错误。

## 公共 Helper

- `isValidTextMarkAttributeValue(attribute, value)`：判断属性值是否满足基础模型约束。
- `getTextMarkAttribute(marks, attribute)`：读取经过规范化的属性值。
- `setTextMarkAttribute(marks, attribute, value)`：写入属性，同时保留其他合法 mark。
- `removeTextMarkAttribute(marks, attribute)`：移除属性；没有剩余 mark 时返回 `undefined`。
- `normalizeTextMarks(value)`：同时规范化 boolean mark 和属性 Mark。
- `areTextMarksEqual(left, right)`：同时比较 boolean mark 与三个属性值。

## 模型行为

- 相邻 text 节点只有在 boolean mark 和属性 Mark 全部一致时才会合并。
- boolean mark 的添加、移除和切换不会丢失属性 Mark。
- 文档规范化、段落拆分和 History 快照会保留合法属性 Mark。
- 工厂函数会复制传入的 marks，避免调用方后续修改原对象影响节点。

## 当前边界

- 尚未提供 `setFontSize`、`setTextColor`、`setBackgroundColor` 命令。
- renderer 尚未把三个属性输出为内联样式。
- React 组件与 demo 尚未提供字号或颜色控件。
- 颜色安全过滤和样式序列化将在各自功能闭环时确定。
