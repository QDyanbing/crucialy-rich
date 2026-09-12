import {
  applyTransaction,
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
  SET_HEADING_COMMAND_NAME,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";

import { executeSlashCommand } from "../src/slash-menu/execute";

const headingItem = {
  commandName: SET_HEADING_COMMAND_NAME,
  id: "heading-2",
  label: "二级标题",
  payload: { level: 2 },
};

describe("executeSlashCommand", () => {
  it("removes the query and applies the target command in one transaction", () => {
    const document = createDocument([createParagraph([createText("/he标题")])]);
    const trigger = {
      query: "he",
      range: {
        anchor: { offset: 0, path: [0, 0] },
        focus: { offset: 3, path: [0, 0] },
      },
      text: "/he",
    };
    const event = executeSlashCommand(
      headingItem,
      createDefaultCommandRegistry(),
      { document, selection: trigger.range },
      trigger,
    );

    expect(event.result.ok).toBe(true);
    expect(
      event.result.transaction?.operations.map((operation) => operation.type),
    ).toEqual(["delete_text", "set_block_type"]);
    expect(applyTransaction(document, event.result.transaction!)).toEqual({
      children: [
        {
          children: [{ text: "标题", type: "text" }],
          level: 2,
          type: "heading",
        },
      ],
      type: "document",
    });
    expect(event.result.selection).toEqual({
      anchor: { offset: 0, path: [0, 0] },
      focus: { offset: 0, path: [0, 0] },
    });
  });

  it("cleans a trigger split across marked text nodes", () => {
    const document = createDocument([
      createParagraph([
        createText("/", { bold: true }),
        createText("he", { italic: true }),
        createText("标题"),
      ]),
    ]);
    const trigger = {
      query: "he",
      range: {
        anchor: { offset: 0, path: [0, 0] },
        focus: { offset: 2, path: [0, 1] },
      },
      text: "/he",
    };
    const event = executeSlashCommand(
      headingItem,
      createDefaultCommandRegistry(),
      { document },
      trigger,
    );

    expect(event.result.ok).toBe(true);
    expect(applyTransaction(document, event.result.transaction!)).toMatchObject({
      children: [
        {
          children: [{ text: "标题", type: "text" }],
          level: 2,
          type: "heading",
        },
      ],
    });
  });

  it("does not expose the cleanup transaction when the target command fails", () => {
    const document = createDocument([createParagraph([createText("/missing")])]);
    const trigger = {
      query: "missing",
      range: {
        anchor: { offset: 0, path: [0, 0] },
        focus: { offset: 8, path: [0, 0] },
      },
      text: "/missing",
    };
    const event = executeSlashCommand(
      { commandName: "missing", id: "missing", label: "缺失命令" },
      createDefaultCommandRegistry(),
      { document },
      trigger,
    );

    expect(event.result).toMatchObject({
      commandName: "missing",
      ok: false,
      status: "failure",
    });
    expect(event.result.transaction).toBeUndefined();
  });
});
