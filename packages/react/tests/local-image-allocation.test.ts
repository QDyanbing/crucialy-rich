import { describe, expect, it, vi } from "vitest";
import { createLocalImageResource } from "../src";
const file = { name: "图片.png", type: "image/png" } as File;
describe("local image allocation failure", () => {
  it.each([new Error("allocation failed"), "unavailable", null])(
    "returns undefined when allocation throws",
    (error) => {
      const api = {
        createObjectURL: vi.fn((): string => {
          throw error;
        }),
        revokeObjectURL: vi.fn(),
      };
      expect(createLocalImageResource(file, api)).toBeUndefined();
      expect(api.revokeObjectURL).not.toHaveBeenCalled();
    },
  );
  it("accepts a later successful allocation", () => {
    const api = {
      createObjectURL: vi
        .fn()
        .mockImplementationOnce(() => {
          throw new Error("temporary");
        })
        .mockReturnValue("blob:https://example.com/retry"),
      revokeObjectURL: vi.fn(),
    };
    expect(createLocalImageResource(file, api)).toBeUndefined();
    const resource = createLocalImageResource(file, api)!;
    resource.revoke();
    expect(api.revokeObjectURL).toHaveBeenCalledOnce();
  });
});
