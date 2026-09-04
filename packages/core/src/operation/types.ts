import type {
  HeadingLevel,
  LinkMarkAttributes,
  TextMarkAttributes,
  TextMarkAttributeType,
  TextMarkType,
} from "../model";
import type { Path, Point, RangeSelection } from "../selection";

export type BlockTypeSpec =
  | { type: "codeBlock" }
  | { type: "heading"; level: HeadingLevel }
  | { type: "paragraph" }
  | { type: "quote" };

export const OPERATION_TYPES = [
  "insert_text",
  "delete_text",
  "toggle_mark",
  "set_mark_attribute",
  "set_link",
  "set_block_type",
  "split_block",
  "merge_block",
] as const;

export type OperationType = (typeof OPERATION_TYPES)[number];

export interface InsertTextOperation {
  point: Point;
  text: string;
  type: "insert_text";
}

export interface DeleteTextOperation {
  range: RangeSelection;
  type: "delete_text";
}

export interface ToggleMarkOperation {
  mark: TextMarkType;
  range: RangeSelection;
  type: "toggle_mark";
}

export interface SetMarkAttributeOperation<
  TAttribute extends TextMarkAttributeType = TextMarkAttributeType,
> {
  attribute: TAttribute;
  range: RangeSelection;
  type: "set_mark_attribute";
  value: TextMarkAttributes[TAttribute] | null;
}

export interface SetLinkOperation {
  link: LinkMarkAttributes | null;
  range: RangeSelection;
  type: "set_link";
}

export interface SplitBlockOperation {
  point: Point;
  type: "split_block";
}

export interface MergeBlockOperation {
  point: Point;
  type: "merge_block";
}

export interface SetBlockTypeOperation {
  block: BlockTypeSpec;
  path: Path;
  type: "set_block_type";
}

export type Operation =
  | DeleteTextOperation
  | InsertTextOperation
  | MergeBlockOperation
  | SetBlockTypeOperation
  | SetLinkOperation
  | SetMarkAttributeOperation
  | SplitBlockOperation
  | ToggleMarkOperation;

export interface Transaction {
  operations: Operation[];
}
