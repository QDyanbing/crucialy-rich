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
  const allocate = urlApi.createObjectURL.bind(urlApi);
  const release = urlApi.revokeObjectURL.bind(urlApi);
  try {
    objectUrl = allocate(file);
  } catch {
    return undefined;
  }
  const src = sanitizeImageSrc(objectUrl);

  if (!src || !src.startsWith("blob:") || src.length === 5) {
    release(objectUrl);
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
        release(objectUrl);
      }
    },
  };
}
