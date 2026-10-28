import { describe, expect, it } from "vitest";
import {
  createDocument,
  createImage,
  createParagraph,
  createText,
  getClipboardHtml,
  getClipboardText,
  parseHtml,
} from "../../src";

const selection = {
  anchor: { path: [0, 0], offset: 1 },
  focus: { path: [2, 0], offset: 1 },
};

describe("clipboard image HTML safety", () => {
  it.each([
    "https://user:password@example.com/a.png",
    "https://example.com@evil.test/a.png",
    "blob:https://example.com/local",
    "data:image/svg+xml,<svg onload=alert(1)>",
    "javascript:alert(1)",
    "/relative.png",
  ])("refuses the whole fragment for unsupported src: %s", (src) => {
    const document = createDocument([
      createParagraph([createText("前甲")]),
      createImage(src),
      createParagraph([createText("乙后")]),
    ]);
    expect(getClipboardText(document, selection)).toBe("甲\n\n乙");
    expect(getClipboardHtml(document, selection)).toBeUndefined();
  });

  it("escapes alt and URL attributes and strips extra host metadata", () => {
    const image = Object.assign(
      createImage('https://example.com/a.png?q="&x=<tag>', {
        alt: '"><script>alert(1)</script>&',
        width: 120,
        height: 80,
      }),
      { onerror: "alert(1)", className: "private", token: "secret" },
    );
    const document = createDocument([createParagraph(), image, createParagraph()]);
    const html = getClipboardHtml(document, {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [2, 0], offset: 0 },
    })!;
    expect(html).toContain("&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;&amp;");
    expect(html).not.toMatch(
      /<script|onerror=|class=|token=|data-|contenteditable|status=/i,
    );
    expect(parseHtml(html)?.blocks[1]).toEqual(
      createImage(new URL(image.src).href, { alt: image.alt, width: 120, height: 80 }),
    );
  });

  it("omits non-integer HTML dimensions without changing valid source metadata", () => {
    const image = createImage("https://example.com/a.png", {
      width: 120.5,
      height: 80,
    });
    const document = createDocument([createParagraph(), image, createParagraph()]);
    const html = getClipboardHtml(document, {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [2, 0], offset: 0 },
    })!;
    expect(html).not.toContain("width=");
    expect(parseHtml(html)?.blocks[1]).toEqual(createImage(image.src, { height: 80 }));
    expect(image.width).toBe(120.5);
  });
});
