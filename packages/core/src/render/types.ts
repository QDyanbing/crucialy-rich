import type { Path } from "../selection";

export type RenderedTagName = "div" | "p" | "span";

export interface RenderedElementNode {
  tagName: RenderedTagName;
  path: Path;
  attributes: Record<string, string>;
  children?: RenderedElementNode[];
  text?: string;
}
