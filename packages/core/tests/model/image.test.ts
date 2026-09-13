import { describe, expect, it } from "vitest";

import {
  IMAGE_PROTOCOLS,
  normalizeImageDimension,
  sanitizeImageSrc,
} from "../../src/model";

describe("image model helpers", () => {
  it("accepts remote and local object URLs", () => {
    expect(IMAGE_PROTOCOLS).toEqual(["http:", "https:", "blob:"]);
    expect(sanitizeImageSrc(" HTTPS://Example.COM/cover.png ")).toBe(
      "https://example.com/cover.png",
    );
    expect(sanitizeImageSrc("blob:https://example.com/local-id")).toBe(
      "blob:https://example.com/local-id",
    );
  });

  it.each([
    "javascript:alert(1)",
    "data:image/png;base64,abc",
    "file:///tmp/image.png",
    "/relative.png",
    "",
    "not a url",
  ])("rejects the unsafe image source %s", (src) => {
    expect(sanitizeImageSrc(src)).toBeUndefined();
  });

  it("normalizes positive finite dimensions", () => {
    expect(normalizeImageDimension(640)).toBe(640);
    expect(normalizeImageDimension(320.5)).toBe(320.5);
    expect(normalizeImageDimension(null)).toBeNull();
    expect(normalizeImageDimension(0)).toBeNull();
    expect(normalizeImageDimension(-1)).toBeNull();
    expect(normalizeImageDimension(Number.POSITIVE_INFINITY)).toBeNull();
    expect(normalizeImageDimension("640")).toBeNull();
  });
});
