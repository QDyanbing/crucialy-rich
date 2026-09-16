import {
  createCodeBlock,
  createDocument,
  createDivider,
  createBlockSelection,
  createCellSelection,
  createImage,
  createParagraph,
  createText,
  createTaskItem,
  createTaskList,
  createTable,
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

  it("exposes the slash menu design helpers", () => {
    expect(typeof reactPackage.defineSlashCommandItems).toBe("function");
    expect(typeof reactPackage.createDefaultSlashCommandItems).toBe("function");
    expect(typeof reactPackage.filterSlashCommandItems).toBe("function");
    expect(typeof reactPackage.findSlashMenuTrigger).toBe("function");
  });

  it("exposes the slash menu interaction API", () => {
    expect(typeof reactPackage.SlashMenu).toBe("function");
    expect(typeof reactPackage.FloatingSlashMenu).toBe("function");
    expect(typeof reactPackage.calculateSlashMenuPosition).toBe("function");
    expect(typeof reactPackage.getSlashMenuKeyboardAction).toBe("function");
    expect(typeof reactPackage.moveSlashMenuSelection).toBe("function");
    expect(typeof reactPackage.executeSlashCommand).toBe("function");
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

  it("renders multiline code blocks through React", () => {
    const document = createDocument([
      createCodeBlock([createText("const value = 1;\nreturn value;")]),
    ]);
    const html = renderToStaticMarkup(
      createElement(RichTextEditor, { value: document }),
    );

    expect(html).toContain('<pre data-crucialy-path="[0]">');
    expect(html).toContain('<code data-crucialy-path="[0,0]">');
    expect(html).toContain("const value = 1;\nreturn value;");
  });

  it("renders dividers through React", () => {
    const html = renderToStaticMarkup(
      createElement(RichTextEditor, {
        value: createDocument([createDivider()]),
      }),
    );

    expect(html).toContain('<hr data-crucialy-path="[0]"/>');
  });

  it("renders selected images through React", () => {
    const html = renderToStaticMarkup(
      createElement(RichTextEditor, {
        blockSelection: createBlockSelection([0]),
        value: createDocument([
          createImage("https://example.com/cover.png", { alt: "封面" }),
        ]),
      }),
    );

    expect(html).toContain('<img data-crucialy-path="[0]"');
    expect(html).toContain('alt="封面"');
    expect(html).toContain('data-crucialy-image="true"');
    expect(html).toContain('data-selected="true"');
  });

  it("renders task list checkboxes through React", () => {
    const html = renderToStaticMarkup(
      createElement(RichTextEditor, {
        value: createDocument([
          createTaskList([createTaskItem([createText("完成")], true)]),
        ]),
      }),
    );

    expect(html).toContain('data-crucialy-list-type="task"');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("checked");
  });

  it("renders editable semantic table cells through React", () => {
    const html = renderToStaticMarkup(
      createElement(RichTextEditor, {
        contentEditable: true,
        value: createDocument([createTable(1, 1)]),
      }),
    );

    expect(html).toContain('data-crucialy-table="true"');
    expect(html).toContain('data-crucialy-table-cell="true"');
    expect(html).not.toContain('<table contenteditable="false"');
  });

  it("renders the selected table cell state", () => {
    const html = renderToStaticMarkup(
      createElement(RichTextEditor, {
        cellSelection: createCellSelection([0, 0, 1]),
        value: createDocument([createTable(1, 2)]),
      }),
    );

    expect(html.match(/data-selected="true"/g)).toHaveLength(1);
    expect(html).toContain(
      'data-crucialy-path="[0,0,1]" data-crucialy-table-cell="true" data-selected="true"',
    );
  });

  it("renders combined mark styles through React", () => {
    const document = createDocument([
      createParagraph([
        createText("Combined", {
          bold: true,
          italic: true,
          strike: true,
          underline: true,
        }),
      ]),
    ]);

    const html = renderToStaticMarkup(
      createElement(RichTextEditor, { value: document }),
    );

    expect(html).toContain(
      'style="font-style:italic;text-decoration:underline line-through"',
    );
  });

  it("renders a safe font size through React", () => {
    const document = createDocument([
      createParagraph([createText("Sized", { fontSize: 18 })]),
    ]);

    const html = renderToStaticMarkup(
      createElement(RichTextEditor, { value: document }),
    );

    expect(html).toContain('style="font-size:18px"');
  });

  it("renders a safe text color through React", () => {
    const document = createDocument([
      createParagraph([createText("Colored", { textColor: "#1677ff" })]),
    ]);

    const html = renderToStaticMarkup(
      createElement(RichTextEditor, { value: document }),
    );

    expect(html).toContain('style="color:#1677ff"');
  });

  it("renders safe foreground and background colors through React", () => {
    const document = createDocument([
      createParagraph([
        createText("Highlighted", {
          backgroundColor: "#fff4cc",
          textColor: "#1677ff",
        }),
      ]),
    ]);

    const html = renderToStaticMarkup(
      createElement(RichTextEditor, { value: document }),
    );

    expect(html).toContain('style="background-color:#fff4cc;color:#1677ff"');
  });

  it("renders safe link attributes and combined marks through React", () => {
    const document = createDocument([
      createParagraph([
        createText("Linked", {
          bold: true,
          link: {
            href: "https://example.com/docs",
            rel: "noopener noreferrer",
            target: "_blank",
          },
        }),
      ]),
    ]);

    const html = renderToStaticMarkup(
      createElement(RichTextEditor, { value: document }),
    );

    expect(html).toContain("<a");
    expect(html).toContain('href="https://example.com/docs"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('data-crucialy-path="[0,0]"');
    expect(html).toContain('style="font-weight:700;text-decoration:underline"');
    expect(html).toContain(">Linked</a>");
  });

  it("marks editable renders as not readonly", () => {
    const html = renderToStaticMarkup(
      createElement(RichTextEditor, {
        contentEditable: true,
      }),
    );

    expect(html).toContain('aria-readonly="false"');
  });

  it("accepts a paste event override on the editor shell", () => {
    const onPaste = vi.fn();
    const html = renderToStaticMarkup(
      createElement(RichTextEditor, {
        contentEditable: true,
        onPaste,
      }),
    );

    expect(html).toContain('contenteditable="true"');
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
