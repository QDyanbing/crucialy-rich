import { describe, expect, it } from "vitest";

import {
  applyTransaction,
  canExecuteSetCodeBlockCommand,
  createCodeBlock,
  createDocument,
  createHeading,
  createParagraph,
  createText,
  isCodeBlockCommandActive,
  setCodeBlockCommand,
} from "../../src";

describe("setCodeBlockCommand", () => {
  const selection = {
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [0, 0], offset: 2 },
  };

  it("turns a rich text block into plain code", () => {
    const document = createDocument([
      createParagraph([createText("代码", { bold: true })]),
    ]);
    const input = { context: { document, selection } };
    const result = setCodeBlockCommand.execute(input);

    expect(canExecuteSetCodeBlockCommand(input)).toBe(true);
    expect(result.transaction?.operations).toEqual([
      { block: { type: "codeBlock" }, path: [0], type: "set_block_type" },
    ]);
    expect(applyTransaction(document, result.transaction!).children[0]).toEqual({
      children: [{ text: "代码", type: "text" }],
      type: "codeBlock",
    });
  });

  it("restores selected code blocks to paragraphs", () => {
    const document = createDocument([createCodeBlock([createText("code")])]);
    const result = setCodeBlockCommand.execute({
      context: { document, selection },
      payload: { enabled: false },
    });

    expect(applyTransaction(document, result.transaction!).children[0]?.type).toBe(
      "paragraph",
    );
  });

  it("switches every block in a continuous selection", () => {
    const document = createDocument([
      createParagraph([createText("第一段")]),
      createHeading(2, [createText("第二段")]),
    ]);
    const range = {
      anchor: { path: [1, 0], offset: 2 },
      focus: { path: [0, 0], offset: 1 },
    };
    const result = setCodeBlockCommand.execute({
      context: { document, selection: range },
    });

    expect(
      applyTransaction(document, result.transaction!).children.map(
        (block) => block.type,
      ),
    ).toEqual(["codeBlock", "codeBlock"]);
    expect(result.selection).toEqual(range);
  });

  it("reports active and invalid states", () => {
    const document = createDocument([createCodeBlock([createText("code")])]);
    const input = { context: { document, selection } };

    expect(isCodeBlockCommandActive(input)).toBe(true);
    expect(
      canExecuteSetCodeBlockCommand({ ...input, payload: { enabled: "yes" } }),
    ).toBe(false);
    expect(setCodeBlockCommand.execute({ context: { document } }).status).toBe(
      "skipped",
    );
  });
});
