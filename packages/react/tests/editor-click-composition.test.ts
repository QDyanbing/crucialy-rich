// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { mountInteractionEditor } from "./editor-interaction-fixture";

describe("editor clicks during composition", () => {
  it.each(["img", 'input[type="checkbox"]', "td", "p", "a"])(
    "does not apply %s while preserving the pending text session",
    (selector) => {
      const host = mountInteractionEditor();
      host.compose("compositionstart");
      host.compose("compositionupdate", "候选");
      host.click(selector);
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.block).not.toHaveBeenCalled();
      expect(host.cell).not.toHaveBeenCalled();
      expect(host.editor.getAttribute("data-composing")).toBe("true");
      expect(host.ref.current!.getDocument()).toEqual(host.value);
      expect(
        host.editor.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked,
      ).toBe(false);
      host.compose("compositionend", "中");
      expect(host.onTransaction).toHaveBeenCalledTimes(1);
      expect(host.onTransaction.mock.calls[0]![0].inputType).toBe(
        "insertCompositionText",
      );
      expect(host.editor.querySelector("p")!.textContent).toBe("正中文链接");
      host.click('input[type="checkbox"]');
      expect(host.onTransaction).toHaveBeenCalledTimes(2);
      expect(host.onTransaction.mock.calls[1]![0].inputType).toBe("setTaskItemChecked");
    },
  );
});
