// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { createLocalImageResource } from "../src";
describe("native File resource metadata", () => {
  it.each([
    ["照片.png", "image/png"],
    ["图标.svg", "image/svg+xml"],
    ["portrait.jpg", "IMAGE/JPEG"],
  ])("preserves %s metadata without reading bytes", (name, type) => {
    const file = new File([], name, { type });
    const api = {
      createObjectURL: vi.fn(() => "blob:null/native"),
      revokeObjectURL: vi.fn(),
    };
    const resource = createLocalImageResource(file, api)!;
    expect(resource.payload).toEqual({
      alt: name,
      src: "blob:null/native",
      status: "ready",
    });
    expect(api.createObjectURL).toHaveBeenCalledExactlyOnceWith(file);
    resource.payload.src = "https://example.com/changed";
    resource.revoke();
    resource.revoke();
    expect(api.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:null/native");
  });
  it("returns undefined when jsdom has no object URL support", () => {
    expect(
      createLocalImageResource(new File([], "image.png", { type: "image/png" })),
    ).toBeUndefined();
  });
});
