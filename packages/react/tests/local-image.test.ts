import { describe, expect, it, vi } from "vitest";

import { createLocalImageResource } from "../src";

function createFile(name: string, type: string): File {
  return { name, type } as File;
}

describe("createLocalImageResource", () => {
  it("creates and releases a local image resource", () => {
    const urlApi = {
      createObjectURL: vi.fn(() => "blob:https://example.com/local-cover"),
      revokeObjectURL: vi.fn(),
    };
    const file = createFile("封面.png", "image/png");
    const resource = createLocalImageResource(file, urlApi);

    expect(resource?.payload).toEqual({
      alt: "封面.png",
      src: "blob:https://example.com/local-cover",
      status: "ready",
    });
    expect(urlApi.createObjectURL).toHaveBeenCalledWith(file);

    resource?.revoke();
    resource?.revoke();

    expect(urlApi.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(urlApi.revokeObjectURL).toHaveBeenCalledWith(
      "blob:https://example.com/local-cover",
    );
  });

  it("rejects non-image files without creating an object URL", () => {
    const urlApi = {
      createObjectURL: vi.fn(() => "blob:https://example.com/text"),
      revokeObjectURL: vi.fn(),
    };

    expect(
      createLocalImageResource(createFile("说明.txt", "text/plain"), urlApi),
    ).toBeUndefined();
    expect(urlApi.createObjectURL).not.toHaveBeenCalled();
  });

  it("releases an invalid object URL immediately", () => {
    const urlApi = {
      createObjectURL: vi.fn(() => "file:///tmp/cover.png"),
      revokeObjectURL: vi.fn(),
    };

    expect(
      createLocalImageResource(createFile("封面.png", "image/png"), urlApi),
    ).toBeUndefined();
    expect(urlApi.revokeObjectURL).toHaveBeenCalledWith("file:///tmp/cover.png");
  });
});
