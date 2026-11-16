import { describe, expect, it } from "vitest";
import { calculateFloatingToolbarPosition } from "../src";

const toolbar = { width: 160, height: 40 },
  viewport = { width: 320, height: 240 };
describe("floating Toolbar viewport bounds", () => {
  for (const left of [-1000, 10, 1000]) {
    it.each([-1000, -20, 0, 220, 1000])(
      `keeps a fitted toolbar inside the viewport at left=${left}, top=%s`,
      (top) => {
        const position = calculateFloatingToolbarPosition(
          { top, bottom: top + 18, left, width: 20, height: 18 },
          toolbar,
          viewport,
        );
        expect(position.left).toBeGreaterThanOrEqual(8);
        expect(position.left + toolbar.width).toBeLessThanOrEqual(viewport.width - 8);
        expect(position.top).toBeGreaterThanOrEqual(8);
        expect(position.top + toolbar.height).toBeLessThanOrEqual(viewport.height - 8);
      },
    );
  }
  it("honors custom margins and gaps without changing centering", () => {
    expect(
      calculateFloatingToolbarPosition(
        { top: 20, bottom: 38, left: 100, width: 20, height: 18 },
        toolbar,
        viewport,
        12,
        16,
      ),
    ).toEqual({ left: 30, top: 50 });
  });
});
