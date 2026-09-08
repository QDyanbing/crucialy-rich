import {
  BOLD_COMMAND_NAME,
  ITALIC_COMMAND_NAME,
  SET_HEADING_COMMAND_NAME,
  SET_LINK_COMMAND_NAME,
  STRIKE_COMMAND_NAME,
  TOGGLE_QUOTE_COMMAND_NAME,
  UNDERLINE_COMMAND_NAME,
} from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";

import { createDefaultToolbarItems } from "../src";

describe("createDefaultToolbarItems", () => {
  it("defines the fixed toolbar command order", () => {
    const commandNames = createDefaultToolbarItems()
      .filter((item) => item.type === "command")
      .map((item) => item.commandName);

    expect(commandNames).toEqual([
      BOLD_COMMAND_NAME,
      ITALIC_COMMAND_NAME,
      UNDERLINE_COMMAND_NAME,
      STRIKE_COMMAND_NAME,
      SET_LINK_COMMAND_NAME,
      SET_HEADING_COMMAND_NAME,
      TOGGLE_QUOTE_COMMAND_NAME,
    ]);
  });

  it("accepts host link and heading options", () => {
    const items = createDefaultToolbarItems({
      headingLevel: 3,
      link: { href: "https://example.com/docs" },
    });
    const link = items.find((item) => item.id === "link");
    const heading = items.find((item) => item.id === "heading-3");

    expect(link).toMatchObject({
      payload: { href: "https://example.com/docs" },
    });
    expect(heading).toMatchObject({ payload: { level: 3 }, text: "H3" });
  });
});
