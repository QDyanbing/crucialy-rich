// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

const value = () => createDocument([createParagraph([createText("AB")])]);
const point = { path: [0, 0], offset: 1 };

describe("composition host cancellation", () => {
  it("does not start or later commit a host-canceled session", () => {
    const notify = vi.fn();
    const host = mountDeletionEditor(value(), point, {
      onCompositionStart: (event) => event.preventDefault(),
      onCompositionStateChange: notify,
    });
    host.compose("compositionstart");
    host.compose("compositionend", "不应插入");
    expect(host.onTransaction).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
    expect(host.editor.getAttribute("data-composing")).toBe("false");
  });

  it("skips a canceled candidate notification but allows an uncanceled final commit", () => {
    const notify = vi.fn();
    const host = mountDeletionEditor(value(), point, {
      onCompositionUpdate: (event) => event.preventDefault(),
      onCompositionStateChange: notify,
    });
    host.compose("compositionstart");
    host.compose("compositionupdate", "候选");
    expect(notify).toHaveBeenCalledTimes(1);
    host.compose("compositionend", "确认");
    expect(host.editor.textContent).toBe("A确认B");
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
  });

  it.each(["react", "dom"])(
    "cancels final model insertion and releases the active state (%s)",
    (route) => {
      const host = mountDeletionEditor(
        value(),
        point,
        route === "react"
          ? { onCompositionEnd: (event) => event.preventDefault() }
          : {},
      );
      if (route === "dom")
        host.editor.addEventListener("compositionend", (event) =>
          event.preventDefault(),
        );
      host.compose("compositionstart");
      host.compose("compositionupdate", "中");
      host.compose("compositionend", "中文");
      expect(host.editor.textContent).toBe("AB");
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.editor.getAttribute("data-composing")).toBe("false");
      host.press("Delete");
      expect(host.editor.textContent).toBe("A");
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
    },
  );

  it("emits idle only once and ignores later duplicate or unpaired ends", () => {
    const notify = vi.fn();
    const host = mountDeletionEditor(value(), point, {
      onCompositionStateChange: notify,
    });
    host.compose("compositionend", "无会话");
    expect(notify).not.toHaveBeenCalled();
    host.compose("compositionstart");
    host.compose("compositionend", "");
    host.compose("compositionend", "重复");
    expect(notify.mock.calls.map(([state]) => state.active)).toEqual([true, false]);
    expect(host.onTransaction).not.toHaveBeenCalled();
  });
});
