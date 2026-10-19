import { parse, type DefaultTreeAdapterMap } from "parse5";

type Node = DefaultTreeAdapterMap["node"];

function hasOfficeMarkup(node: Node): boolean {
  if ("attrs" in node) {
    for (const { name, value } of node.attrs) {
      if (
        (name === "class" &&
          value.split(/\s+/).some((token) => /^mso[a-z]/i.test(token))) ||
        (name === "style" && /(?:^|;)\s*mso-[a-z-]+\s*:/i.test(value)) ||
        ((name === "xmlns" || name.startsWith("xmlns:")) &&
          /^urn:schemas-microsoft-com:office:(?:office|word|excel|powerpoint)$/i.test(
            value,
          ))
      ) {
        return true;
      }
    }

    if (
      node.tagName === "meta" &&
      node.attrs.some(
        ({ name, value }) => name === "name" && value.toLowerCase() === "generator",
      ) &&
      node.attrs.some(
        ({ name, value }) =>
          name === "content" &&
          /^microsoft\s+(?:office\s+)?(?:word|excel|powerpoint)(?:\s|$)/i.test(
            value.trim(),
          ),
      )
    ) {
      return true;
    }

    if (
      node.tagName === "style" &&
      node.childNodes.some(
        (child) =>
          "value" in child && /(?:^|[;{])\s*mso-[a-z-]+\s*:/i.test(child.value),
      )
    ) {
      return true;
    }
  }

  return "childNodes" in node && node.childNodes.some(hasOfficeMarkup);
}

export function isOfficeHtml(value: string): boolean {
  // A full document retains Office metadata in html/head that parseFragment drops.
  return hasOfficeMarkup(parse(value));
}
