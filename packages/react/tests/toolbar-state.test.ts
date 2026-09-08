import {
  BOLD_COMMAND_NAME,
  createDefaultCommandRegistry,
  createDocument,
  createHeading,
  createParagraph,
  createText,
  SET_HEADING_COMMAND_NAME,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";

import { defineToolbarItems, resolveToolbarItems } from "../src";

describe("resolveToolbarItems", () => {
  it("maps command active and disabled state", () => {
    const document = createDocument([
      createParagraph([createText("加粗", { bold: true })]),
    ]);
    const [item] = resolveToolbarItems(
      defineToolbarItems([
        {
          commandName: BOLD_COMMAND_NAME,
          id: "bold",
          label: "加粗",
          type: "command",
        },
      ]),
      createDefaultCommandRegistry(),
      {
        document,
        selection: {
          anchor: { offset: 0, path: [0, 0] },
          focus: { offset: 2, path: [0, 0] },
        },
      },
    );

    expect(item).toMatchObject({
      state: { active: true, disabled: false, registered: true },
    });
  });

  it("passes item payload into command state queries", () => {
    const document = createDocument([createHeading(2, [createText("标题")])]);
    const [item] = resolveToolbarItems(
      [
        {
          commandName: SET_HEADING_COMMAND_NAME,
          id: "heading-two",
          label: "二级标题",
          payload: { level: 2 },
          type: "command" as const,
        },
      ],
      createDefaultCommandRegistry(),
      {
        document,
        selection: {
          anchor: { offset: 0, path: [0, 0] },
          focus: { offset: 2, path: [0, 0] },
        },
      },
    );

    expect(item).toMatchObject({ state: { active: true, disabled: false } });
  });

  it("disables unregistered commands", () => {
    const [item] = resolveToolbarItems(
      [
        {
          commandName: "missing",
          id: "missing",
          label: "缺失命令",
          type: "command" as const,
        },
      ],
      createDefaultCommandRegistry(),
      { document: createDocument() },
    );

    expect(item).toMatchObject({
      state: { active: false, disabled: true, registered: false },
    });
  });
});
