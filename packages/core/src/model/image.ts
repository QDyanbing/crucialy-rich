export const IMAGE_PROTOCOLS = ["http:", "https:", "blob:"] as const;

const IMAGE_PROTOCOL_SET = new Set<string>(IMAGE_PROTOCOLS);

export function sanitizeImageSrc(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  try {
    const url = new URL(value.trim());

    return IMAGE_PROTOCOL_SET.has(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function normalizeImageDimension(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}
