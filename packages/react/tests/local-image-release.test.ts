import { describe, expect, it, vi } from "vitest";
import { createLocalImageResource, type LocalImageResource } from "../src";
const file = { name: "图片.png", type: "image/png" } as File;
describe("local image cleanup failures", () => {
  it("attempts a throwing release once without interrupting other cleanup", () => {
    const release = vi.fn(() => {
      throw new Error("release failed");
    });
    const first = createLocalImageResource(file, {
      createObjectURL: () => "blob:null/first",
      revokeObjectURL: release,
    })!;
    const next = vi.fn();
    const second = createLocalImageResource(file, {
      createObjectURL: () => "blob:null/second",
      revokeObjectURL: next,
    })!;
    expect(() =>
      [first, second, first].forEach((resource) => resource.revoke()),
    ).not.toThrow();
    expect(release).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
  });
  it("contains failures while cleaning rejected allocations", () => {
    expect(
      createLocalImageResource(file, {
        createObjectURL: () => "file:///invalid",
        revokeObjectURL: () => {
          throw new Error("cleanup");
        },
      }),
    ).toBeUndefined();
  });
  it("does not recursively release when the adapter reenters cleanup", () => {
    const holder: { resource?: LocalImageResource } = {};
    const release = vi.fn(() => holder.resource?.revoke());
    const resource = createLocalImageResource(file, {
      createObjectURL: () => "blob:null/reentry",
      revokeObjectURL: release,
    })!;
    holder.resource = resource;
    resource.revoke();
    expect(release).toHaveBeenCalledOnce();
  });
});
