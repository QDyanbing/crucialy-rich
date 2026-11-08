// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  createDefaultCommandRegistry,
} from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

const value = () => createDocument([createParagraph([createText("AB")])]);
const point = { path: [0, 0], offset: 1 };

describe("composition render lifecycle", () => {
  it("uses the latest state observer without invalidating an unchanged document", () => {
    const document = value(),
      first = vi.fn(),
      next = vi.fn();
    const host = mountDeletionEditor(document, point, {
      value: document,
      onCompositionStateChange: first,
    });
    host.compose("compositionstart");
    host.rerender({ label: "新标签", onCompositionStateChange: next });
    host.compose("compositionupdate", "候选");
    host.compose("compositionend", "确认");
    expect(first).toHaveBeenCalledTimes(1);
    expect(next.mock.calls.map(([state]) => state.active)).toEqual([true, false]);
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
  });

  it.each([true, false])(
    "uses the current final command availability (%s)",
    (allowed) => {
      const registry = createDefaultCommandRegistry();
      const host = mountDeletionEditor(value(), point);
      host.compose("compositionstart");
      registry.register({ ...registry.get("insertText")!, canExecute: () => allowed });
      host.rerender({ commandRegistry: registry });
      host.compose("compositionend", "中");
      expect(host.onTransaction).toHaveBeenCalledTimes(allowed ? 1 : 0);
      expect(host.editor.getAttribute("data-composing")).toBe("false");
    },
  );

  it("does not double-publish or double-commit in StrictMode", () => {
    const notify = vi.fn();
    const host = mountDeletionEditor(
      value(),
      point,
      { onCompositionStateChange: notify },
      true,
    );
    host.compose("compositionstart");
    host.compose("compositionend", "中");
    expect(notify.mock.calls.map(([state]) => state.active)).toEqual([true, false]);
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
  });

  it("keeps the original replacement anchor when only controlled selection changes", () => {
    const document = value();
    const host = mountDeletionEditor(document, point, { value: document });
    host.compose("compositionstart");
    const moved = { path: [0, 0], offset: 2 };
    host.rerender({ selection: { anchor: moved, focus: moved } });
    host.compose("compositionupdate", "候选");
    host.compose("compositionend", "中");
    expect(host.onChange.mock.calls[0]![0].children[0].children[0].text).toBe("A中B");
    expect(host.onTransaction.mock.calls[0]![0].beforeSelection.anchor).toEqual(point);
  });

  it("can start a fresh session after replacing a canceled start callback", () => {
    const host = mountDeletionEditor(value(), point, {
      onCompositionStart: (event) => event.preventDefault(),
    });
    host.compose("compositionstart");
    host.compose("compositionend", "取消");
    host.rerender({ onCompositionStart: () => {} });
    host.compose("compositionstart");
    host.compose("compositionend", "中");
    expect(host.editor.textContent).toBe("A中B");
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
  });

  it("does not carry an unmounted candidate into a new editor", () => {
    const notify = vi.fn();
    const previous = mountDeletionEditor(value(), point, {
      onCompositionStateChange: notify,
    });
    previous.compose("compositionstart");
    previous.unmount();
    previous.compose("compositionend", "旧候选");
    const next = mountDeletionEditor(value(), point);
    expect(next.editor.getAttribute("data-composing")).toBe("false");
    next.compose("compositionend", "未配对");
    expect(previous.onTransaction).not.toHaveBeenCalled();
    expect(next.onTransaction).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledTimes(1);
  });
});
