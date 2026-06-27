import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

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

  it("renders a controlled document value", () => {
    const document = createDocument([
      createParagraph([createText("Controlled value.")]),
    ]);

    const html = renderToStaticMarkup(
      createElement(RichTextEditor, {
        label: "Controlled editor",
        value: document,
      }),
    );

    expect(html).toContain("Controlled value.");
    expect(html).toContain('data-crucialy-path="[0,0]"');
  });
});
