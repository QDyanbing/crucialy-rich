import {
  createDocument,
  createParagraph,
  createText,
  type DocumentNode,
} from "@crucialy-rich/core";
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

  it("marks editable renders as not readonly", () => {
    const html = renderToStaticMarkup(
      createElement(RichTextEditor, {
        contentEditable: true,
      }),
    );

    expect(html).toContain('aria-readonly="false"');
  });

  it("renders an empty document boundary", () => {
    const document: DocumentNode = {
      type: "document",
      children: [],
    };

    const html = renderToStaticMarkup(
      createElement(RichTextEditor, {
        label: "Empty editor",
        value: document,
      }),
    );

    expect(html).toContain('data-crucialy-path="[]"');
    expect(html).not.toContain("<p");
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

  it("prefers value over defaultValue", () => {
    const defaultValue = createDocument([
      createParagraph([createText("Default fallback.")]),
    ]);
    const value = createDocument([createParagraph([createText("Controlled wins.")])]);

    const html = renderToStaticMarkup(
      createElement(RichTextEditor, {
        defaultValue,
        value,
      }),
    );

    expect(html).toContain("Controlled wins.");
    expect(html).not.toContain("Default fallback.");
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

  it("does not emit onTransaction during initial render", () => {
    const handleTransaction = vi.fn();
    const document = createDocument([
      createParagraph([createText("Transaction callback waits for input.")]),
    ]);

    renderToStaticMarkup(
      createElement(RichTextEditor, {
        onTransaction: handleTransaction,
        value: document,
      }),
    );

    expect(handleTransaction).not.toHaveBeenCalled();
  });
});
