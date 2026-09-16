import { describe, expect, it } from "vitest";

import { getPlainTextTableGrid, parseHtml, parsePlainText } from "../../src";

describe("getPlainTextTableGrid", () => {
  it("parses one TSV row and keeps empty cells", () => {
    expect(getPlainTextTableGrid(parsePlainText("姓名\t角色\t")!)).toEqual([
      ["姓名", "角色", ""],
    ]);
  });

  it("parses multiple TSV rows", () => {
    expect(getPlainTextTableGrid(parsePlainText("小明\t开发\n小红\t设计")!)).toEqual([
      ["小明", "开发"],
      ["小红", "设计"],
    ]);
  });

  it("treats multiline plain text as a one-column grid", () => {
    expect(getPlainTextTableGrid(parsePlainText("第一行\n第二行")!)).toEqual([
      ["第一行"],
      ["第二行"],
    ]);
  });

  it("leaves one plain-text value to regular text paste", () => {
    expect(getPlainTextTableGrid(parsePlainText("普通文字")!)).toBeUndefined();
  });

  it("rejects rich clipboard fragments", () => {
    expect(getPlainTextTableGrid(parseHtml("<p>姓名</p>")!)).toBeUndefined();
  });
});
