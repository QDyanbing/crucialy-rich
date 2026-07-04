import { validateDocument, type DocumentNode, type ValidationResult } from "../model";
import { summarizeTransaction, type TransactionSummary } from "./summary";
import { applyTransaction } from "./transaction";
import type { Transaction } from "./types";

export interface TransactionAcceptanceReport {
  after: ValidationResult | null;
  before: ValidationResult;
  error: string | null;
  ok: boolean;
  transaction: TransactionSummary;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createTransactionAcceptanceReport(
  document: DocumentNode,
  transaction: Transaction,
): TransactionAcceptanceReport {
  const before = validateDocument(document);
  const summary = summarizeTransaction(transaction);

  try {
    const result = applyTransaction(document, transaction);
    const after = validateDocument(result);

    return {
      after,
      before,
      error: null,
      ok: before.valid && after.valid,
      transaction: summary,
    };
  } catch (error) {
    return {
      after: null,
      before,
      error: getErrorMessage(error),
      ok: false,
      transaction: summary,
    };
  }
}
