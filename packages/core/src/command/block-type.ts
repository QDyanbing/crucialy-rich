import { setHeadingCommand } from "./heading";
import { toggleQuoteCommand } from "./quote";
import type { Command } from "./types";

export const BLOCK_TYPE_COMMANDS: readonly Command[] = [
  setHeadingCommand,
  toggleQuoteCommand,
];
