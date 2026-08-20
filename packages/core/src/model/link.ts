import {
  LINK_REL_TOKENS,
  LINK_TARGETS,
  type LinkMarkAttributes,
  type LinkTarget,
} from "./types";

export const LINK_PROTOCOLS = ["http:", "https:", "mailto:"] as const;

const LINK_PROTOCOL_SET = new Set<string>(LINK_PROTOCOLS);
const LINK_REL_TOKEN_SET = new Set<string>(LINK_REL_TOKENS);
const LINK_TARGET_SET = new Set<string>(LINK_TARGETS);

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);

    return codePoint !== undefined && (codePoint <= 31 || codePoint === 127);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sanitizeLinkHref(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const href = value.trim();

  if (href.length === 0 || hasControlCharacter(href)) {
    return undefined;
  }

  try {
    const url = new URL(href);

    if (!LINK_PROTOCOL_SET.has(url.protocol)) {
      return undefined;
    }

    if (url.protocol === "mailto:" && url.pathname.length === 0) {
      return undefined;
    }

    return url.href;
  } catch {
    return undefined;
  }
}

export function normalizeLinkTarget(value: unknown): LinkTarget | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const target = value.trim().toLowerCase();

  return LINK_TARGET_SET.has(target) ? (target as LinkTarget) : undefined;
}

export function normalizeLinkRel(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const tokens = value.trim().toLowerCase().split(/\s+/).filter(Boolean);

  if (tokens.length === 0 || tokens.some((token) => !LINK_REL_TOKEN_SET.has(token))) {
    return undefined;
  }

  const selectedTokens = new Set(tokens);

  return LINK_REL_TOKENS.filter((token) => selectedTokens.has(token)).join(" ");
}

export function normalizeLinkMark(value: unknown): LinkMarkAttributes | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const href = sanitizeLinkHref(value.href);

  if (href === undefined) {
    return undefined;
  }

  const rel = normalizeLinkRel(value.rel);
  const target = normalizeLinkTarget(value.target);

  return {
    href,
    ...(rel === undefined ? {} : { rel }),
    ...(target === undefined ? {} : { target }),
  };
}

export function areLinkMarksEqual(left: unknown, right: unknown): boolean {
  const normalizedLeft = normalizeLinkMark(left);
  const normalizedRight = normalizeLinkMark(right);

  return (
    normalizedLeft?.href === normalizedRight?.href &&
    normalizedLeft?.rel === normalizedRight?.rel &&
    normalizedLeft?.target === normalizedRight?.target
  );
}
