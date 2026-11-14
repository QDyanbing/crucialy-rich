import {
  createDocument,
  createParagraph,
  createText,
  createTaskList,
  createTaskItem,
  createImage,
  createTable,
} from "@crucialy-rich/core";
import { act } from "react";
import { vi } from "vitest";
import { type RichTextEditorProps } from "../src";
import { mountDeletionEditor } from "./deletion-fixture";

export const interactionPoint = { path: [0, 0], offset: 1 };
export function interactionDocument() {
  return createDocument([
    createParagraph([
      createText("正文链接", { link: { href: "https://example.com" } }),
    ]),
    createTaskList([
      createTaskItem([createText("待办")]),
      createTaskItem([createText("已完成")], true),
    ]),
    createImage("https://example.com/a.png", { alt: "示例图片" }),
    createTable(1, 2),
  ]);
}
export function mountInteractionEditor(options: Partial<RichTextEditorProps> = {}) {
  const value = interactionDocument();
  const block = vi.fn(),
    cell = vi.fn();
  const host = mountDeletionEditor(value, interactionPoint, {
    onBlockSelectionChange: block,
    onCellSelectionChange: cell,
    ...options,
  });
  function target(selector: string) {
    return host.editor.querySelector<HTMLElement>(selector)!;
  }
  return {
    ...host,
    value,
    block,
    cell,
    target,
    click(selector: string) {
      act(() => target(selector).click());
    },
  };
}
