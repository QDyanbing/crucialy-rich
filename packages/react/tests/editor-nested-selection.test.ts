// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { interactionPoint, mountInteractionEditor } from "./editor-interaction-fixture";

vi.hoisted(() =>
  Object.defineProperty(window, "TextEvent", {
    configurable: true,
    value: window.InputEvent,
  }),
);

describe("nested DOM range ownership", () => {
  it.each([
    "Backspace",
    "Enter",
    "textInput",
    "beforeinput",
    "paste",
    "cut",
    "copy",
    "composition",
  ])("does not borrow a nested range for an outer %s event", (action) => {
    const host = mountInteractionEditor();
    const inner = host.editor.cloneNode(true) as HTMLElement;
    host.editor.append(inner);
    const text = inner.querySelector("a")!.firstChild!;
    window.getSelection()!.setBaseAndExtent(text, 0, text, 2);
    const read = vi.fn(() => "不应读取"),
      write = vi.fn();
    if (action === "composition") {
      host.compose("compositionstart");
      host.compose("compositionend", "不应提交");
    } else {
      const event =
        action === "Backspace" || action === "Enter"
          ? new KeyboardEvent("keydown", {
              key: action,
              bubbles: true,
              cancelable: true,
            })
          : action === "textInput" || action === "beforeinput"
            ? new InputEvent(action, {
                data: "新",
                inputType:
                  action === "beforeinput" ? "deleteContentBackward" : "insertText",
                bubbles: true,
                cancelable: true,
              })
            : new Event(action, { bubbles: true, cancelable: true });
      if (["paste", "cut", "copy"].includes(action))
        Object.defineProperty(event, "clipboardData", {
          value: {
            types: ["text/plain"],
            getData: read,
            setData: write,
            clearData: write,
          },
        });
      act(() => host.editor.dispatchEvent(event));
    }
    expect(host.onTransaction).not.toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
    expect(host.ref.current!.getDocument()).toEqual(host.value);
    host.setCaret(interactionPoint);
    host.press("Backspace");
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
  });
});
