export {
  canExecuteSetLinkCommand,
  canExecuteUnsetLinkCommand,
  getSelectedLinkMark,
  isLinkCommandActive,
  LINK_COMMANDS,
  SET_LINK_COMMAND_NAME,
  setLinkCommand,
  UNSET_LINK_COMMAND_NAME,
  unsetLinkCommand,
} from "./command/link";
export type { SetLinkCommandPayload } from "./command/link";
export {
  areLinkMarksEqual,
  isValidLinkMark,
  LINK_PROTOCOLS,
  normalizeLinkMark,
  normalizeLinkRel,
  normalizeLinkTarget,
  sanitizeLinkHref,
} from "./model/link";
export { getLinkMark, removeLinkMark, setLinkMark } from "./model/marks";
export { LINK_REL_TOKENS, LINK_TARGETS } from "./model/types";
export type { LinkMarkAttributes, LinkRelToken, LinkTarget } from "./model/types";
export {
  applySetLink,
  createSelectionAfterSetLink,
  createSetLinkOperation,
} from "./operation/set-link";
export type { SetLinkOperation } from "./operation/types";
