export { TEXT_MARK_ATTRIBUTE_TYPES, TEXT_MARK_TYPES } from "./types";
export type {
  BlockNode,
  DocumentNode,
  Node,
  ParagraphNode,
  TextMarkAttributes,
  TextMarkAttributeType,
  TextMarks,
  TextMarkType,
  TextNode,
} from "./types";
export { isBlockNode, isDocumentNode, isParagraphNode, isTextNode } from "./guards";
export { createDocument, createParagraph, createText } from "./factories";
export {
  addTextMark,
  areTextMarksEqual,
  getTextMarkAttribute,
  hasTextMark,
  isValidTextMarkAttributeValue,
  mergeAdjacentTextNodes,
  normalizeTextMarks,
  removeTextMarkAttribute,
  removeTextMark,
  setTextMarkAttribute,
  setTextMark,
  toggleTextMark,
} from "./marks";
export { validateDocument } from "./validate";
export type { ValidationError, ValidationResult } from "./validate";
export { normalizeDocument } from "./normalize";
