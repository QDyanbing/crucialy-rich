import { describe, expect, it } from "vitest";
import {
  createBulletList,
  createDivider,
  createDocument,
  createImage,
  createListItem,
  createOrderedList,
  createParagraph,
  createTable,
  createText,
  getClipboardHtml,
  getClipboardText,
  parseHtml,
  type BlockNode,
  type OrderedListNode,
} from "../../src";

function enclose(block: BlockNode) {
  return createDocument([
    createParagraph([createText("前甲")]),
    block,
    createParagraph([createText("乙后")]),
  ]);
}
const range = {
  anchor: { path: [0, 0], offset: 1 },
  focus: { path: [2, 0], offset: 1 },
};

describe("mixed clipboard structure and safety boundaries", () => {
  it("falls back for a temporary image without dropping it from a partial HTML fragment", () => {
    const document = enclose(createImage("blob:https://example.com/local"));
    expect(getClipboardText(document, range)).toBe("甲\n\n乙");
    expect(getClipboardHtml(document, range)).toBeUndefined();
  });

  it.each([false, true])(
    "does not combine a structural endpoint with top-level text (%s)",
    (backward) => {
      const document = enclose(
        createBulletList([createListItem([createText("列表")])]),
      );
      const anchor = range.anchor;
      const focus = { path: [1, 0, 0], offset: 2 };
      const selection = backward ? { anchor: focus, focus: anchor } : { anchor, focus };
      expect(getClipboardText(document, selection)).toBe("甲\n列表");
      expect(getClipboardHtml(document, selection)).toBeUndefined();
    },
  );

  it("refuses a ragged enclosed table instead of adding unselected cells", () => {
    const table = createTable(2, 2);
    table.children[1]!.children.pop();
    expect(getClipboardHtml(enclose(table), range)).toBeUndefined();
  });

  it.each([1.5, "5", Symbol("start"), 5n])(
    "refuses invalid enclosed ordered starts: %s",
    (start) => {
      const list = {
        ...createOrderedList([createListItem([createText("列表")])]),
        start,
      } as OrderedListNode;
      const document = enclose(list);
      expect(getClipboardText(document, range)).toBe("甲\n列表\n乙");
      expect(getClipboardHtml(document, range)).toBeUndefined();
    },
  );

  it("refuses unsafe source marks while keeping the complete plain range", () => {
    const list = createBulletList([
      createListItem([
        {
          type: "text",
          text: "列表",
          marks: {
            link: { href: "javascript:alert(1)" },
            textColor: "red;position:fixed",
          },
        },
      ]),
    ]);
    const document = enclose(list);
    expect(getClipboardText(document, range)).toBe("甲\n列表\n乙");
    expect(getClipboardHtml(document, range)).toBeUndefined();
  });

  it("escapes literal tags and preserves safe linked code inside enclosed structures", () => {
    const list = createOrderedList(
      [
        createListItem([
          createText('<b>&"', {
            code: true,
            bold: true,
            link: {
              href: "https://example.com/?x=1&y=2",
              target: "_blank",
              rel: "noopener noreferrer",
            },
          }),
        ]),
      ],
      Number.MAX_SAFE_INTEGER,
    );
    const html = getClipboardHtml(enclose(list), range)!;
    expect(html).toContain('<ol start="9007199254740991">');
    expect(html).toContain("<code>&lt;b&gt;&amp;&quot;</code>");
    expect(html).not.toMatch(/<b>|data-|aria-|contenteditable|class=/);
    expect(parseHtml(html)?.blocks[1]).toEqual(list);
  });

  it("keeps empty text boundaries around selected structural separators", () => {
    const document = enclose(createDivider());
    const html = getClipboardHtml(document, {
      anchor: { path: [0, 0], offset: 2 },
      focus: { path: [2, 0], offset: 0 },
    })!;
    expect(parseHtml(html)?.blocks).toEqual([
      createParagraph(),
      createDivider(),
      createParagraph(),
    ]);
  });
});
