// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

function value() {
  return createDocument([createParagraph([createText("A\u{1f469}\u200d\u{1f4bb}B")])]);
}

describe.each(["Backspace", "Delete"])("%s grapheme input guards", (key) => {
  it.each(["readonly", "host", "composition", "native-composition"])(
    "respects %s without a transaction",
    (mode) => {
      const document = value();
      const host = mountDeletionEditor(
        document,
        { path: [0, 0], offset: key === "Backspace" ? 6 : 1 },
        {
          ...(mode === "readonly" ? { contentEditable: false } : {}),
          ...(mode === "host" ? { onKeyDown: (event) => event.preventDefault() } : {}),
        },
      );
      if (mode === "composition")
        act(() =>
          host.editor.dispatchEvent(
            new CompositionEvent("compositionstart", { bubbles: true }),
          ),
        );
      host.press(key, { isComposing: mode === "native-composition" });
      expect(host.onChange).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.ref.current!.getDocument()).toEqual(document);
      expect(host.editor.textContent).toBe("A\u{1f469}\u200d\u{1f4bb}B");
    },
  );

  it("waits for the host to accept a controlled change", () => {
    const document = value();
    const host = mountDeletionEditor(
      document,
      { path: [0, 0], offset: key === "Backspace" ? 6 : 1 },
      { value: document },
    );
    host.press(key);
    expect(host.onChange).toHaveBeenCalledWith(
      createDocument([createParagraph([createText("AB")])]),
    );
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
    expect(host.ref.current!.getDocument()).toBe(document);
    expect(host.editor.textContent).toBe("A\u{1f469}\u200d\u{1f4bb}B");
  });
});

it("does not borrow another editor's DOM caret", () => {
  const first = mountDeletionEditor(value(), { path: [0, 0], offset: 1 });
  const second = mountDeletionEditor(value(), { path: [0, 0], offset: 1 });
  first.press("Delete");
  expect(first.onTransaction).not.toHaveBeenCalled();
  expect(first.editor.textContent).toBe("A\u{1f469}\u200d\u{1f4bb}B");
  second.press("Delete");
  expect(second.editor.textContent).toBe("AB");
  expect(second.onTransaction).toHaveBeenCalledTimes(1);
  expect(first.onTransaction).not.toHaveBeenCalled();
});
