import { describe, expect, it } from "vitest";
import {
  createImage,
  createParagraph,
  createText,
  DEFAULT_CLIPBOARD_PARSERS,
  parseClipboardData,
  parseMarkdown,
} from "../../src";

const image = createImage("https://example.com/md.png", { alt: "配图" });
const source = "![配图](https://example.com/md.png)";

describe("Markdown paragraph image import", () => {
  it("preserves mixed image order and surrounding emphasis", () => {
    expect(parseMarkdown(`**前${source}后**`)?.blocks).toEqual([
      createParagraph([createText("前", { bold: true })]),
      image,
      createParagraph([createText("后", { bold: true })]),
    ]);
  });

  it("imports consecutive and standalone images without synthetic empty paragraphs", () => {
    expect(parseMarkdown(`${source}${source}`)?.blocks).toEqual([image, image]);
    expect(parseMarkdown(source)?.blocks).toEqual([image]);
  });

  it("supports reference image syntax and ignores unsupported title metadata", () => {
    expect(
      parseMarkdown('前![配图][cover]后\n\n[cover]: https://example.com/md.png "title"')
        ?.blocks,
    ).toEqual([
      createParagraph([createText("前")]),
      image,
      createParagraph([createText("后")]),
    ]);
  });

  it("keeps literal image syntax inside inline and fenced code", () => {
    expect(parseMarkdown(`\`${source}\``)?.blocks).toEqual([
      createParagraph([createText(source, { code: true })]),
    ]);
    expect(parseMarkdown(`\`\`\`\n${source}\n\`\`\``)?.blocks).toEqual([
      { type: "codeBlock", children: [createText(`${source}\n`)] },
    ]);
  });

  it.each(["data:image/png;base64,abc", "/relative.png", "javascript:alert(1)"])(
    "does not promote unsafe Markdown image %s",
    (src) => {
      const fragment = parseMarkdown(`前![配图](${src})后`);
      expect(fragment?.blocks).toEqual([
        createParagraph([createText("前"), createText("后")]),
      ]);
    },
  );

  it("keeps Markdown priority while allowing target-aware plain fallback", () => {
    const formats: Record<string, string> = {
      "text/markdown": `前${source}后`,
      "text/html": "<p>HTML</p>",
      "text/plain": "原始纯文本",
    };
    const clipboard = {
      types: Object.keys(formats),
      getData: (type: string) => formats[type] ?? "",
    };
    const rich = parseClipboardData(clipboard, DEFAULT_CLIPBOARD_PARSERS);
    expect(rich?.mimeType).toBe("text/markdown");
    expect(rich?.blocks[1]).toEqual(image);
    expect(
      parseClipboardData(
        clipboard,
        DEFAULT_CLIPBOARD_PARSERS,
        (fragment) => fragment.mimeType === "text/plain",
      ),
    ).toEqual({
      mimeType: "text/plain",
      blocks: [createParagraph([createText("原始纯文本")])],
    });
  });
});
