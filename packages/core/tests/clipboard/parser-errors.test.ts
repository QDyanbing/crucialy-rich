import { describe, expect, it, vi } from "vitest";
import {
  createParagraph,
  createText,
  parseClipboardData,
  parseHtml,
  parsePlainText,
} from "../../src";

const source = {
  types: ["text/html", "text/plain"],
  getData: (type: string) => (type === "text/html" ? "<p>rich</p>" : "fallback"),
};

describe("clipboard parser and filter exceptions", () => {
  for (const stage of ["parser", "filter"] as const) {
    it.each([new Error("Callback failed."), "callback", null, Symbol("callback")])(
      `stops the current parse when the ${stage} throws %s`,
      (error) => {
        const fallback = vi.fn(parsePlainText);
        const first = vi.fn((value: string) => {
          if (stage === "parser") throw error;
          return parseHtml(value);
        });
        const accept = vi.fn(() => {
          if (stage === "filter") throw error;
          return true;
        });
        expect(
          parseClipboardData(
            source,
            [
              { mimeType: "text/html", parse: first },
              { mimeType: "text/plain", parse: fallback },
            ],
            accept,
          ),
        ).toBeUndefined();
        expect(first).toHaveBeenCalledTimes(1);
        expect(accept).toHaveBeenCalledTimes(stage === "parser" ? 0 : 1);
        expect(fallback).not.toHaveBeenCalled();
      },
    );
  }

  it.each(["parser", "filter"] as const)(
    "still falls back on an ordinary %s rejection",
    (stage) => {
      const fragment = parseClipboardData(
        source,
        [
          {
            mimeType: "text/html",
            parse: stage === "parser" ? () => undefined : parseHtml,
          },
          { mimeType: "text/plain", parse: parsePlainText },
        ],
        (candidate) => stage !== "filter" || candidate.mimeType === "text/plain",
      );
      expect(fragment).toEqual({
        mimeType: "text/plain",
        blocks: [createParagraph([createText("fallback")])],
      });
    },
  );

  it("does not call an excluded rich parser for an Office source", () => {
    const rich = vi.fn(() => {
      throw new Error("Excluded parser.");
    });
    const result = parseClipboardData(
      {
        ...source,
        getData: (type) =>
          type === "text/html" ? '<p class="MsoNormal">Office</p>' : "actual plain",
      },
      [
        { mimeType: "text/html", parse: rich },
        { mimeType: "text/plain", parse: parsePlainText },
      ],
    );
    expect(result?.mimeType).toBe("text/plain");
    expect(rich).not.toHaveBeenCalled();
  });
});
