import { describe, expect, it } from "vitest";

import * as core from "../src/index";

describe("@crucialy-rich/core public API", () => {
  it("exposes an importable package entry", () => {
    expect(core).toBeDefined();
  });

  it("exposes the document model API", () => {
    expect(typeof core.createDocument).toBe("function");
    expect(typeof core.createParagraph).toBe("function");
    expect(typeof core.createText).toBe("function");
    expect(typeof core.validateDocument).toBe("function");
    expect(typeof core.normalizeDocument).toBe("function");
    expect(typeof core.isDocumentNode).toBe("function");
  });

  it("exposes the selection API", () => {
    expect(typeof core.getNodeAtPath).toBe("function");
    expect(typeof core.hasNodeAtPath).toBe("function");
    expect(typeof core.isValidPoint).toBe("function");
    expect(typeof core.comparePoint).toBe("function");
    expect(typeof core.compareRange).toBe("function");
    expect(typeof core.isCollapsed).toBe("function");
    expect(typeof core.normalizeRange).toBe("function");
    expect(typeof core.getTextInRange).toBe("function");
    expect(typeof core.splitTextByRange).toBe("function");
  });

  it("exposes the render API", () => {
    expect(typeof core.MODEL_PATH_ATTRIBUTE).toBe("string");
    expect(typeof core.createModelPathAttributes).toBe("function");
    expect(typeof core.encodeModelPath).toBe("function");
    expect(typeof core.decodeModelPath).toBe("function");
    expect(typeof core.domPointToModelPoint).toBe("function");
    expect(typeof core.findClosestModelPathElement).toBe("function");
    expect(typeof core.findElementByModelPath).toBe("function");
    expect(typeof core.getElementModelPath).toBe("function");
    expect(typeof core.modelPointToDomPoint).toBe("function");
    expect(typeof core.domSelectionToModelSelection).toBe("function");
    expect(typeof core.createDomRangeFromModelSelection).toBe("function");
    expect(typeof core.applyModelSelectionToDom).toBe("function");
    expect(typeof core.renderDocument).toBe("function");
    expect(typeof core.renderNodeToHtml).toBe("function");
  });

  it("exposes the operation API", () => {
    expect(typeof core.createInsertTextOperation).toBe("function");
    expect(typeof core.applyInsertText).toBe("function");
    expect(typeof core.createSelectionAfterInsertText).toBe("function");
    expect(typeof core.createDeleteTextOperation).toBe("function");
    expect(typeof core.applyDeleteText).toBe("function");
    expect(typeof core.createSelectionAfterDeleteText).toBe("function");
  });
});
