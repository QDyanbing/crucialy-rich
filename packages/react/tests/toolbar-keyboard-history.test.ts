// @vitest-environment jsdom
import {
  applyTransaction,
  createDefaultCommandRegistry,
  createDocument,
  createHistorySnapshot,
  createHistoryState,
  createParagraph,
  createText,
  ITALIC_COMMAND_NAME,
  recordHistory,
  undoHistory,
  redoHistory,
} from "@crucialy-rich/core";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FixedToolbar, FloatingToolbar, type ToolbarCommandEvent } from "../src";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});

describe("keyboard Toolbar command History", () => {
  for (const floating of [false, true])
    for (const backward of [false, true]) {
      it.each(["Enter", " "])(
        `records one edit using %s, floating=${floating}, backward=${backward}`,
        (key) => {
          const documentValue = createDocument([
            createParagraph([createText("前文后文")]),
            createParagraph([createText("邻段")]),
          ]);
          const start = { path: [0, 0], offset: 1 },
            end = { path: [0, 0], offset: 3 };
          const selection = {
            anchor: backward ? end : start,
            focus: backward ? start : end,
          };
          const onCommand = vi.fn<(event: ToolbarCommandEvent) => void>();
          const container = document.createElement("div");
          document.body.append(container);
          const root = createRoot(container);
          roots.push(root);
          const props = { document: documentValue, selection, onCommand };
          act(() =>
            root.render(
              floating
                ? createElement(FloatingToolbar, {
                    ...props,
                    anchorRect: {
                      bottom: 100,
                      height: 20,
                      left: 20,
                      top: 80,
                      width: 100,
                    },
                  })
                : createElement(FixedToolbar, props),
            ),
          );
          const buttons = container.querySelectorAll("button");
          act(() => buttons[0]!.focus());
          act(() =>
            buttons[0]!.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "ArrowRight",
                bubbles: true,
                cancelable: true,
              }),
            ),
          );
          expect(document.activeElement).toBe(buttons[1]);
          expect(onCommand).not.toHaveBeenCalled();
          act(() =>
            buttons[1]!.dispatchEvent(
              new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
            ),
          );
          expect(onCommand).not.toHaveBeenCalled();
          act(() => buttons[1]!.click());
          expect(onCommand).toHaveBeenCalledTimes(1);
          const event = onCommand.mock.calls[0]![0];
          expect(event.result.ok).toBe(true);
          expect(event.selection).toEqual(selection);
          const after = applyTransaction(documentValue, event.result.transaction!);
          expect(after.children[0]).toMatchObject({
            type: "paragraph",
            children: [
              createText("前"),
              createText("文后", { italic: true }),
              createText("文"),
            ],
          });
          expect(after.children[1]).toEqual(documentValue.children[1]);
          const history = recordHistory({
            history: createHistoryState(),
            transaction: event.result.transaction!,
            before: createHistorySnapshot(documentValue, event.selection),
            after: createHistorySnapshot(after, event.result.selection),
          });
          expect(history.undoStack).toHaveLength(1);
          const undo = undoHistory(history)!;
          expect(undo.document).toEqual(documentValue);
          expect(undo.selection).toEqual(selection);
          const redo = redoHistory(undo.history)!;
          expect(redo.document).toEqual(after);
          expect(redo.selection).toEqual(event.result.selection);
        },
      );
    }

  it("keeps a failed keyboard activation retryable without changing the range", () => {
    let broken = false;
    const registry = createDefaultCommandRegistry();
    registry.register({
      ...registry.get(ITALIC_COMMAND_NAME)!,
      canExecute() {
        if (broken) throw new Error("Guard failed.");
        return true;
      },
    });
    const value = createDocument([createParagraph([createText("正文")])]);
    const selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 1 },
    };
    const onCommand = vi.fn<(event: ToolbarCommandEvent) => void>();
    const element = document.createElement("div");
    document.body.append(element);
    const root = createRoot(element);
    roots.push(root);
    act(() =>
      root.render(
        createElement(FixedToolbar, {
          document: value,
          selection,
          registry,
          onCommand,
        }),
      ),
    );
    const italic = element.querySelectorAll("button")[1]!;
    act(() => italic.focus());
    broken = true;
    const activate = () =>
      act(() => {
        italic.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
            cancelable: true,
          }),
        );
        italic.click();
      });
    activate();
    expect(onCommand.mock.calls[0]![0].result.status).toBe("failure");
    expect(onCommand.mock.calls[0]![0].result.transaction).toBeUndefined();
    broken = false;
    activate();
    expect(onCommand.mock.calls[1]![0].result.ok).toBe(true);
    expect(onCommand.mock.calls[1]![0].selection).toEqual(selection);
  });
});
