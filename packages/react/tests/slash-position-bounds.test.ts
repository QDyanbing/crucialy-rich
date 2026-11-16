import { describe, expect, it } from "vitest";
import { calculateSlashMenuPosition } from "../src";

const menu = { width: 160, height: 120 },
  viewport = { width: 320, height: 240 };
describe("Slash position viewport bounds", () => {
  for (const left of [-1000, 10, 1000]) {
    it.each([-1000, -20, 0, 220, 1000])(
      `keeps a fitted menu inside the viewport at left=${left}, top=%s`,
      (top) => {
        const position = calculateSlashMenuPosition(
          { top, bottom: top + 18, left },
          menu,
          viewport,
        );
        expect(position.left).toBeGreaterThanOrEqual(8);
        expect(position.left + menu.width).toBeLessThanOrEqual(viewport.width - 8);
        expect(position.top).toBeGreaterThanOrEqual(8);
        expect(position.top + menu.height).toBeLessThanOrEqual(viewport.height - 8);
      },
    );
  }
  it("honors custom margins and gaps for visible anchors", () => {
    expect(
      calculateSlashMenuPosition(
        { top: 20, bottom: 38, left: 20 },
        menu,
        viewport,
        12,
        16,
      ),
    ).toEqual({ placement: "below", top: 50, left: 20 });
  });
});
