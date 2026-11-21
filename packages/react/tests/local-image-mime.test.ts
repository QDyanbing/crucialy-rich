import { describe, expect, it, vi } from "vitest";
import { createLocalImageResource } from "../src";
describe("local image MIME validation", () => {
  it.each([
    "",
    "image/",
    "image/*",
    "image/png; charset=utf-8",
    " image/png",
    "text/plain",
    "image/png\n",
  ])("rejects invalid file MIME %s without allocating", (type) => {
    const api = {
      createObjectURL: vi.fn(() => "blob:null/image"),
      revokeObjectURL: vi.fn(),
    };
    expect(
      createLocalImageResource({ name: "图片", type } as File, api),
    ).toBeUndefined();
    expect(api.createObjectURL).not.toHaveBeenCalled();
  });
  it.each(["image/png", "image/svg+xml", "image/vnd.microsoft.icon", "IMAGE/JPEG"])(
    "accepts image MIME %s without decoding its contents",
    (type) => {
      expect(
        createLocalImageResource({ name: "图片", type } as File, {
          createObjectURL: () => "blob:null/image",
          revokeObjectURL() {},
        }),
      ).toBeDefined();
    },
  );
});
