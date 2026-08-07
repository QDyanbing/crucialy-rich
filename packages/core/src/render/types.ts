import type { Path } from "../selection";

export type RenderedTagName = "div" | "em" | "p" | "s" | "span" | "strong" | "u";

export interface RenderedElementStyle {
  fontStyle?: "italic";
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
