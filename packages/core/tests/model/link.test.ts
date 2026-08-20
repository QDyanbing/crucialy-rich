import { describe, expect, it } from "vitest";

import {
  areLinkMarksEqual,
  isValidLinkMark,
  LINK_PROTOCOLS,
  normalizeLinkMark,
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

describe("normalizeLinkMark", () => {
  it("normalizes href, target, and rel together", () => {
    expect(
      normalizeLinkMark({
        href: " HTTPS://Example.COM/docs ",
        rel: "NoReferrer noopener noopener",
        target: " _BLANK ",
        unknown: true,
      }),
    ).toEqual({
      href: "https://example.com/docs",
      rel: "noopener noreferrer",
      target: "_blank",
    });
  });

  it("drops optional invalid values but rejects an unsafe href", () => {
    expect(
      normalizeLinkMark({
        href: "mailto:user@example.com",
        rel: "sponsored",
        target: "popup",
      }),
    ).toEqual({ href: "mailto:user@example.com" });
    expect(normalizeLinkMark({ href: "javascript:alert(1)" })).toBeUndefined();
    expect(normalizeLinkMark(null)).toBeUndefined();
  });

  it("compares canonical link marks", () => {
    expect(
      areLinkMarksEqual(
        {
          href: "HTTPS://EXAMPLE.COM/docs",
          rel: "noreferrer noopener",
          target: "_BLANK",
        },
        {
          href: "https://example.com/docs",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      ),
    ).toBe(true);
    expect(
      areLinkMarksEqual(
        { href: "https://example.com/first" },
        { href: "https://example.com/second" },
      ),
    ).toBe(false);
  });
});

describe("isValidLinkMark", () => {
  it.each([
    { href: "https://example.com" },
    { href: "mailto:user@example.com", target: "_self" },
    {
      href: "https://example.com/docs",
      rel: "noreferrer noopener",
      target: "_blank",
    },
  ])("accepts a safe link mark", (link) => {
    expect(isValidLinkMark(link)).toBe(true);
  });

  it.each([
    null,
    {},
    { href: "javascript:alert(1)" },
    { href: "https://example.com", target: "popup" },
    { href: "https://example.com", rel: "sponsored" },
    { href: "https://example.com", download: true },
  ])("rejects an invalid link mark: %j", (link) => {
    expect(isValidLinkMark(link)).toBe(false);
  });
});
