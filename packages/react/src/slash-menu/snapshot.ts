import { cloneRangeSelection } from "@crucialy-rich/core";
import type { SlashMenuTrigger } from "./types";

export function cloneSlashMenuTrigger(trigger: SlashMenuTrigger): SlashMenuTrigger {
  return { ...trigger, range: cloneRangeSelection(trigger.range) };
}
