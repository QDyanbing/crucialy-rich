import { describe, expect, it } from "vitest";

import {
  createCommandRegistry,
  createDocument,
  createParagraph,
  createText,
  queryCommandState,
} from "../../src";

const context = {
  document: createDocument([createParagraph([createText("你好")])]),
};

describe("queryCommandState", () => {
  it("returns a disabled state for missing commands", () => {
    const registry = createCommandRegistry();

    expect(queryCommandState(registry, "missing", { context })).toEqual({
      active: false,
      commandName: "missing",
      disabled: true,
      reason: "Command is not registered.",
      registered: false,
    });
  });
});
