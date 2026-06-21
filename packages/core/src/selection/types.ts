/**
 * Path 定位文档树中的节点。
 *
 * 当前模型层级为：
 * - []：document
 * - [blockIndex]：paragraph
 * - [blockIndex, textIndex]：text
 */
export type Path = number[];
