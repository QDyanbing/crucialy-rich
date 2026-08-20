import { describe, expect, it } from "vitest";

import {
  LINK_PROTOCOLS,
  normalizeLinkRel,
  normalizeLinkTarget,
  sanitizeLinkHref,
} from "../../src/model";

describe("sanitizeLinkHref", () => {
  it.each([
    ["https://example.com/docs", "https://example.com/docs"],
    [" HTTP://Example.COM/path?q=1#part ", "http://example.com/path?q=1#part"],
    ["mailto:user@example.com", "mailto:user@example.com"],
  ])("normalizes %s", (input, expected) => {
    expect(sanitizeLinkHref(input)).toBe(expected);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "ftp://example.com/file",
    "/relative/path",
    "example.com",
    "mailto:",
    "https://",
    "https://example.com/\nunsafe",
    "",
    123,
    null,
  ])("rejects unsafe href %s", (input) => {
    expect(sanitizeLinkHref(input)).toBeUndefined();
  });

  it("exposes the supported protocols", () => {
    expect(LINK_PROTOCOLS).toEqual(["http:", "https:", "mailto:"]);
  });
});

describe("normalizeLinkTarget", () => {
  it.each([
    ["_self", "_self"],
    ["_blank", "_blank"],
    ["  _BLANK  ", "_blank"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeLinkTarget(input)).toBe(expected);
  });

  it.each(["_parent", "_top", "blank", "", 123, null])(
    "rejects unsupported target %s",
    (input) => {
      expect(normalizeLinkTarget(input)).toBeUndefined();
    },
  );
});

describe("normalizeLinkRel", () => {
  it.each([
    ["noopener", "noopener"],
    ["noreferrer   noopener", "noopener noreferrer"],
    ["NoReferrer NOOPENER nofollow noopener", "nofollow noopener noreferrer"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeLinkRel(input)).toBe(expected);
  });

  it.each(["", "ugc", "noopener sponsored", 123, null])(
    "rejects unsupported rel %s",
    (input) => {
      expect(normalizeLinkRel(input)).toBeUndefined();
    },
  );
});
