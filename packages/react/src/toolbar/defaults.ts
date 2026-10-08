import {
  BOLD_COMMAND_NAME,
  CLEAR_FORMATTING_COMMAND_NAME,
  INLINE_CODE_COMMAND_NAME,
  ITALIC_COMMAND_NAME,
  SET_HEADING_COMMAND_NAME,
  SET_LINK_COMMAND_NAME,
  STRIKE_COMMAND_NAME,
  TOGGLE_QUOTE_COMMAND_NAME,
  UNDERLINE_COMMAND_NAME,
  type HeadingLevel,
  type SetLinkCommandPayload,
} from "@crucialy-rich/core";

import { defineToolbarItems } from "./config";
import type { ToolbarItem } from "./types";

export interface DefaultToolbarOptions {
  headingLevel?: HeadingLevel;
  link?: SetLinkCommandPayload;
}

export function createDefaultToolbarItems(
  options: DefaultToolbarOptions = {},
): ToolbarItem[] {
  const headingLevel = options.headingLevel ?? 2;

  return defineToolbarItems([
    {
      commandName: BOLD_COMMAND_NAME,
      id: "bold",
      label: "加粗",
      text: "B",
      type: "command",
    },
    {
      commandName: ITALIC_COMMAND_NAME,
      id: "italic",
      label: "斜体",
      text: "I",
      type: "command",
    },
    {
      commandName: UNDERLINE_COMMAND_NAME,
      id: "underline",
      label: "下划线",
      text: "U",
      type: "command",
    },
    {
      commandName: STRIKE_COMMAND_NAME,
      id: "strike",
      label: "删除线",
      text: "S",
      type: "command",
    },
    {
      commandName: INLINE_CODE_COMMAND_NAME,
      id: "inline-code",
      label: "行内代码",
      text: "</>",
      type: "command",
    },
    {
      commandName: CLEAR_FORMATTING_COMMAND_NAME,
      id: "clear-formatting",
      label: "清除格式",
      text: "Tx",
      type: "command",
    },
    { id: "inline-block-separator", type: "separator" },
    {
      commandName: SET_LINK_COMMAND_NAME,
      id: "link",
      label: "链接",
      payload: options.link,
      text: "链接",
      type: "command",
    },
    {
      commandName: SET_HEADING_COMMAND_NAME,
      id: `heading-${headingLevel}`,
      label: `${headingLevel} 级标题`,
      payload: { level: headingLevel },
      text: `H${headingLevel}`,
      type: "command",
    },
    {
      commandName: TOGGLE_QUOTE_COMMAND_NAME,
      id: "quote",
      label: "引用",
      text: "引用",
      type: "command",
    },
  ]);
}
