// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  createImage,
  createBlockSelection,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

const value = () => createDocument([createParagraph([createText("ABC")])]);
const point = { path: [0, 0], offset: 1 };

describe("composition start ownership", () => {
  it.each(["input", "textarea", "button", "void"])(
    "does not compose into editor text from an embedded %s",
    (kind) => {
      const host = mountDeletionEditor(value(), point);
      const child = document.createElement(kind === "void" ? "div" : kind);
      if (kind === "void") child.setAttribute("contenteditable", "false");
      host.editor.append(child);
      act(() => {
        child.dispatchEvent(
          new CompositionEvent("compositionstart", { bubbles: true }),
        );
        child.dispatchEvent(
          new CompositionEvent("compositionend", { bubbles: true, data: "不应插入" }),
        );
      });
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.editor.getAttribute("data-composing")).toBe("false");
      expect(host.editor.querySelector("p")!.textContent).toBe("ABC");
    },
  );

  it("does not borrow another instance's range", () => {
    const first = mountDeletionEditor(value(), point);
    const second = mountDeletionEditor(value(), point);
    first.compose("compositionstart");
    first.compose("compositionend", "外部");
    expect(first.onTransaction).not.toHaveBeenCalled();
    second.compose("compositionstart");
    second.compose("compositionend", "中");
    expect(second.editor.textContent).toBe("A中BC");
  });

  it("does not use stale text when an image is selected", () => {
    const host = mountDeletionEditor(
      createDocument([
        createParagraph([createText("ABC")]),
        createImage("https://example.com/a.png"),
      ]),
      point,
      { blockSelection: createBlockSelection([1]) },
    );
    host.compose("compositionstart");
    expect(host.editor.getAttribute("data-composing")).toBe("true");
    host.press("Delete");
    expect(host.editor.querySelector("img")).not.toBeNull();
    host.compose("compositionend", "不应插入");
    expect(host.onTransaction).not.toHaveBeenCalled();
    expect(host.editor.querySelector("img")).not.toBeNull();
    expect(host.editor.getAttribute("data-composing")).toBe("false");
  });

  it("cancels an older session if a new start is rejected", () => {
    const host = mountDeletionEditor(value(), point);
    host.compose("compositionstart");
    host.rerender({ onCompositionStart: (event) => event.preventDefault() });
    host.compose("compositionstart");
    host.compose("compositionend", "旧起点");
    expect(host.onTransaction).not.toHaveBeenCalled();
    expect(host.editor.getAttribute("data-composing")).toBe("false");
  });

  it("uses a valid new start as the new composition anchor", () => {
    const host = mountDeletionEditor(value(), point);
    host.compose("compositionstart");
    host.setCaret({ path: [0, 0], offset: 2 });
    host.compose("compositionstart");
    host.compose("compositionend", "中");
    expect(host.editor.textContent).toBe("AB中C");
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
  });
});
