import { sanitizeImageSrc, type InsertImageCommandPayload } from "@crucialy-rich/core";

export interface LocalImageResource {
  payload: InsertImageCommandPayload;
  revoke: () => void;
}

export interface ObjectUrlApi {
  createObjectURL: (file: Blob) => string;
  revokeObjectURL: (url: string) => void;
}

export function createLocalImageResource(
  file: File,
  urlApi: ObjectUrlApi = globalThis.URL,
): LocalImageResource | undefined {
  if (!file.type.startsWith("image/")) {
    return undefined;
  }

  if (
    typeof urlApi?.createObjectURL !== "function" ||
    typeof urlApi?.revokeObjectURL !== "function"
  )
    return undefined;

  let objectUrl: string;
  try {
    objectUrl = urlApi.createObjectURL(file);
  } catch {
    return undefined;
  }
  const src = sanitizeImageSrc(objectUrl);

  if (!src) {
    urlApi.revokeObjectURL(objectUrl);
    return undefined;
  }

  let revoked = false;

  return {
    payload: {
      alt: file.name,
      src,
      status: "ready",
    },
    revoke() {
      if (!revoked) {
        revoked = true;
        urlApi.revokeObjectURL(objectUrl);
      }
    },
  };
}
