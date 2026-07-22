export { TEXT_MARK_TYPES } from "./types";
export type {
  BlockNode,
  DocumentNode,
  Node,
  ParagraphNode,
  TextMarks,
  TextMarkType,
  TextNode,
} from "./types";
export { isBlockNode, isDocumentNode, isParagraphNode, isTextNode } from "./guards";
export { createDocument, createParagraph, createText } from "./factories";
export {
  addTextMark,
  areTextMarksEqual,
  hasTextMark,
  normalizeTextMarks,
  removeTextMark,
  toggleTextMark,
} from "./marks";
export { validateDocument } from "./validate";
export type { ValidationError, ValidationResult } from "./validate";
export { normalizeDocument } from "./normalize";
