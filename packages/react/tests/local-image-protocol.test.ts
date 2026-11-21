import { describe, expect, it, vi } from "vitest";
import { createLocalImageResource } from "../src";
const file = { name: "图片.png", type: "image/png" } as File;
describe("local image resource protocols", () => {
  it.each([
    "https://example.com/image.png",
    "http://example.com/image.png",
    "blob:",
    "",
    "javascript:alert(1)",
  ])("rejects %s and releases the raw allocation", (url) => {
    const api = { createObjectURL: () => url, revokeObjectURL: vi.fn() };
    expect(createLocalImageResource(file, api)).toBeUndefined();
    expect(api.revokeObjectURL).toHaveBeenCalledExactlyOnceWith(url);
  });
  it.each(["blob:null/opaque-id", "blob:https://example.com/opaque-id"])(
    "keeps opaque blob URL %s",
    (url) => {
      const api = { createObjectURL: () => url, revokeObjectURL: vi.fn() };
      expect(createLocalImageResource(file, api)?.payload.src).toBe(url);
    },
  );
});
