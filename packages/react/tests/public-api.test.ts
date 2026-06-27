import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import * as reactPackage from "../src/index";
import { RichTextEditor } from "../src/index";

describe("@crucialy-rich/react public API", () => {
  it("exposes an importable package entry", () => {
    expect(reactPackage).toBeDefined();
  });

  it("exposes a renderable editor shell", () => {
    const element = createElement(RichTextEditor);
    const html = renderToStaticMarkup(element);

    expect(isValidElement(element)).toBe(true);
    expect(html).toContain('aria-label="Rich text editor"');
    expect(html).toContain('data-crucialy-rich-editor="true"');
    expect(html).toContain('role="textbox"');
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

  it("renders an uncontrolled default document", () => {
    const document = createDocument([createParagraph([createText("Default value.")])]);

    const html = renderToStaticMarkup(
      createElement(RichTextEditor, {
        defaultValue: document,
        label: "Uncontrolled editor",
      }),
    );

    expect(html).toContain("Default value.");
    expect(html).toContain('aria-label="Uncontrolled editor"');
  });

  it("does not emit onChange during initial render", () => {
    const handleChange = vi.fn();
    const document = createDocument([
      createParagraph([createText("Read only render.")]),
    ]);

    renderToStaticMarkup(
      createElement(RichTextEditor, {
        onChange: handleChange,
        value: document,
      }),
    );

    expect(handleChange).not.toHaveBeenCalled();
  });
});
