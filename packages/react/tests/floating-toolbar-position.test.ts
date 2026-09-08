import { describe, expect, it } from "vitest";

import { calculateFloatingToolbarPosition } from "../src";

const toolbar = { height: 40, width: 200 };
const viewport = { height: 600, width: 800 };

describe("calculateFloatingToolbarPosition", () => {
  it("centers the toolbar above the selection", () => {
    expect(
      calculateFloatingToolbarPosition(
        { bottom: 240, height: 20, left: 300, top: 220, width: 100 },
        toolbar,
        viewport,
      ),
    ).toEqual({ left: 250, top: 172 });
  });

  it("moves below a selection near the viewport top", () => {
    expect(
      calculateFloatingToolbarPosition(
        { bottom: 28, height: 20, left: 300, top: 8, width: 100 },
        toolbar,
        viewport,
      ),
    ).toEqual({ left: 250, top: 36 });
  });

  it("keeps the toolbar inside horizontal viewport margins", () => {
    expect(
      calculateFloatingToolbarPosition(
        { bottom: 240, height: 20, left: 2, top: 220, width: 20 },
        toolbar,
        viewport,
      ).left,
    ).toBe(8);
    expect(
      calculateFloatingToolbarPosition(
        { bottom: 240, height: 20, left: 790, top: 220, width: 20 },
        toolbar,
        viewport,
      ).left,
    ).toBe(592);
  });
});
