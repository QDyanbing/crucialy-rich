// @vitest-environment jsdom
import {
  createDocument,
  createParagraph,
  createText,
  type RangeSelection,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { mountToolbar } from "./toolbar-fixture";

const value = createDocument([createParagraph([createText("前文后文")])]);
const first = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 1 },
};
const second = {
  anchor: { path: [0, 0], offset: 2 },
  focus: { path: [0, 0], offset: 3 },
};

describe("Toolbar pending selection consumption", () => {
  it("consumes a pointer snapshot before a host callback reenters", () => {
    const seen: Array<RangeSelection | undefined> = [];
    const host = mountToolbar({
      document: value,
      selection: first,
      onCommand(event) {
        seen.push(event.selection);
        if (seen.length === 1) {
          host.button().dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }
      },
    });
    host.press();
    host.rerender({ selection: second });
    host.click();
    expect(seen).toEqual([first, second]);
  });

  it("does not keep a snapshot for the next keyboard or programmatic click", () => {
    const seen: Array<RangeSelection | undefined> = [];
    const host = mountToolbar({
      document: value,
      selection: first,
      onCommand: (event) => seen.push(event.selection),
    });
    host.press();
    host.rerender({ selection: second });
    host.click();
    host.click();
    expect(seen).toEqual([first, second]);
  });
});
