import { describe, expect, it, vi } from "vitest";
import { createLocalImageResource } from "../src";
const file = { name: "图片.png", type: "image/png" } as File;
describe("local image adapter ownership", () => {
  it("retains the original release function even if allocation replaces it", () => {
    const release = vi.fn(),
      replacement = vi.fn();
    const api = {
      createObjectURL() {
        this.revokeObjectURL = replacement;
        return "blob:null/image";
      },
      revokeObjectURL: release,
    };
    const resource = createLocalImageResource(file, api)!;
    resource.payload.src = "blob:null/changed";
    resource.revoke();
    expect(release).toHaveBeenCalledExactlyOnceWith("blob:null/image");
    expect(replacement).not.toHaveBeenCalled();
  });
  it("preserves method receivers and isolates separate adapters", () => {
    function adapter(id: string) {
      return {
        id,
        released: [] as string[],
        createObjectURL() {
          return `blob:null/${this.id}`;
        },
        revokeObjectURL(url: string) {
          this.released.push(url);
        },
      };
    }
    const first = adapter("first"),
      second = adapter("second");
    const a = createLocalImageResource(file, first)!,
      b = createLocalImageResource(file, second)!;
    b.revoke();
    a.revoke();
    a.revoke();
    expect(first.released).toEqual(["blob:null/first"]);
    expect(second.released).toEqual(["blob:null/second"]);
  });
});
