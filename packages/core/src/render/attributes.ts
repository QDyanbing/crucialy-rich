import type { Path } from "../selection";

export const MODEL_PATH_ATTRIBUTE = "data-crucialy-path";

function isValidPath(value: unknown): value is Path {
  return (
    Array.isArray(value) && value.every((part) => Number.isInteger(part) && part >= 0)
  );
}

export function encodeModelPath(path: Path): string {
  return JSON.stringify(path);
}

export function decodeModelPath(value: string): Path | undefined {
  try {
    const parsed = JSON.parse(value) as unknown;

    return isValidPath(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function createModelPathAttributes(path: Path): Record<string, string> {
  return {
    [MODEL_PATH_ATTRIBUTE]: encodeModelPath(path),
  };
}
