// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { mountInteractionEditor } from "./editor-interaction-fixture";

describe("editor click target model paths", () => {
  for (const selector of ["img", "td"]) {
    it.each([
      "bad",
      "[99]",
      "[0,0]",
      "[1,0]",
      "[3]",
      "[3,0]",
      "[3,0,0,0]",
      "[3,0,0.5]",
    ])(`does not notify selection for ${selector} path %s`, (path) => {
      const host = mountInteractionEditor();
      host.target(selector).setAttribute("data-crucialy-path", path);
      host.click(selector);
      expect(host.block).not.toHaveBeenCalled();
      expect(host.cell).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
    });
  }

  it("selects an image and clears the previous cell without editing", () => {
    const host = mountInteractionEditor({
      cellSelection: { type: "cell", path: [3, 0, 0] },
    });
    host.click("img");
    expect(host.block).toHaveBeenCalledExactlyOnceWith({ type: "block", path: [2] });
    expect(host.cell).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(host.onTransaction).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(host.editor);
  });

  it("selects a cell through its text and clears the previous image", () => {
    const host = mountInteractionEditor({
      blockSelection: { type: "block", path: [2] },
    });
    host.click('td [data-crucialy-path="[3,0,0,0,0]"]');
    expect(host.cell).toHaveBeenCalledExactlyOnceWith({
      path: [3, 0, 0],
      type: "cell",
    });
    expect(host.block).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(host.onTransaction).not.toHaveBeenCalled();
  });
});
