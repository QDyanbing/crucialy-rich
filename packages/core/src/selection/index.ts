export type { Path, Point, RangeSelection } from "./types";
export { getNodeAtPath, hasNodeAtPath } from "./path";
export {
  getParagraphTextOffset,
  getPointAtParagraphTextOffset,
} from "./paragraph-offset";
export type {
  PointAtParagraphTextOffsetOptions,
  TextOffsetAffinity,
} from "./paragraph-offset";
export { comparePoint, isValidPoint } from "./point";
export {
  cloneRangeSelection,
  compareRange,
  isCollapsed,
  normalizeRange,
} from "./range";
export { getTextInRange, splitTextByRange } from "./text-range";
export type { TextRangeSplit } from "./text-range";
