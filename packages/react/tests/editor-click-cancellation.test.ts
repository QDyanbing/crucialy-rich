// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { mountInteractionEditor } from "./editor-interaction-fixture";

describe("editor host click cancellation", () => {
  it.each(["img", 'input[type="checkbox"]', "td", "p", "a"])(
    "leaves %s entirely to the canceling host",
    (selector) => {
      const onClick = vi.fn();
      const host = mountInteractionEditor({
        onClick(event) {
          onClick();
          event.preventDefault();
        },
      });
      host.click(selector);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(host.onChange).not.toHaveBeenCalled();
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.block).not.toHaveBeenCalled();
      expect(host.cell).not.toHaveBeenCalled();
      expect(host.ref.current!.getDocument()).toEqual(host.value);
    },
  );
});
