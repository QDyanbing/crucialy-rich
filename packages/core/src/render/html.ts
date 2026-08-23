import type { RenderedElementNode } from "./types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderStyle(node: RenderedElementNode): string | undefined {
  const declarations = [
    node.style?.backgroundColor
      ? `background-color: ${node.style.backgroundColor};`
      : undefined,
    node.style?.color ? `color: ${node.style.color};` : undefined,
    node.style?.fontSize ? `font-size: ${node.style.fontSize};` : undefined,
    node.style?.fontStyle ? `font-style: ${node.style.fontStyle};` : undefined,
    node.style?.fontWeight ? `font-weight: ${node.style.fontWeight};` : undefined,
    node.style?.textDecoration
      ? `text-decoration: ${node.style.textDecoration};`
      : undefined,
  ].filter((declaration): declaration is string => declaration !== undefined);

  return declarations.length > 0 ? declarations.join(" ") : undefined;
}

function renderAttributes(node: RenderedElementNode): string {
  const style = renderStyle(node);
  const attributes = style ? { ...node.attributes, style } : node.attributes;
  const serialized = Object.entries(attributes)
    .map(([name, value]) => `${name}="${escapeHtml(value)}"`)
    .join(" ");

  return serialized ? ` ${serialized}` : "";
}

export function renderNodeToHtml(node: RenderedElementNode): string {
  const children = node.children?.map(renderNodeToHtml).join("") ?? "";
  const text = node.text ? escapeHtml(node.text) : "";

  return `<${node.tagName}${renderAttributes(node)}>${text}${children}</${node.tagName}>`;
}
