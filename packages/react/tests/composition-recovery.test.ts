// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  createDefaultCommandRegistry,
  createTable,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

const value = () => createDocument([createParagraph([createText("AB")])]);
const point = { path: [0, 0], offset: 1 };

describe("composition failure recovery", () => {
  it.each(["disabled", "guard", "execute", "lookup"])(
    "clears the session after %s and accepts a later repaired command",
    (stage) => {
      const registry = createDefaultCommandRegistry();
      registry.register({
        ...registry.get("insertText")!,
        canExecute() {
          if (stage === "guard") throw new Error("Guard failed.");
          return stage !== "disabled";
        },
        execute() {
          throw new Error("Execute failed.");
        },
      });
      const policy =
        stage === "lookup"
          ? {
              ...registry,
              get(name: string) {
                if (name === "insertText") throw new Error("Lookup failed.");
                return registry.get(name);
              },
            }
          : registry;
      const host = mountDeletionEditor(value(), point, { commandRegistry: policy });
      host.compose("compositionstart");
      host.compose("compositionend", "失败候选");
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.editor.getAttribute("data-composing")).toBe("false");
      expect(host.editor.textContent).toBe("AB");
      host.rerender({ commandRegistry: createDefaultCommandRegistry() });
      host.setCaret(point);
      host.compose("compositionstart");
      host.compose("compositionend", "新");
      expect(host.editor.textContent).toBe("A新B");
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    "Backspace",
    "Delete",
    "Enter",
    "Shift+Enter",
    "native-delete",
    "native-paragraph",
    "native-line",
    "paste",
  ])("does not commit a separate %s while composing", (action) => {
    const host = mountDeletionEditor(value(), point);
    host.compose("compositionstart");
    if (action.startsWith("native"))
      host.nativeInput(
        action === "native-delete"
          ? "deleteContentBackward"
          : action === "native-paragraph"
            ? "insertParagraph"
            : "insertLineBreak",
      );
    else if (action === "paste") {
      const event = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(event, "clipboardData", {
        value: { types: ["text/plain"], getData: () => "不应粘贴" },
      });
      act(() => host.editor.dispatchEvent(event));
    } else
      host.press(action === "Shift+Enter" ? "Enter" : action, {
        shiftKey: action === "Shift+Enter",
      });
    expect(host.onTransaction).not.toHaveBeenCalled();
    host.compose("compositionend", "中");
    expect(host.editor.textContent).toBe("A中B");
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
  });

  it("rejects a cross-cell final replacement and remains usable", () => {
    const table = createTable(1, 2);
    for (const cell of table.children[0]!.children)
      cell.children[0]!.children[0]!.text = "AB";
    const host = mountDeletionEditor(createDocument([table]), {
      path: [0, 0, 0, 0, 0],
      offset: 1,
    });
    const spans = host.editor.querySelectorAll("td span");
    window
      .getSelection()!
      .setBaseAndExtent(spans[0]!.firstChild!, 1, spans[1]!.firstChild!, 1);
    host.compose("compositionstart");
    host.compose("compositionend", "拒绝");
    expect(host.onTransaction).not.toHaveBeenCalled();
    expect(host.editor.getAttribute("data-composing")).toBe("false");
    host.setCaret({ path: [0, 0, 0, 0, 0], offset: 1 });
    host.compose("compositionstart");
    host.compose("compositionend", "新");
    expect(host.editor.querySelectorAll("td")[0]!.textContent).toBe("A新B");
    expect(host.editor.querySelectorAll("td")[1]!.textContent).toBe("AB");
  });
});
