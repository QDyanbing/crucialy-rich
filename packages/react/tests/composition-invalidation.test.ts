// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  createImage,
  createBlockSelection,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

const value = () =>
  createDocument([
    createParagraph([createText("AB")]),
    createImage("https://example.com/a.png"),
  ]);
const point = { path: [0, 0], offset: 1 };

describe("composition document ownership", () => {
  it.each(["document", "readonly", "block"])(
    "permanently cancels the session after %s changes",
    (mode) => {
      const notify = vi.fn();
      const host = mountDeletionEditor(value(), point, {
        onCompositionStateChange: notify,
      });
      host.compose("compositionstart");
      host.compose("compositionupdate", "候选");
      if (mode === "document")
        host.rerender({
          value: createDocument([createParagraph([createText("新文档")])]),
        });
      else if (mode === "readonly") {
        host.rerender({ contentEditable: false });
        host.rerender({ contentEditable: true });
      } else host.rerender({ blockSelection: createBlockSelection([1]) });
      expect(host.editor.getAttribute("data-composing")).toBe("false");
      host.compose("compositionend", "不应插入");
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.editor.textContent).toBe(mode === "document" ? "新文档" : "AB");
      expect(notify.mock.calls.map(([state]) => state.active)).toEqual([
        true,
        true,
        false,
      ]);
    },
  );

  it("keeps a session across harmless rerenders with the same document reference", () => {
    const document = value();
    const host = mountDeletionEditor(document, point, { value: document });
    host.compose("compositionstart");
    host.rerender({ value: document, label: "更新标签" });
    expect(host.editor.getAttribute("data-composing")).toBe("true");
    host.compose("compositionend", "中");
    expect(host.onChange.mock.calls[0]![0].children[0].children[0].text).toBe("A中B");
  });

  it("treats a new equivalent document object as a replacement epoch", () => {
    const document = value();
    const host = mountDeletionEditor(document, point, { value: document });
    host.compose("compositionstart");
    host.rerender({ value: structuredClone(document) });
    host.compose("compositionend", "中");
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("invalidates after an explicit ref edit instead of replaying the old composition", () => {
    const host = mountDeletionEditor(value(), point);
    host.compose("compositionstart");
    act(() => {
      host.ref.current!.executeCommand("insertText", { text: "外" });
    });
    expect(host.editor.textContent).toBe("A外B");
    host.compose("compositionend", "旧候选");
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
    expect(host.editor.textContent).toBe("A外B");
    expect(host.editor.getAttribute("data-composing")).toBe("false");
  });
});
