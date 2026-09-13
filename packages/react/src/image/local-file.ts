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
  urlApi: ObjectUrlApi = URL,
): LocalImageResource | undefined {
  if (!file.type.startsWith("image/")) {
    return undefined;
  }

  const objectUrl = urlApi.createObjectURL(file);
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
