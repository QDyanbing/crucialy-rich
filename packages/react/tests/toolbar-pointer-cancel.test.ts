// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { mountToolbar } from "./toolbar-fixture";

const value = createDocument([createParagraph([createText("前文后文")])]);
const original = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};
const current = {
  anchor: { path: [0, 0], offset: 2 },
  focus: { path: [0, 0], offset: 3 },
};

describe("Toolbar pointer cancellation", () => {
  it("drops an aborted range before a later non-pointer activation", () => {
    const onCommand = vi.fn();
    const host = mountToolbar({ document: value, selection: original, onCommand });
    host.press();
    host.cancel();
    host.rerender({ selection: current });
    expect(onCommand).not.toHaveBeenCalled();
    host.click();
    expect(onCommand.mock.calls[0]![0].selection).toEqual(current);
  });

  it("accepts a fresh pointer gesture after repeated cancellations", () => {
    const onCommand = vi.fn();
    const host = mountToolbar({ document: value, selection: original, onCommand });
    host.press();
    host.cancel();
    host.cancel();
    host.rerender({ selection: current });
    host.press();
    host.click();
    expect(onCommand).toHaveBeenCalledTimes(1);
    expect(onCommand.mock.calls[0]![0].selection).toEqual(current);
  });
});
