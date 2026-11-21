import { describe, expect, it, vi } from "vitest";
import { createLocalImageResource, type ObjectUrlApi } from "../src";
const file = { name: "图片.png", type: "image/png" } as File;
describe("local image URL capabilities", () => {
  it.each([{}, { createObjectURL: "missing" }, { revokeObjectURL: () => {} }])(
    "rejects incomplete adapters",
    (api) => {
      expect(
        createLocalImageResource(file, api as unknown as ObjectUrlApi),
      ).toBeUndefined();
    },
  );
  it("does not allocate when release is unavailable", () => {
    const createObjectURL = vi.fn(() => "blob:https://example.com/a");
    expect(
      createLocalImageResource(file, { createObjectURL } as unknown as ObjectUrlApi),
    ).toBeUndefined();
    expect(createObjectURL).not.toHaveBeenCalled();
  });
  it("supports a runtime without the global URL API", () => {
    vi.stubGlobal("URL", undefined);
    try {
      expect(createLocalImageResource(file)).toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
