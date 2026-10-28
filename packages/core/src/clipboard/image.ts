import {
  createDocument,
  createImage,
  validateDocument,
  type ImageNode,
} from "../model";

export function getClipboardImage(image: ImageNode): ImageNode | undefined {
  if (image.status !== "ready" || !validateDocument(createDocument([image])).valid)
    return undefined;
  const url = new URL(image.src.trim());
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password
  )
    return undefined;
  return createImage(url.href, { alt: image.alt });
}
