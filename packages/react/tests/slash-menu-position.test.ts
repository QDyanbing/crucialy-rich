import { describe, expect, it } from "vitest";

import { calculateSlashMenuPosition } from "../src/slash-menu/position";

const menu = { height: 240, width: 280 };
const viewport = { height: 800, width: 1200 };

describe("calculateSlashMenuPosition", () => {
  it("places the menu below the caret when space is available", () => {
    expect(
      calculateSlashMenuPosition({ bottom: 126, left: 240, top: 108 }, menu, viewport),
    ).toEqual({ left: 240, placement: "below", top: 132 });
  });

  it("places the menu above the caret near the viewport bottom", () => {
    expect(
      calculateSlashMenuPosition({ bottom: 766, left: 240, top: 748 }, menu, viewport),
    ).toEqual({ left: 240, placement: "above", top: 502 });
  });

  it("keeps the menu inside horizontal viewport margins", () => {
    expect(
      calculateSlashMenuPosition({ bottom: 126, left: 1180, top: 108 }, menu, viewport)
        .left,
    ).toBe(912);
  });
});
