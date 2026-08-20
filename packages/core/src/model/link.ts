export const LINK_PROTOCOLS = ["http:", "https:", "mailto:"] as const;

const LINK_PROTOCOL_SET = new Set<string>(LINK_PROTOCOLS);

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);

    return codePoint !== undefined && (codePoint <= 31 || codePoint === 127);
  });
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
