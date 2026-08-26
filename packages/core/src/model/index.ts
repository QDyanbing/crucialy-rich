export {
  BLOCK_TYPES,
  HEADING_LEVELS,
  LINK_REL_TOKENS,
  LINK_TARGETS,
  TEXT_MARK_ATTRIBUTE_TYPES,
  TEXT_MARK_TYPES,
} from "./types";
export type {
  BlockType,
  BlockNode,
  DocumentNode,
  HeadingLevel,
  HeadingNode,
  LinkMarkAttributes,
  LinkRelToken,
  LinkTarget,
  Node,
  ParagraphNode,
  QuoteNode,
  TextMarkAttributes,
  TextMarkAttributeType,
  TextMarks,
  TextMarkType,
  TextNode,
} from "./types";
export { isBlockNode, isDocumentNode, isParagraphNode, isTextNode } from "./guards";
export { createDocument, createParagraph, createText } from "./factories";
export {
  areLinkMarksEqual,
  isValidLinkMark,
  LINK_PROTOCOLS,
  normalizeLinkMark,
  normalizeLinkRel,
  normalizeLinkTarget,
  sanitizeLinkHref,
} from "./link";
export {
  addTextMark,
  areTextMarksEqual,
  getLinkMark,
  getTextMarkAttribute,
  hasTextMark,
  isValidFontSize,
  isValidTextMarkAttributeValue,
  MAX_FONT_SIZE,
  mergeAdjacentTextNodes,
  normalizeTextMarks,
  removeLinkMark,
  removeTextMarkAttribute,
  removeTextMark,
  sanitizeHexColor,
  MIN_FONT_SIZE,
  setLinkMark,
  setTextMarkAttribute,
  setTextMark,
  toggleTextMark,
} from "./marks";
export { validateDocument } from "./validate";
export type { ValidationError, ValidationResult } from "./validate";
export { normalizeDocument } from "./normalize";
