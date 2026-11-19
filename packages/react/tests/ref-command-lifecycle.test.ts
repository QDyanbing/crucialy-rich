// @vitest-environment jsdom
import {
  BOLD_COMMAND_NAME,
  createCommandFailure,
  createCommandRegistry,
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
} from "@crucialy-rich/core";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

const value = createDocument([createParagraph([createText("生命周期")])]);
const selection = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 2 },
};

describe("ref command lifecycle", () => {
  it("uses the latest registry and callback replacements", () => {
    const host = mountDeletionEditor(value, undefined, { selection });
    const nextChange = vi.fn(),
      nextTransaction = vi.fn(),
      nextSelection = vi.fn();
    const registry = createCommandRegistry([
      {
        name: BOLD_COMMAND_NAME,
        execute: () => createCommandFailure(BOLD_COMMAND_NAME, "blocked"),
      },
    ]);
    host.rerender({
      commandRegistry: registry,
      onChange: nextChange,
      onTransaction: nextTransaction,
      onSelectionChange: nextSelection,
    });
    window.getSelection()!.removeAllRanges();
    act(() =>
      expect(host.ref.current!.executeCommand(BOLD_COMMAND_NAME).ok).toBe(false),
    );
    expect(nextChange).not.toHaveBeenCalled();
    registry.register(createDefaultCommandRegistry().get(BOLD_COMMAND_NAME)!);
    act(() =>
      expect(host.ref.current!.executeCommand(BOLD_COMMAND_NAME).ok).toBe(true),
    );
    expect(nextChange).toHaveBeenCalledTimes(1);
    expect(nextTransaction).toHaveBeenCalledTimes(1);
    expect(nextSelection).toHaveBeenCalledTimes(1);
    expect(host.onChange).not.toHaveBeenCalled();
    expect(host.onTransaction).not.toHaveBeenCalled();
  });
  it("preserves the documented programmatic editing path in readonly mode", () => {
    const host = mountDeletionEditor(value, undefined, {
      selection,
      contentEditable: false,
    });
    window.getSelection()!.removeAllRanges();
    act(() =>
      expect(host.ref.current!.executeCommand(BOLD_COMMAND_NAME).ok).toBe(true),
    );
    expect(host.editor.getAttribute("aria-readonly")).toBe("true");
    expect(host.editor.querySelector("strong")!.textContent).toBe(
      "生命周期".slice(0, 2),
    );
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
  });
  it("invalidates a composition when a programmatic edit replaces its document", () => {
    const states = vi.fn();
    const host = mountDeletionEditor(
      value,
      { path: [0, 0], offset: 1 },
      { selection, onCompositionStateChange: states },
    );
    host.compose("compositionstart");
    expect(states.mock.calls.at(-1)![0].active).toBe(true);
    act(() => host.ref.current!.executeCommand(BOLD_COMMAND_NAME));
    expect(states.mock.calls.at(-1)![0].active).toBe(false);
    host.compose("compositionend", "候选");
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
  });
  it.each([false, true])("publishes one transaction under StrictMode %s", (strict) => {
    const host = mountDeletionEditor(value, undefined, { selection }, strict);
    window.getSelection()!.removeAllRanges();
    act(() => host.ref.current!.executeCommand(BOLD_COMMAND_NAME));
    expect(host.onChange).toHaveBeenCalledTimes(1);
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
    host.unmount();
    expect(host.ref.current).toBeNull();
  });
  it("reads the latest controlled document", () => {
    const host = mountDeletionEditor(value, undefined, { value, selection });
    const next = createDocument([createParagraph([createText("新正文")])]);
    host.rerender({ value: next });
    window.getSelection()!.removeAllRanges();
    expect(host.ref.current!.getDocument()).toBe(next);
    act(() => host.ref.current!.executeCommand(BOLD_COMMAND_NAME));
    expect(host.onTransaction.mock.calls[0]![0].before).toBe(next);
    expect(host.ref.current!.getDocument()).toBe(next);
  });
  it("does not borrow another editor's browser range or callbacks", () => {
    const first = mountDeletionEditor(value, undefined, { selection });
    const second = mountDeletionEditor(
      createDocument([createParagraph([createText("另一个编辑器")])]),
      { path: [0, 0], offset: 4 },
    );
    act(() => first.ref.current!.executeCommand(BOLD_COMMAND_NAME));
    expect(first.editor.querySelector("strong")!.textContent).toBe(
      "生命周期".slice(0, 2),
    );
    expect(second.editor.querySelector("strong")).toBeNull();
    expect(second.onChange).not.toHaveBeenCalled();
  });
});
