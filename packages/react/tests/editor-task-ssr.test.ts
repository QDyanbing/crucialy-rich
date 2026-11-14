import { createDocument, createTaskList, createTaskItem } from "@crucialy-rich/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RichTextEditor } from "../src";

describe("task controls during SSR", () => {
  it.each([false, true])(
    "renders editable=%s without a browser runtime",
    (editable) => {
      const value = createDocument([
        createTaskList([createTaskItem(), createTaskItem(undefined, true)]),
      ]);
      const html = renderToStaticMarkup(
        createElement(RichTextEditor, { value, contentEditable: editable }),
      );
      expect(html.match(/type="checkbox"/gu)).toHaveLength(2);
      expect(html.match(/disabled=""/gu)?.length ?? 0).toBe(editable ? 0 : 2);
    },
  );
});
