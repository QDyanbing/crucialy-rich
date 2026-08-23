import type { Path } from "../selection";

export type RenderedTagName = "a" | "div" | "em" | "p" | "s" | "span" | "strong" | "u";

export interface RenderedElementStyle {
  backgroundColor?: string;
  color?: string;
  fontSize?: `${number}px`;
  fontStyle?: "italic";
  fontWeight?: "700";
  textDecoration?: string;
}

export interface RenderedElementNode {
  tagName: RenderedTagName;
  path: Path;
  attributes: Record<string, string>;
  children?: RenderedElementNode[];
  style?: RenderedElementStyle;
  text?: string;
}
