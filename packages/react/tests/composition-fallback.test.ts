// @vitest-environment jsdom
import { createDocument, createParagraph, createText } from "@crucialy-rich/core";
import { describe, expect, it } from "vitest";
import { mountDeletionEditor } from "./deletion-fixture";

describe("composition end beforeinput fallback ownership", () => {
  it.each(["中文", "\u{1f600}", "e\u0301"])(
    "commits %s once even when React synthesizes a beforeinput fallback",
    (text) => {
      const host = mountDeletionEditor(
        createDocument([createParagraph([createText("AB")])]),
        { path: [0, 0], offset: 1 },
      );
      host.compose("compositionstart");
      host.compose("compositionupdate", "候选");
      host.compose("compositionend", text);
      expect(host.editor.textContent).toBe(`A${text}B`);
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
      expect(host.onTransaction.mock.calls[0]![0]).toMatchObject({
        inputType: "insertCompositionText",
        batch: "composition",
      });
    },
  );

  it("does not insert an unpaired compositionend through the ordinary text pipeline", () => {
    const host = mountDeletionEditor(
      createDocument([createParagraph([createText("AB")])]),
      { path: [0, 0], offset: 1 },
    );
    host.compose("compositionend", "不应插入");
    expect(host.editor.textContent).toBe("AB");
    expect(host.onTransaction).not.toHaveBeenCalled();
  });

  it("ignores a duplicate end instead of creating a second history transaction", () => {
    const host = mountDeletionEditor(
      createDocument([createParagraph([createText("AB")])]),
      { path: [0, 0], offset: 1 },
    );
    host.compose("compositionstart");
    host.compose("compositionend", "中");
    host.compose("compositionend", "中");
    expect(host.onTransaction).toHaveBeenCalledTimes(1);
    expect(host.editor.textContent).toBe("A中B");
  });
});
