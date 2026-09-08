import {
  applyTransaction,
  BOLD_COMMAND_NAME,
  createDefaultCommandRegistry,
  createDocument,
  createParagraph,
  createText,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";

import { executeToolbarCommand, resolveToolbarItems } from "../src";

describe("executeToolbarCommand", () => {
  it("executes the configured command with the current selection", () => {
    const document = createDocument([createParagraph([createText("工具栏")])]);
    const selection = {
      anchor: { offset: 0, path: [0, 0] },
      focus: { offset: 3, path: [0, 0] },
    };
    const registry = createDefaultCommandRegistry();
    const [item] = resolveToolbarItems(
      [
        {
          commandName: BOLD_COMMAND_NAME,
          id: "bold",
          label: "加粗",
          type: "command" as const,
        },
      ],
      registry,
      { document, selection },
    );

    if (!item || item.type !== "command") {
      throw new Error("Missing resolved toolbar command.");
    }

    const event = executeToolbarCommand(item, registry, { document, selection });
    const nextDocument = applyTransaction(document, event.result.transaction!);

    expect(event.result.ok).toBe(true);
    expect(event.selection).toEqual(selection);
    expect(event.selection).not.toBe(selection);
    expect(nextDocument.children[0]).toMatchObject({
      children: [{ marks: { bold: true }, text: "工具栏", type: "text" }],
    });
  });
});
