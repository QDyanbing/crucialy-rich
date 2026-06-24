import { describe, expect, it } from "vitest";

import {
  createModelPathAttributes,
  decodeModelPath,
  encodeModelPath,
  MODEL_PATH_ATTRIBUTE,
} from "../../src/render";

describe("render path attributes", () => {
  it("encodes model paths as json strings", () => {
    expect(encodeModelPath([])).toBe("[]");
    expect(encodeModelPath([1, 2])).toBe("[1,2]");
  });

  it("decodes valid model paths", () => {
    expect(decodeModelPath("[]")).toEqual([]);
    expect(decodeModelPath("[0,1]")).toEqual([0, 1]);
  });

  it("rejects invalid model path payloads", () => {
    expect(decodeModelPath("{}")).toBeUndefined();
    expect(decodeModelPath("[0,-1]")).toBeUndefined();
    expect(decodeModelPath("[0.5]")).toBeUndefined();
    expect(decodeModelPath("not json")).toBeUndefined();
  });

  it("creates dom attributes for a model path", () => {
    expect(createModelPathAttributes([0, 1])).toEqual({
      [MODEL_PATH_ATTRIBUTE]: "[0,1]",
    });
  });
});
