import { setBackgroundColorCommand } from "./background-color";
import { setFontSizeCommand } from "./font-size";
import { setTextColorCommand } from "./text-color";
import type { Command } from "./types";

export const TEXT_STYLE_COMMANDS: readonly Command[] = [
  setFontSizeCommand,
  setTextColorCommand,
  setBackgroundColorCommand,
];
