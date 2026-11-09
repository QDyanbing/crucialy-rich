import {
  createDefaultCommandRegistry,
  createDocument,
  createHeading,
  createParagraph,
  createText,
  SET_HEADING_COMMAND_NAME,
  type DocumentNode,
  type RangeSelection,
} from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { executeSlashCommand, type SlashMenuTrigger } from "../src";

const item = {
  id: "heading",
  label: "二级标题",
  commandName: SET_HEADING_COMMAND_NAME,
  payload: { level: 2 },
};
const range: RangeSelection = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 2 },
};

function reject(document: DocumentNode, range: RangeSelection) {
  const trigger: SlashMenuTrigger = { query: "h", text: "/h", range };
  const before = structuredClone(document);
  const registry = createDefaultCommandRegistry();
  const get = vi.spyOn(registry, "get");
  const { result } = executeSlashCommand(item, registry, { document }, trigger);
  expect(result).toMatchObject({ ok: false, status: "failure" });
  expect(result).not.toHaveProperty("transaction");
  expect(result).not.toHaveProperty("selection");
  expect(get).not.toHaveBeenCalled();
  expect(document).toEqual(before);
}

describe("Slash trigger range boundaries", () => {
  it.each([
    ["collapsed", { anchor: range.focus, focus: range.focus }],
    ["reversed", { anchor: range.focus, focus: range.anchor }],
    ["partial", { anchor: { path: [0, 0], offset: 1 }, focus: range.focus }],
    ["cross-block", { anchor: range.anchor, focus: { path: [1, 0], offset: 2 } }],
    ["structural anchor", { anchor: { path: [0], offset: 0 }, focus: range.focus }],
    ["structural focus", { anchor: range.anchor, focus: { path: [0], offset: 2 } }],
    ["missing leaf", { anchor: range.anchor, focus: { path: [0, 9], offset: 2 } }],
    ["negative offset", { anchor: { path: [0, 0], offset: -1 }, focus: range.focus }],
    [
      "fractional offset",
      { anchor: range.anchor, focus: { path: [0, 0], offset: 1.5 } },
    ],
    ["beyond end", { anchor: range.anchor, focus: { path: [0, 0], offset: 99 } }],
  ] satisfies Array<[string, RangeSelection]>)("rejects a %s range", (_name, input) => {
    reject(
      createDocument([
        createParagraph([createText("/h正文")]),
        createParagraph([createText("/h邻段")]),
      ]),
      input,
    );
  });

  it("does not allow the caller to extend cleanup before the actual slash", () => {
    reject(createDocument([createParagraph([createText("前文 /h正文")])]), {
      anchor: range.anchor,
      focus: { path: [0, 0], offset: 5 },
    });
  });

  it("rejects a formerly valid paragraph trigger after it becomes a heading", () => {
    reject(createDocument([createHeading(1, [createText("/h正文")])]), range);
  });
});
