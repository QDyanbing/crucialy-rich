import { describe, expect, it } from "vitest";
import { createImage } from "../../src";
import { getClipboardImage } from "../../src/clipboard/image";

describe("clipboard image dimensions", () => {
  it("preserves positive safe integer dimensions independently", () => {
    expect(
      getClipboardImage(
        createImage("https://example.com/a.png", { width: 640, height: 480 }),
      ),
    ).toEqual(createImage("https://example.com/a.png", { width: 640, height: 480 }));
    expect(
      getClipboardImage(createImage("https://example.com/a.png", { width: 640 })),
    ).toEqual(createImage("https://example.com/a.png", { width: 640 }));
  });

  it.each([1.5, Number.MAX_SAFE_INTEGER + 1, 1e21])(
    "omits a valid model dimension not safe for HTML integer round trips: %s",
    (width) => {
      const image = createImage("https://example.com/a.png", { width, height: 24 });
      expect(getClipboardImage(image)).toEqual(createImage(image.src, { height: 24 }));
      expect(image.width).toBe(width);
    },
  );

  it.each([0, -1, NaN, Infinity])(
    "refuses invalid source dimensions instead of repairing them: %s",
    (height) => {
      expect(
        getClipboardImage(createImage("https://example.com/a.png", { height })),
      ).toBeUndefined();
    },
  );

  it("does not propagate extra host metadata or share child arrays", () => {
    const image = Object.assign(createImage("https://example.com/a.png"), {
      token: "private",
      onerror: "unsafe",
    });
    const copy = getClipboardImage(image)!;
    expect(copy).not.toHaveProperty("token");
    expect(copy).not.toHaveProperty("onerror");
    expect(copy.children).not.toBe(image.children);
  });
});
