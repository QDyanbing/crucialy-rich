import { describe, expect, it } from "vitest";

import { createDocument, createParagraph, createText } from "../../src/model";
import {
  createDeleteTextOperation,
  createInsertTextOperation,
  createSetBlockTypeOperation,
  createTransaction,
  createTransactionAcceptanceReport,
} from "../../src/operation";

describe("createTransactionAcceptanceReport", () => {
  it("reports a valid transaction result", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const transaction = createTransaction([
      createInsertTextOperation({ path: [0, 0], offset: 2 }, "世界"),
    ]);

    expect(createTransactionAcceptanceReport(document, transaction)).toMatchObject({
      after: { valid: true },
      before: { valid: true },
      error: null,
      ok: true,
      transaction: {
        operationCount: 1,
        operationTypes: ["insert_text"],
        textOperationCount: 1,
      },
    });
  });

  it("reports normalize results for empty transactions", () => {
    const document = createDocument([]);
    const report = createTransactionAcceptanceReport(document, createTransaction());

    expect(report.ok).toBe(true);
    expect(report.before.valid).toBe(true);
    expect(report.after?.valid).toBe(true);
    expect(report.transaction.operationCount).toBe(0);
  });

  it("reports a valid block type transaction", () => {
    const document = createDocument([createParagraph([createText("引用")])]);
    const transaction = createTransaction([
      createSetBlockTypeOperation([0], { type: "quote" }),
    ]);
    const report = createTransactionAcceptanceReport(document, transaction);

    expect(report).toMatchObject({
      after: { errors: [], valid: true },
      before: { errors: [], valid: true },
      error: null,
      ok: true,
      transaction: {
        blockOperationCount: 1,
        operationCount: 1,
        operationTypes: ["set_block_type"],
      },
    });
  });

  it("reports failed transactions without an after validation result", () => {
    const document = createDocument([createParagraph([createText("你好")])]);
    const transaction = createTransaction([
      createDeleteTextOperation({
        anchor: { path: [0, 0], offset: 99 },
        focus: { path: [0, 0], offset: 100 },
      }),
    ]);
    const report = createTransactionAcceptanceReport(document, transaction);

    expect(report.ok).toBe(false);
    expect(report.before.valid).toBe(true);
    expect(report.after).toBeNull();
    expect(report.error).toBe("delete text range must reference text nodes");
  });
});
