import {
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
  SET_HEADING_COMMAND_NAME,
} from "@crucialy-rich/core";
import { describe, expect, it, vi } from "vitest";
import { executeSlashCommand, findSlashMenuTrigger } from "../src";

const item = {
  id: "heading",
  label: "二级标题",
  commandName: SET_HEADING_COMMAND_NAME,
  payload: { level: 2 },
};

describe("Slash trigger freshness", () => {
  it.each(["正文内容", "/x正文", " /h正文", "x/h正文"])(
    "rejects an old trigger against changed text %s before command lookup",
    (text) => {
      const original = createDocument([createParagraph([createText("/h正文")])]);
      const trigger = findSlashMenuTrigger(original, {
        anchor: { path: [0, 0], offset: 2 },
        focus: { path: [0, 0], offset: 2 },
      })!;
      const document = createDocument([createParagraph([createText(text)])]);
      const before = structuredClone(document);
      const registry = createDefaultCommandRegistry();
      const get = vi.spyOn(registry, "get");
      const event = executeSlashCommand(item, registry, { document }, trigger);
      expect(event.result).toMatchObject({ ok: false, status: "failure" });
      expect(event.result).not.toHaveProperty("transaction");
      expect(event.result).not.toHaveProperty("selection");
      expect(get).not.toHaveBeenCalled();
      expect(document).toEqual(before);
    },
  );

  it.each([{ text: "/x" }, { query: "x" }])(
    "rejects inconsistent saved trigger metadata %j",
    (metadata) => {
      const document = createDocument([createParagraph([createText("/h正文")])]);
      const range = {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 2 },
      };
      const result = executeSlashCommand(
        item,
        createDefaultCommandRegistry(),
        { document },
        { range, text: "/h", query: "h", ...metadata },
      ).result;
      expect(result.ok).toBe(false);
      expect(result.transaction).toBeUndefined();
    },
  );
});
