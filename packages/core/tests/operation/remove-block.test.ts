import { describe, expect, it } from "vitest";

import {
  createDivider,
  createDocument,
  createParagraph,
  createText,
} from "../../src/model";
import {
  applyRemoveBlock,
  applyTransaction,
  createRemoveBlockOperation,
  createTransaction,
} from "../../src/operation";

describe("remove block operation", () => {
  it("creates an operation with a cloned path", () => {
    const path = [1];
    const operation = createRemoveBlockOperation(path);

    path[0] = 9;

    expect(operation).toEqual({ path: [1], type: "remove_block" });
  });

  it("removes one block without mutating the source document", () => {
    const document = createDocument([
      createParagraph([createText("上")]),
      createDivider(),
      createParagraph([createText("下")]),
    ]);
    const result = applyRemoveBlock(document, createRemoveBlockOperation([1]));

    expect(result.children.map((block) => block.type)).toEqual([
      "paragraph",
      "paragraph",
    ]);
    expect(document.children.map((block) => block.type)).toEqual([
      "paragraph",
      "divider",
      "paragraph",
    ]);
  });

  it("lets transaction normalization restore an editable empty document", () => {
    const document = createDocument([createDivider()]);
    const result = applyTransaction(
      document,
      createTransaction([createRemoveBlockOperation([0])]),
    );

    expect(result).toEqual({
      children: [{ children: [{ text: "", type: "text" }], type: "paragraph" }],
      type: "document",
    });
  });

  it("rejects missing and nested block paths", () => {
    const document = createDocument();

    expect(() => applyRemoveBlock(document, createRemoveBlockOperation([1]))).toThrow(
      "remove block path must reference a block",
    );
    expect(() =>
      applyRemoveBlock(document, createRemoveBlockOperation([0, 0])),
    ).toThrow("remove block path must reference a block");
  });
});
