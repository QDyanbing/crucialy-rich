import { describe, expect, it } from "vitest";
import { isValidElement } from "react";

import * as reactPackage from "../src/index";
import { RichTextEditor } from "../src/index";

describe("@crucialy-rich/react public API", () => {
  it("exposes an importable package entry", () => {
    expect(reactPackage).toBeDefined();
  });

  it("exposes a renderable editor shell", () => {
    const element = RichTextEditor({});

    expect(isValidElement(element)).toBe(true);
    expect(element.props).toMatchObject({
      "aria-label": "Rich text editor",
      "data-crucialy-rich-editor": "true",
      role: "textbox",
    });
  });
});
