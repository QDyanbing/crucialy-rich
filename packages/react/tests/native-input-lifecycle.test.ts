// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  createDefaultCommandRegistry,
} from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

const value = () => createDocument([createParagraph([createText("ABC")])]);
const point = { path: [0, 0], offset: 1 };

describe("native beforeinput listener lifecycle", () => {
  it("uses the current uncontrolled document after consecutive renders", () => {
    const host = mountDeletionEditor(value(), point);
    host.nativeInput("deleteContentBackward");
    expect(host.editor.textContent).toBe("BC");
    host.setCaret(point);
    host.nativeInput("deleteContentBackward");
    expect(host.editor.textContent).toBe("C");
    expect(host.onTransaction).toHaveBeenCalledTimes(2);
  });

  it("replaces host callbacks without retaining duplicate listeners", () => {
    const first = vi.fn(),
      next = vi.fn();
    const host = mountDeletionEditor(value(), point, { onNativeBeforeInput: first });
    host.rerender({ onNativeBeforeInput: next });
    host.nativeInput("deleteContentForward");
    expect(first).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
  });

  it("uses the latest editable mode and controlled value", () => {
    const host = mountDeletionEditor(value(), point, { contentEditable: false });
    host.nativeInput("deleteContentBackward");
    expect(host.onTransaction).not.toHaveBeenCalled();
    host.rerender({
      contentEditable: true,
      value: createDocument([createParagraph([createText("新值")])]),
    });
    host.setCaret(point);
    host.nativeInput("deleteContentBackward");
    expect(host.onChange.mock.calls[0]![0].children[0].children[0].text).toBe("值");
  });

  it("removes the native listener on unmount", () => {
    const callback = vi.fn();
    const host = mountDeletionEditor(value(), point, { onNativeBeforeInput: callback });
    host.unmount();
    host.nativeInput("deleteContentBackward");
    expect(callback).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("survives StrictMode setup cleanup without double submission", () => {
    const callback = vi.fn();
    const host = mountDeletionEditor(
      value(),
      point,
      { onNativeBeforeInput: callback },
      true,
    );
    host.nativeInput("deleteContentForward");
    expect(callback).toHaveBeenCalledTimes(1);
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
    expect(host.editor.textContent).toBe("AC");
  });

  it("does not borrow the DOM selection from another editor", () => {
    const first = mountDeletionEditor(value(), point);
    const second = mountDeletionEditor(value(), point);
    expect(first.nativeInput("deleteContentBackward").defaultPrevented).toBe(true);
    expect(first.onTransaction).not.toHaveBeenCalled();
    second.nativeInput("deleteContentBackward");
    expect(second.editor.textContent).toBe("BC");
    expect(first.editor.textContent).toBe("ABC");
  });

  it("uses the replacement Registry rather than a stale command closure", () => {
    const host = mountDeletionEditor(value(), point);
    const registry = createDefaultCommandRegistry();
    registry.register({
      ...registry.get("deleteSelection")!,
      canExecute() {
        throw new Error("Updated policy.");
      },
    });
    host.rerender({ commandRegistry: registry });
    host.nativeInput("deleteContentForward");
    expect(host.onTransaction).not.toHaveBeenCalled();
    expect(host.editor.textContent).toBe("ABC");
  });
});
