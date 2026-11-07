// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  createImage,
  createBlockSelection,
  createDefaultCommandRegistry,
  createTable,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe.each(["insertParagraph", "insertLineBreak"])(
  "native %s protection",
  (type) => {
    it.each([
      "readonly",
      "host",
      "composition",
      "isComposing",
      "missing-range",
      "block",
      "noncancelable",
    ])("does not create a transaction for %s", (mode) => {
      const host = mountDeletionEditor(
        createDocument([
          createParagraph([createText("AB")]),
          createImage("https://example.com/a.png"),
        ]),
        { path: [0, 0], offset: 1 },
        {
          contentEditable: mode !== "readonly",
          ...(mode === "host"
            ? { onNativeBeforeInput: (event) => event.preventDefault() }
            : {}),
          ...(mode === "block" ? { blockSelection: createBlockSelection([1]) } : {}),
        },
      );
      if (mode === "composition")
        act(() =>
          host.editor.dispatchEvent(
            new CompositionEvent("compositionstart", { bubbles: true }),
          ),
        );
      if (mode === "missing-range") window.getSelection()!.removeAllRanges();
      host.nativeInput(type, {
        isComposing: mode === "isComposing",
        cancelable: mode !== "noncancelable",
      });
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.editor.textContent).toBe("AB");
      expect(host.editor.querySelector("img")).not.toBeNull();
    });

    it.each(["disabled", "guard", "execute", "lookup"])(
      "contains a %s command failure without fallback",
      (stage) => {
        const registry = createDefaultCommandRegistry();
        const name = type === "insertParagraph" ? "splitBlock" : "insertText";
        const command = registry.get(name)!;
        registry.register({
          ...command,
          canExecute() {
            if (stage === "guard") throw new Error("Guard failed.");
            return stage !== "disabled";
          },
          execute() {
            throw new Error("Execution failed.");
          },
        });
        const source =
          stage === "lookup"
            ? {
                ...registry,
                get(key: string) {
                  if (key === name) throw new Error("Lookup failed.");
                  return registry.get(key);
                },
              }
            : registry;
        const host = mountDeletionEditor(
          createDocument([createParagraph([createText("AB")])]),
          { path: [0, 0], offset: 1 },
          { commandRegistry: source },
        );
        expect(host.nativeInput(type).defaultPrevented).toBe(true);
        expect(host.onTransaction).not.toHaveBeenCalled();
        expect(host.editor.textContent).toBe("AB");
      },
    );

    it("refuses cross-cell selections instead of trusting browser DOM changes", () => {
      const table = createTable(1, 2);
      for (const cell of table.children[0]!.children)
        cell.children[0]!.children[0]!.text = "AB";
      const host = mountDeletionEditor(createDocument([table]), {
        path: [0, 0, 0, 0, 0],
        offset: 1,
      });
      const text = host.editor.querySelectorAll("td span");
      window
        .getSelection()!
        .setBaseAndExtent(text[0]!.firstChild!, 1, text[1]!.firstChild!, 1);
      expect(host.nativeInput(type).defaultPrevented).toBe(true);
      expect(host.onTransaction).not.toHaveBeenCalled();
    });
  },
);

it.each([false, true])(
  "blocks image-selected keyboard Enter even without a DOM range (shift: %s)",
  (shiftKey) => {
    const host = mountDeletionEditor(
      createDocument([createImage("https://example.com/a.png")]),
      undefined,
      { blockSelection: createBlockSelection([0]) },
    );
    window.getSelection()!.removeAllRanges();
    expect(host.press("Enter", { shiftKey }).defaultPrevented).toBe(true);
    expect(host.onTransaction).not.toHaveBeenCalled();
    expect(host.editor.querySelector("img")).not.toBeNull();
  },
);
