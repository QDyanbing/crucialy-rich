// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountToolbar } from "./toolbar-fixture";

const value = () => createDocument([createParagraph([createText("前文后文")])]);
const selection = () => ({
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
});
const next = {
  anchor: { path: [0, 0], offset: 2 },
  focus: { path: [0, 0], offset: 3 },
};

describe("Toolbar pointer document ownership", () => {
  it.each(["different", "equal-content"])(
    "rejects a pending press after a %s document replacement",
    (mode) => {
      const onCommand = vi.fn();
      const host = mountToolbar({
        document: value(),
        selection: selection(),
        onCommand,
      });
      host.press();
      host.rerender({
        document:
          mode === "different"
            ? createDocument([createParagraph([createText("新文档")])])
            : value(),
        selection: next,
      });
      host.click();
      expect(onCommand).not.toHaveBeenCalled();
      host.click();
      expect(onCommand).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ selection: next }),
      );
    },
  );

  it("keeps the original range when only selection changes in the same document", () => {
    const original = selection();
    const onCommand = vi.fn();
    const host = mountToolbar({ document: value(), selection: original, onCommand });
    host.press();
    host.rerender({ selection: next });
    host.click();
    expect(onCommand.mock.calls[0]![0].selection).toEqual(original);
  });

  it("does not let the caller mutate a captured range through its old path arrays", () => {
    const original = selection();
    const before = structuredClone(original);
    const onCommand = vi.fn();
    const host = mountToolbar({ document: value(), selection: original, onCommand });
    host.press();
    original.anchor.path[0] = 99;
    host.rerender({ selection: next });
    host.click();
    expect(onCommand.mock.calls[0]![0].selection).toEqual(before);
  });
});
