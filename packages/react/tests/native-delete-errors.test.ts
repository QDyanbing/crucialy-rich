// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  createTable,
  createDefaultCommandRegistry,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe.each(["deleteContentBackward", "deleteContentForward"])(
  "native %s command failures",
  (type) => {
    for (const stage of ["guard", "execute", "lookup"]) {
      it.each(["caret", "range", "merge"])(
        `does not fall back after ${stage} fails for %s`,
        (mode) => {
          const registry = createDefaultCommandRegistry();
          const name = mode === "merge" ? "mergeBlock" : "deleteSelection";
          const original = registry.get(name)!;
          registry.register({
            ...original,
            canExecute() {
              if (stage === "guard") throw new Error("Guard failed.");
              return true;
            },
            execute(input) {
              if (stage === "execute") throw new Error("Execute failed.");
              return original.execute(input);
            },
          });
          const selectedRegistry =
            stage === "lookup"
              ? {
                  ...registry,
                  get(command: string) {
                    if (command === name) throw new Error("Lookup failed.");
                    return registry.get(command);
                  },
                }
              : registry;
          const point =
            mode === "merge"
              ? type === "deleteContentBackward"
                ? { path: [1, 0], offset: 0 }
                : { path: [0, 0], offset: 2 }
              : { path: [0, 0], offset: 1 };
          const before = createDocument([
            createParagraph([createText("AB")]),
            createParagraph([createText("CD")]),
          ]);
          const host = mountDeletionEditor(before, point, {
            commandRegistry: selectedRegistry,
          });
          if (mode === "range") {
            const text = host.editor.querySelector("span")!.firstChild!;
            window.getSelection()!.setBaseAndExtent(text, 0, text, 1);
          }
          expect(host.nativeInput(type).defaultPrevented).toBe(true);
          expect(host.onTransaction).not.toHaveBeenCalled();
          expect(host.ref.current!.getDocument()).toEqual(before);
        },
      );
    }

    it("does not delete a disabled explicit range", () => {
      const registry = createDefaultCommandRegistry();
      registry.register({
        ...registry.get("deleteSelection")!,
        canExecute: () => false,
      });
      const host = mountDeletionEditor(
        createDocument([createParagraph([createText("AB")])]),
        { path: [0, 0], offset: 1 },
        { commandRegistry: registry },
      );
      const text = host.editor.querySelector("span")!.firstChild!;
      window.getSelection()!.setBaseAndExtent(text, 0, text, 1);
      host.nativeInput(type);
      expect(host.onTransaction).not.toHaveBeenCalled();
    });

    it("retains the ordinary collapsed helper when range deletion is simply unavailable", () => {
      const registry = createDefaultCommandRegistry();
      registry.register({
        ...registry.get("deleteSelection")!,
        canExecute: () => false,
      });
      const host = mountDeletionEditor(
        createDocument([createParagraph([createText("AB")])]),
        { path: [0, 0], offset: 1 },
        { commandRegistry: registry },
      );
      host.nativeInput(type);
      expect(host.editor.textContent).toBe(
        type === "deleteContentBackward" ? "B" : "A",
      );
    });

    it("blocks unsupported cross-cell range deletion without browser mutation", () => {
      const table = createTable(1, 2);
      table.children[0]!.children[0]!.children[0]!.children[0]!.text = "AB";
      table.children[0]!.children[1]!.children[0]!.children[0]!.text = "CD";
      const before = createDocument([table]);
      const host = mountDeletionEditor(before, { path: [0, 0, 0, 0, 0], offset: 1 });
      const texts = host.editor.querySelectorAll("td span");
      window
        .getSelection()!
        .setBaseAndExtent(texts[0]!.firstChild!, 1, texts[1]!.firstChild!, 1);
      expect(host.nativeInput(type).defaultPrevented).toBe(true);
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.ref.current!.getDocument()).toEqual(before);
    });
  },
);
