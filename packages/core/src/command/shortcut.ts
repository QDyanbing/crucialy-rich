import type { CommandName } from "./types";

export interface CommandShortcutBinding {
  readonly altKey?: boolean;
  readonly commandName: CommandName;
  readonly key: string;
  readonly shiftKey?: boolean;
}

export interface CommandShortcutInput {
  readonly altKey?: boolean;
  readonly code?: string;
  readonly ctrlKey?: boolean;
  readonly isComposing?: boolean;
  readonly key: string;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
}
