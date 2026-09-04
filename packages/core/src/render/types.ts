import type { Path } from "../selection";

export type RenderedTagName =
  | "a"
  | "blockquote"
  | "code"
  | "div"
  | "em"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "hr"
  | "p"
  | "pre"
  | "s"
  | "span"
  | "strong"
  | "u";

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
