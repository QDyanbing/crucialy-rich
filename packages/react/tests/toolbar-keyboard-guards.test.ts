// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountToolbar } from "./toolbar-fixture";

const value = createDocument([createParagraph([createText("正文")])]);
const selection = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};

describe("Toolbar keyboard intent guards", () => {
  for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"]) {
    it.each(["ArrowLeft", "ArrowRight", "Home", "End"])(
      `leaves ${modifier}+%s to its owner`,
      (key) => {
        const onCommand = vi.fn();
        const host = mountToolbar({ document: value, selection, onCommand });
        host.focus();
        expect(host.key(0, key, { [modifier]: true }).defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(host.button());
        expect(onCommand).not.toHaveBeenCalled();
      },
    );
  }

  for (const ime of [{ isComposing: true }, { keyCode: 229 }]) {
    it.each(["ArrowLeft", "ArrowRight", "Home", "End"])(
      `does not claim IME %s (${JSON.stringify(ime)})`,
      (key) => {
        const host = mountToolbar({ document: value, selection });
        host.focus();
        expect(host.key(0, key, ime).defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(host.button());
      },
    );
  }

  it.each(["ArrowLeft", "ArrowRight", "Home", "End"])(
    "honors a host-canceled %s and permits a later navigation",
    (key) => {
      const host = mountToolbar({ document: value, selection });
      host.focus();
      host
        .button()
        .addEventListener("keydown", (event) => event.preventDefault(), { once: true });
      expect(host.key(0, key).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(host.button());
      host.key(0, "ArrowRight");
      expect(document.activeElement).toBe(host.button(1));
    },
  );
});
