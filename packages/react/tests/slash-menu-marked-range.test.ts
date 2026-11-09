import {
  applyTransaction,
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
  getBlockTextOffset,
  SET_HEADING_COMMAND_NAME,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { executeSlashCommand, findSlashMenuTrigger } from "../src";

const item = {
  id: "heading",
  label: "二级标题",
  commandName: SET_HEADING_COMMAND_NAME,
  payload: { level: 2 },
};

describe("valid Slash cleanup across text leaves", () => {
  it.each(["", "h2", "标题", "\u{1f600}", "e\u0301"])(
    "preserves surrounding marks with UTF-16 query %s",
    (query) => {
      const document = createDocument([
        createParagraph([
          createText("前\u{1f600} ", { bold: true }),
          createText("/", { underline: true }),
          createText(query, { italic: true }),
          createText("后文", { strike: true }),
        ]),
      ]);
      const point = query
        ? { path: [0, 2], offset: query.length }
        : { path: [0, 1], offset: 1 };
      const trigger = findSlashMenuTrigger(document, { anchor: point, focus: point })!;
      expect(trigger.query).toBe(query);
      const before = structuredClone(document);
      const result = executeSlashCommand(
        item,
        createDefaultCommandRegistry(),
        { document },
        trigger,
      ).result;
      expect(result.ok).toBe(true);
      const after = applyTransaction(document, result.transaction!);
      const block = after.children[0]!;
      expect(block).toMatchObject({ type: "heading", level: 2 });
      if (block.type !== "heading") throw new Error("Expected a heading.");
      expect(block.children.filter((child) => child.text !== "")).toEqual([
        createText("前\u{1f600} ", { bold: true }),
        createText("后文", { strike: true }),
      ]);
      expect(result.selection!.anchor).toEqual(result.selection!.focus);
      expect(getBlockTextOffset(after, result.selection!.anchor)).toBe(4);
      expect(document).toEqual(before);
    },
  );

  it("accepts an equivalent start at the end of the previous text leaf", () => {
    const document = createDocument([
      createParagraph([
        createText("前 "),
        createText("", { bold: true }),
        createText("/h", { italic: true }),
        createText("后"),
      ]),
    ]);
    const trigger = {
      query: "h",
      text: "/h",
      range: {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 2], offset: 2 },
      },
    };
    const result = executeSlashCommand(
      item,
      createDefaultCommandRegistry(),
      { document },
      trigger,
    ).result;
    expect(result.ok).toBe(true);
    expect(applyTransaction(document, result.transaction!).children[0]).toMatchObject({
      type: "heading",
      children: [createText("前 后")],
    });
  });

  it("accepts an unchanged trigger in a new document with edited suffix text", () => {
    const original = createDocument([createParagraph([createText("/h旧内容")])]);
    const point = { path: [0, 0], offset: 2 };
    const trigger = findSlashMenuTrigger(original, { anchor: point, focus: point })!;
    const document = createDocument([createParagraph([createText("/h新内容")])]);
    const result = executeSlashCommand(
      item,
      createDefaultCommandRegistry(),
      { document },
      trigger,
    ).result;
    expect(result.ok).toBe(true);
    expect(applyTransaction(document, result.transaction!).children[0]).toMatchObject({
      type: "heading",
      children: [createText("新内容")],
    });
  });
});
