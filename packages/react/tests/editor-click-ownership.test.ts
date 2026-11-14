// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it } from "vitest";
import { mountInteractionEditor } from "./editor-interaction-fixture";

describe("editor click ownership", () => {
  it.each(["img", 'input[type="checkbox"]', "td", "p"])(
    "does not process a nested editor's %s",
    (selector) => {
      const host = mountInteractionEditor();
      const inner = host.editor.cloneNode(true) as HTMLElement;
      host.editor.append(inner);
      act(() => inner.querySelector<HTMLElement>(selector)!.click());
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.block).not.toHaveBeenCalled();
      expect(host.cell).not.toHaveBeenCalled();
      expect(host.ref.current!.getDocument()).toEqual(host.value);
    },
  );

  it.each(["button", "input", "textarea", "select", "div"])(
    "does not clear selections for an embedded %s control",
    (tag) => {
      const host = mountInteractionEditor();
      const control = document.createElement(tag);
      control.className = "embedded-control";
      if (tag === "div") control.setAttribute("contenteditable", "false");
      host.target("td").append(control);
      host.click(".embedded-control");
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.block).not.toHaveBeenCalled();
      expect(host.cell).not.toHaveBeenCalled();
      host.click("img");
      expect(host.block).toHaveBeenCalledTimes(1);
    },
  );
});
