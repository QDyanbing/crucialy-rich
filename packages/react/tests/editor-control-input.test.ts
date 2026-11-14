// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { mountInteractionEditor } from "./editor-interaction-fixture";

vi.hoisted(() =>
  Object.defineProperty(window, "TextEvent", {
    configurable: true,
    value: window.InputEvent,
  }),
);

describe("embedded control input ownership", () => {
  for (const kind of [
    "input",
    "textarea",
    "select",
    "button",
    "noneditable",
    "nested-editor",
    "task-checkbox",
  ]) {
    it.each(["Backspace", "Enter", "textInput", "beforeinput", "paste", "cut", "copy"])(
      `${kind} does not reuse an editor range for %s`,
      (action) => {
        const observed = vi.fn();
        const host = mountInteractionEditor({
          onKeyDown: observed,
          onBeforeInput: observed,
          onNativeBeforeInput: observed,
          onPaste: observed,
          onCut: observed,
          onCopy: observed,
        });
        const text = host.target('a[data-crucialy-path="[0,0]"]').firstChild!;
        window.getSelection()!.setBaseAndExtent(text, 0, text, 2);
        const control =
          kind === "task-checkbox"
            ? host.target('input[type="checkbox"]')
            : document.createElement(
                kind === "noneditable" || kind === "nested-editor" ? "div" : kind,
              );
        if (kind === "noneditable") control.setAttribute("contenteditable", "false");
        if (kind === "nested-editor") {
          control.setAttribute("data-crucialy-rich-editor", "true");
          control.setAttribute("contenteditable", "true");
        }
        if (kind !== "task-checkbox") host.editor.append(control);
        const getData = vi.fn(() => "不应粘贴"),
          setData = vi.fn(),
          clearData = vi.fn();
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
            value: { getData, setData, clearData, types: ["text/plain"] },
          });
        act(() => control.dispatchEvent(event));
        expect(observed).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(false);
        expect(host.onTransaction).not.toHaveBeenCalled();
        expect(host.onChange).not.toHaveBeenCalled();
        expect(getData).not.toHaveBeenCalled();
        expect(setData).not.toHaveBeenCalled();
        expect(clearData).not.toHaveBeenCalled();
        expect(host.ref.current!.getDocument()).toEqual(host.value);
      },
    );
  }
});
