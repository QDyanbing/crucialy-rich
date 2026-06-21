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
    expect(typeof core.isCollapsed).toBe("function");
    expect(typeof core.normalizeRange).toBe("function");
    expect(typeof core.getTextInRange).toBe("function");
    expect(typeof core.splitTextByRange).toBe("function");
  });
});
