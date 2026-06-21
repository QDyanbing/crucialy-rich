export type { Path, Point, RangeSelection } from "./types";
export { getNodeAtPath, hasNodeAtPath } from "./path";
export { comparePoint, isValidPoint } from "./point";
export { compareRange, isCollapsed, normalizeRange } from "./range";
export { getTextInRange, splitTextByRange } from "./text-range";
export type { TextRangeSplit } from "./text-range";
