// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { mountInteractionEditor } from "./editor-interaction-fixture";

describe("task click model authority", () => {
  it.each([0, 1])(
    "toggles model item %s even if its DOM checked value was altered",
    (index) => {
      const host = mountInteractionEditor();
      const checkbox = host.editor.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]',
      )[index]!;
      const original = index === 1;
      checkbox.checked = !original;
      host.click(`input[data-crucialy-path="[1,${index}]"]`);
      const event = host.onTransaction.mock.calls[0]![0];
      expect(event.transaction.operations).toEqual([
        { type: "set_task_item_checked", path: [1, index], checked: !original },
      ]);
      expect(checkbox.checked).toBe(!original);
      expect(event.after.children[1].children[1 - index]).toEqual(
        host.value.children[1]!.children[1 - index],
      );
      expect(event.after.children[0]).toEqual(host.value.children[0]);
    },
  );

  it.each(["[99,0]", "[0,0]", "[2]", "[1]", "[1,0,0]", "[1,0.5]", "bad"])(
    "ignores a task control pointing to %s",
    (path) => {
      const host = mountInteractionEditor();
      const fake = document.createElement("input");
      fake.type = "checkbox";
      fake.className = "fake-task";
      fake.setAttribute("data-crucialy-task-item", "true");
      fake.setAttribute("data-crucialy-path", path);
      host.editor.append(fake);
      host.click(".fake-task");
      expect(host.onTransaction).not.toHaveBeenCalled();
      expect(host.block).not.toHaveBeenCalled();
      expect(host.cell).not.toHaveBeenCalled();
    },
  );

  it("does not treat a text input as a task checkbox", () => {
    const host = mountInteractionEditor();
    const checkbox = host.target('input[type="checkbox"]') as HTMLInputElement;
    checkbox.type = "text";
    host.click('input[type="text"]');
    expect(host.onTransaction).not.toHaveBeenCalled();
    expect(host.block).not.toHaveBeenCalled();
    expect(host.cell).not.toHaveBeenCalled();
  });
});
