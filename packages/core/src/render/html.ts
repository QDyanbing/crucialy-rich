import type { RenderedElementNode } from "./types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderAttributes(attributes: Record<string, string>): string {
  const serialized = Object.entries(attributes)
    .map(([name, value]) => `${name}="${escapeHtml(value)}"`)
    .join(" ");

  return serialized ? ` ${serialized}` : "";
}

export function renderNodeToHtml(node: RenderedElementNode): string {
  const children = node.children?.map(renderNodeToHtml).join("") ?? "";
  const text = node.text ? escapeHtml(node.text) : "";

  return `<${node.tagName}${renderAttributes(node.attributes)}>${text}${children}</${node.tagName}>`;
}
