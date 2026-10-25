import { describe, expect, it } from "vitest";
import {
  createDocument,
  createListItem,
  createOrderedList,
  createText,
} from "../../src";
import { getClipboardList } from "../../src/clipboard/selection-list";

describe("ordered clipboard list numbering", () => {
  const selection = {
    anchor: { path: [0, 1, 0], offset: 1 },
    focus: { path: [0, 2, 0], offset: 1 },
  };
  const entries = ["前项", "甲乙", "丙丁"].map((text) =>
    createListItem([createText(text)]),
  );

  it.each([undefined, 0, -3, 7, Number.MAX_SAFE_INTEGER - 1])(
    "adjusts start %s for the first selected item",
    (start) => {
      const document = createDocument([createOrderedList(entries, start)]);
      expect(getClipboardList(document, selection)).toEqual(
        createOrderedList(
          [createListItem([createText("乙")]), createListItem([createText("丙")])],
          (start ?? 1) + 1,
        ),
      );
      expect(document.children[0]).toEqual(createOrderedList(entries, start));
    },
  );

  it.each([Number.MAX_SAFE_INTEGER, Infinity, NaN, 1.5])(
    "rejects unsafe start arithmetic for %s",
    (start) => {
      expect(
        getClipboardList(
          createDocument([createOrderedList(entries, start)]),
          selection,
        ),
      ).toBeUndefined();
    },
  );
});
