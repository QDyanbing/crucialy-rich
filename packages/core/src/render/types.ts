import type { Path } from "../selection";

export type RenderedTagName = "div" | "em" | "p" | "span" | "strong";

export interface RenderedElementNode {
  tagName: RenderedTagName;
  path: Path;
  attributes: Record<string, string>;
  children?: RenderedElementNode[];
  text?: string;
}
