import { describe, expect, it } from "vitest";
import { createImage } from "../../src";
import { getClipboardImage } from "../../src/clipboard/image";

describe("clipboard image references", () => {
  it.each(["http://example.com/image.png", "  https://EXAMPLE.com/image.png  "])(
    "copies a ready web reference without sharing source objects: %s",
    (src) => {
      const image = createImage(src, { alt: "中文图片" });
      const copy = getClipboardImage(image)!;
      expect(copy).toEqual(createImage(new URL(src.trim()).href, { alt: "中文图片" }));
      expect(copy).not.toBe(image);
      copy.alt = "修改";
      expect(image.alt).toBe("中文图片");
    },
  );
  it.each(["loading", "error"] as const)("refuses %s images", (status) => {
    expect(
      getClipboardImage(createImage("https://example.com/image.png", { status })),
    ).toBeUndefined();
  });
  it.each([
    "blob:https://example.com/local",
    "data:image/png;base64,a",
    "javascript:alert(1)",
    "/image.png",
    "https://user:password@example.com/image.png",
    "https://user@example.com/image.png",
  ])("refuses temporary, unsafe or credentialed references: %s", (src) => {
    expect(getClipboardImage(createImage(src))).toBeUndefined();
  });
});
