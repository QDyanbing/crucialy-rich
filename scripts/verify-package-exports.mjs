import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicPackages = [
  {
    directory: "packages/core",
    expectedExports: [
      "createCompositionState",
      "startComposition",
      "updateComposition",
      "finishComposition",
      "createDocument",
      "executeCommand",
      "canExecuteCommand",
      "queryCommandState",
      "parseClipboardData",
      "DEFAULT_CLIPBOARD_PARSERS",
      "getAdjacentCellSelection",
      "getClipboardText",
      "getClipboardHtml",
      "domPointToModelPoint",
      "modelPointToDomPoint",
      "createHistoryState",
      "recordHistory",
      "cloneHistoryEntry",
      "getUndoEntry",
      "getRedoEntry",
      "createBackspaceInputTransaction",
      "createDeleteInputTransaction",
      "createSelectionAfterBackspaceInput",
      "createSelectionAfterDeleteInput",
    ],
  },
  {
    directory: "packages/react",
    expectedExports: [
      "FixedToolbar",
      "FloatingSlashMenu",
      "RichTextEditor",
      "SlashMenu",
      "executeSlashCommand",
      "findSlashMenuTrigger",
      "openSlashMenu",
      "moveSlashMenuSelection",
    ],
  },
];

async function verifySlashMenuContract(react) {
  const core = await import(
    pathToFileURL(resolve(repositoryRoot, "packages/core/dist/index.js")).href
  );
  const document = core.createDocument([
    core.createParagraph([core.createText("/h正文")]),
  ]);
  const point = { path: [0, 0], offset: 2 };
  const trigger = react.findSlashMenuTrigger(document, { anchor: point, focus: point });
  const item = {
    id: "heading",
    label: "二级标题",
    commandName: core.SET_HEADING_COMMAND_NAME,
    payload: { level: 2 },
  };
  const registry = core.createDefaultCommandRegistry();
  const changed = core.createDocument([
    core.createParagraph([core.createText("正文内容")]),
  ]);
  const rejected = react.executeSlashCommand(
    item,
    registry,
    { document: changed },
    trigger,
  );
  assert.equal(rejected.result.status, "failure");
  assert.equal(rejected.result.transaction, undefined);
  const event = react.executeSlashCommand(item, registry, { document }, trigger);
  assert.equal(event.result.ok, true);
  assert.deepEqual(
    event.result.transaction.operations.map((op) => op.type),
    ["delete_text", "set_block_type"],
  );
  const after = core.applyTransaction(document, event.result.transaction);
  assert.equal(after.children[0].type, "heading");
  assert.equal(after.children[0].children[0].text, "正文");
  const history = core.recordHistory({
    history: core.createHistoryState(),
    transaction: event.result.transaction,
    before: core.createHistorySnapshot(document),
    after: core.createHistorySnapshot(after, event.result.selection),
  });
  assert.equal(history.undoStack.length, 1);
  assert.deepEqual(core.undoHistory(history).document, document);
  const opened = react.openSlashMenu(trigger);
  const moved = react.moveSlashMenuSelection(opened, "next", 2);
  moved.trigger.range.anchor.path[0] = 99;
  event.trigger.range.focus.offset = 99;
  assert.deepEqual(opened.trigger, trigger);
  assert.equal(trigger.range.focus.offset, 2);
  assert.equal("cloneSlashMenuTrigger" in react, false);
  const require = createRequire(resolve(repositoryRoot, "packages/react/package.json"));
  const { createElement } = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const html = renderToStaticMarkup(
    createElement(
      "div",
      null,
      createElement(react.SlashMenu, { items: [item] }),
      createElement(react.SlashMenu, { items: [item] }),
    ),
  );
  const ids = [...html.matchAll(/ id="([^"]+)"/gu)].map((match) => match[1]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
}

async function verifyNativeInputBinding(react) {
  const require = createRequire(resolve(repositoryRoot, "packages/react/package.json"));
  const { createElement, act } = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  let observed = 0;
  const html = renderToStaticMarkup(
    createElement(react.RichTextEditor, {
      onNativeBeforeInput: () => observed++,
    }),
  );
  assert.equal(observed, 0);
  assert.equal(html.includes("onNativeBeforeInput"), false);

  const dom = new JSDOM("<!doctype html><body></body>");
  const globals = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Element: dom.window.Element,
    Node: dom.window.Node,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previous = new Map(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  try {
    for (const [key, value] of Object.entries(globals))
      Object.defineProperty(globalThis, key, {
        configurable: true,
        writable: true,
        value,
      });
    const { createRoot } = require("react-dom/client");
    const core = await import(
      pathToFileURL(resolve(repositoryRoot, "packages/core/dist/index.js")).href
    );
    for (const type of [
      "deleteContentBackward",
      "deleteContentForward",
      "insertParagraph",
      "insertLineBreak",
    ]) {
      const container = dom.window.document.createElement("div");
      dom.window.document.body.append(container);
      const root = createRoot(container);
      const transactions = [];
      let calls = 0;
      let editor;
      try {
        act(() =>
          root.render(
            createElement(react.RichTextEditor, {
              contentEditable: true,
              defaultValue: core.createDocument([
                core.createParagraph([core.createText("A\u{1f600}B")]),
              ]),
              onNativeBeforeInput: () => calls++,
              onTransaction: (event) => transactions.push(event),
            }),
          ),
        );
        editor = container.firstElementChild;
        editor.focus();
        const text = editor.querySelector("span").firstChild;
        const offset = type === "deleteContentBackward" ? 3 : 1;
        dom.window.getSelection().setBaseAndExtent(text, offset, text, offset);
        const event = new dom.window.InputEvent("beforeinput", {
          inputType: type,
          bubbles: true,
          cancelable: true,
        });
        act(() => editor.dispatchEvent(event));
        assert.equal(event.defaultPrevented, true);
        assert.equal(
          editor.textContent,
          type.startsWith("delete")
            ? "AB"
            : type === "insertLineBreak"
              ? "A\n\u{1f600}B"
              : "A\u{1f600}B",
        );
        assert.equal(
          editor.querySelectorAll("p").length,
          type === "insertParagraph" ? 2 : 1,
        );
        assert.equal(calls, 1);
        assert.equal(transactions.length, 1);
        assert.equal(
          transactions[0].transaction.operations[0].type,
          type.startsWith("delete")
            ? "delete_text"
            : type === "insertParagraph"
              ? "split_block"
              : "insert_text",
        );
        if (type === "insertLineBreak") {
          assert.equal(transactions[0].inputType, "insertLineBreak");
          assert.equal("batch" in transactions[0], false);
          assert.deepEqual(transactions[0].selection.anchor, {
            path: [0, 0],
            offset: 2,
          });
        }
      } finally {
        act(() => root.unmount());
      }
      editor.dispatchEvent(
        new dom.window.InputEvent("beforeinput", {
          inputType: type,
          bubbles: true,
          cancelable: true,
        }),
      );
      assert.equal(calls, 1);
    }
    for (const mode of ["commit", "cancel", "replace"]) {
      const container = dom.window.document.createElement("div");
      dom.window.document.body.append(container);
      const root = createRoot(container);
      const transactions = [];
      const initial = core.createDocument([
        core.createParagraph([core.createText("AB")]),
      ]);
      const render = (props = {}) =>
        act(() =>
          root.render(
            createElement(react.RichTextEditor, {
              contentEditable: true,
              defaultValue: initial,
              onTransaction: (event) => transactions.push(event),
              onCompositionEnd: (event) => {
                if (mode === "cancel") event.preventDefault();
              },
              onCompositionStateChange: (state) => {
                state.active = false;
                if (state.startSelection) state.startSelection.anchor.path[0] = 99;
              },
              ...props,
            }),
          ),
        );
      try {
        render();
        const editor = container.firstElementChild;
        editor.focus();
        const text = editor.querySelector("span").firstChild;
        dom.window.getSelection().setBaseAndExtent(text, 1, text, 1);
        const compose = (type, data = "") =>
          act(() =>
            editor.dispatchEvent(
              new dom.window.CompositionEvent(type, {
                data,
                bubbles: true,
                cancelable: true,
              }),
            ),
          );
        compose("compositionstart");
        compose("compositionupdate", "候选");
        assert.equal(editor.getAttribute("data-composing"), "true");
        assert.equal(transactions.length, 0);
        if (mode === "replace")
          render({
            value: core.createDocument([core.createParagraph([core.createText("CD")])]),
          });
        compose("compositionend", "中");
        assert.equal(editor.getAttribute("data-composing"), "false");
        assert.equal(
          editor.textContent,
          mode === "commit" ? "A中B" : mode === "replace" ? "CD" : "AB",
        );
        assert.equal(transactions.length, mode === "commit" ? 1 : 0);
        if (mode === "commit")
          assert.equal(transactions[0].inputType, "insertCompositionText");
      } finally {
        act(() => root.unmount());
      }
    }
  } finally {
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

function verifyCompositionSnapshots(core) {
  const range = {
    anchor: { path: [0, 0], offset: 1 },
    focus: { path: [0, 0], offset: 2 },
  };
  const previous = core.startComposition(range);
  const next = core.updateComposition(previous, "中文");
  previous.startSelection.anchor.path[0] = 99;
  previous.selection.focus.offset = 99;
  assert.deepEqual(next.startSelection, range);
  assert.deepEqual(next.selection, range);
  assert.deepEqual(core.finishComposition(next), { data: "中文", selection: range });
}

function verifyClipboardFiltering(core) {
  const point = { path: [0, 0, 0, 0, 0], offset: 0 };
  const document = core.createDocument([core.createTable(1, 2)]);
  const context = { document, selection: { anchor: point, focus: point } };
  const source = {
    types: ["text/markdown", "text/html", "text/plain"],
    getData: (type) =>
      type === "text/markdown"
        ? "# markdown"
        : type === "text/html"
          ? "<p>html</p>"
          : "plain",
  };
  const fragment = core.parseClipboardData(
    source,
    core.DEFAULT_CLIPBOARD_PARSERS,
    (candidate) =>
      core.canExecutePasteCommand({ context, payload: { fragment: candidate } }),
  );
  assert.equal(fragment?.mimeType, "text/plain");
  const result = core.pasteCommand.execute({ context, payload: { fragment } });
  assert.equal(result.status, "success");
  const next = core.applyTransaction(document, result.transaction);
  assert.equal(core.getNodeAtPath(next, point.path)?.text, "plain");
  assert.equal(core.validateDocument(next).valid, true);
  assert.equal(
    core.parseClipboardData(source, core.DEFAULT_CLIPBOARD_PARSERS)?.mimeType,
    "text/markdown",
  );
}

function verifyOfficePaste(core) {
  const html =
    '<html><head><meta name="Generator" content="Microsoft Word 16"></head><body><h1>rich</h1></body></html>';
  const formats = {
    "text/html": html,
    "text/markdown": "# rich",
    "text/plain": "line1\r\nline2",
  };
  const source = {
    types: Object.keys(formats),
    getData: (type) => formats[type] ?? "",
  };
  const fragment = core.parseClipboardData(source, core.DEFAULT_CLIPBOARD_PARSERS);
  assert.deepEqual(fragment, core.parsePlainText(formats["text/plain"]));
  assert.equal(core.parseHtml(html), undefined);
  assert.equal(core.parseMarkdown(html), undefined);
  assert.equal(
    core.parseClipboardData(
      { types: ["text/html", "text/markdown"], getData: source.getData },
      core.DEFAULT_CLIPBOARD_PARSERS,
    ),
    undefined,
  );

  const document = core.createDocument([
    core.createParagraph([core.createText("old")]),
  ]);
  const result = core.pasteCommand.execute({
    context: {
      document,
      selection: {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 3 },
      },
    },
    payload: { fragment },
  });
  assert.equal(result.status, "success");
  const after = core.applyTransaction(document, result.transaction);
  assert.deepEqual(
    after,
    core.createDocument([
      core.createParagraph([core.createText("line1")]),
      core.createParagraph([core.createText("line2")]),
    ]),
  );
  assert.equal(core.validateDocument(after).valid, true);
  assert.deepEqual(result.selection.anchor, { path: [1, 0], offset: 5 });

  let richParserCalls = 0;
  const parsers = [
    {
      mimeType: "text/html",
      parse: () => {
        richParserCalls++;
        return core.parsePlainText("wrong");
      },
    },
    { mimeType: "text/plain", parse: () => undefined },
    core.plainTextClipboardParser,
  ];
  assert.deepEqual(core.parseClipboardData(source, parsers), fragment);
  assert.equal(richParserCalls, 0);
}

function verifyMixedImagePaste(core) {
  const document = core.createDocument([
    core.createParagraph([core.createText("old")]),
  ]);
  const selection = {
    anchor: { path: [0, 0], offset: 1 },
    focus: { path: [0, 0], offset: 2 },
  };
  for (const trailing of [false, true]) {
    const fragments = [
      core.parseHtml(
        `<p><b>before</b><span><img src="https://example.com/mixed.png" alt="image"></span>${trailing ? "" : "<i>after</i>"}</p>`,
      ),
      core.parseMarkdown(
        `**before**![image](https://example.com/mixed.png)${trailing ? "" : "*after*"}`,
      ),
    ];
    for (const fragment of fragments) {
      assert.deepEqual(
        fragment.blocks.map((block) => block.type),
        trailing ? ["paragraph", "image"] : ["paragraph", "image", "paragraph"],
      );
      const result = core.pasteCommand.execute({
        context: { document, selection },
        payload: { fragment },
      });
      assert.equal(result.status, "success");
      const after = core.applyTransaction(document, result.transaction);
      assert.equal(core.validateDocument(after).valid, true);
      assert.deepEqual(
        after.children[2],
        core.createImage("https://example.com/mixed.png", { alt: "image" }),
      );
      assert.deepEqual(result.selection.anchor, {
        path: [3, 0],
        offset: trailing ? 0 : 5,
      });
      assert.equal(core.isValidPoint(after, result.selection.anchor), true);
      const history = core.recordHistory({
        history: core.createHistoryState(),
        before: core.createHistorySnapshot(document, selection),
        after: core.createHistorySnapshot(after, result.selection),
        transaction: result.transaction,
      });
      assert.equal(history.undoStack.length, 1);
      const undone = core.undoHistory(history);
      assert.deepEqual(undone.document, document);
      const redone = core.redoHistory(undone.history);
      assert.deepEqual(redone.document, after);
      assert.deepEqual(redone.selection, result.selection);
    }
  }
}

function verifyCharacterDeletion(core) {
  assert.equal("createCharacterDeletionRange" in core, false);
  for (const cluster of [
    "\u{1f600}",
    "e\u0301",
    "\u{1f469}\u200d\u{1f4bb}",
    "\u{1f1e8}\u{1f1f3}",
  ]) {
    for (const backward of [true, false]) {
      const document = core.createDocument([
        core.createParagraph([core.createText(`A${cluster}B`)]),
      ]);
      const point = { path: [0, 0], offset: backward ? 1 + cluster.length : 1 };
      const selection = { anchor: point, focus: point };
      const input = { document, selection };
      const transaction = backward
        ? core.createBackspaceInputTransaction(input)
        : core.createDeleteInputTransaction(input);
      const after = core.applyTransaction(document, transaction);
      const nextSelection = backward
        ? core.createSelectionAfterBackspaceInput(input)
        : core.createSelectionAfterDeleteInput(input);
      assert.equal(after.children[0].children[0].text, "AB");
      assert.deepEqual(nextSelection.anchor, { path: [0, 0], offset: 1 });
      assert.equal(core.isValidPoint(after, nextSelection.anchor), true);
      const history = core.recordHistory({
        history: core.createHistoryState(),
        before: core.createHistorySnapshot(document, selection),
        after: core.createHistorySnapshot(after, nextSelection),
        transaction,
      });
      const undone = core.undoHistory(history);
      assert.deepEqual(undone.document, document);
      assert.deepEqual(undone.selection, selection);
      assert.deepEqual(core.redoHistory(undone.history).document, after);
    }
  }
  const document = core.createDocument([
    core.createParagraph([
      core.createText("Ae", { bold: true }),
      core.createText("\u0301", { italic: true }),
      core.createText("B"),
    ]),
    core.createDivider(),
  ]);
  const point = { path: [0, 0], offset: 1 };
  const after = core.applyTransaction(
    document,
    core.createDeleteInputTransaction({
      document,
      selection: { anchor: point, focus: point },
    }),
  );
  assert.deepEqual(
    after.children[0],
    core.createParagraph([core.createText("A", { bold: true }), core.createText("B")]),
  );
  assert.equal(after.children[1].type, "divider");
  const invalid = { path: [0, 0], offset: 99 };
  assert.deepEqual(
    core.createDeleteInputTransaction({
      document,
      selection: { anchor: invalid, focus: invalid },
    }).operations,
    [],
  );
  assert.deepEqual(
    core.createBackspaceInputTransaction({
      document,
      selection: { anchor: invalid, focus: invalid },
    }).operations,
    [],
  );
}

function verifyExtensionFailureBoundaries(core) {
  let executions = 0;
  const input = { context: { document: core.createDocument() } };
  const registry = core.createCommandRegistry([
    {
      name: "broken",
      canExecute() {
        throw new Error("Guard failed.");
      },
      execute() {
        executions++;
        return core.createCommandSuccess("broken");
      },
    },
  ]);
  assert.equal(core.canExecuteCommand(registry, "broken", input), false);
  assert.deepEqual(core.executeCommand(registry, "broken", input), {
    commandName: "broken",
    ok: false,
    status: "failure",
    reason: "Guard failed.",
  });
  assert.equal(core.queryCommandState(registry, "broken", input).disabled, true);
  assert.equal(executions, 0);
  const unavailable = {
    ...registry,
    get() {
      throw new Error("Lookup failed.");
    },
  };
  assert.equal(core.canExecuteCommand(unavailable, "broken", input), false);
  assert.equal(core.executeCommand(unavailable, "broken", input).status, "failure");
  assert.equal(core.queryCommandState(unavailable, "broken", input).registered, false);
  const reads = [];
  assert.equal(
    core.parseClipboardData(
      {
        types: ["text/html", "text/plain"],
        getData(mime) {
          reads.push(mime);
          throw new Error("Clipboard unavailable.");
        },
      },
      core.DEFAULT_CLIPBOARD_PARSERS,
    ),
    undefined,
  );
  assert.deepEqual(reads, ["text/html"]);
  const source = { types: ["text/plain"], getData: () => "plain" };
  assert.equal(
    core.parseClipboardData(source, [
      {
        mimeType: "text/plain",
        parse() {
          throw new Error("Parser failed.");
        },
      },
    ]),
    undefined,
  );
  assert.equal(
    core.parseClipboardData(source, core.DEFAULT_CLIPBOARD_PARSERS, () => {
      throw new Error("Filter failed.");
    }),
    undefined,
  );
  assert.equal(
    core.parseClipboardData(source, core.DEFAULT_CLIPBOARD_PARSERS).mimeType,
    "text/plain",
  );
  assert.equal("getCommandErrorReason" in core, false);
}

function verifyDomBoundaryMapping(core) {
  const model = core.createDocument([
    core.createParagraph([core.createText("A\ud83d\ude00B", { bold: true })]),
    core.createTaskList([core.createTaskItem([core.createText("task")], true)]),
  ]);
  const dom = new JSDOM(core.renderNodeToHtml(core.renderDocument(model)));
  try {
    const root = dom.window.document.body;
    const leaf = root.querySelector("strong");
    const suffix = leaf.firstChild.splitText(1);
    assert.deepEqual(core.domPointToModelPoint(model, { node: leaf, offset: 2 }), {
      path: [0, 0],
      offset: 4,
    });
    assert.deepEqual(core.domPointToModelPoint(model, { node: suffix, offset: 2 }), {
      path: [0, 0],
      offset: 3,
    });
    assert.deepEqual(
      core.modelPointToDomPoint(root, model, { path: [0, 0], offset: 3 }),
      { node: suffix, offset: 2 },
    );
    assert.equal(
      core.domPointToModelPoint(model, { node: leaf, offset: 3 }),
      undefined,
    );
    const item = root.querySelector("li");
    assert.deepEqual(core.domPointToModelPoint(model, { node: item, offset: 1 }), {
      path: [1, 0, 0],
      offset: 0,
    });
    assert.deepEqual(core.domPointToModelPoint(model, { node: item, offset: 2 }), {
      path: [1, 0, 0],
      offset: 4,
    });
    assert.equal(
      core.domPointToModelPoint(model, { node: item.firstChild, offset: 0 }),
      undefined,
    );
  } finally {
    dom.window.close();
  }
}

function verifyHistoryOwnership(core) {
  function entry(batch) {
    const document = core.createDocument([
      core.createParagraph([
        core.createText("original", { link: { href: "https://example.com/" } }),
      ]),
    ]);
    const point = { path: [0, 0], offset: 1 };
    const snapshot = core.createHistorySnapshot(document, {
      anchor: point,
      focus: point,
    });
    return {
      before: snapshot,
      after: snapshot,
      batch,
      transaction: core.createTransaction([core.createInsertTextOperation(point, "x")]),
    };
  }
  const source = entry("typing");
  const initialized = core.createHistoryState([source, source], [source]);
  const expected = structuredClone(initialized);
  source.before.document.children[0].children[0].marks.link.href =
    "https://changed.test/";
  source.transaction.operations[0].point.path[0] = 99;
  assert.deepEqual(initialized, expected);
  initialized.undoStack[0].after.selection.focus.offset = 99;
  assert.deepEqual(initialized.undoStack[1], expected.undoStack[1]);
  assert.deepEqual(initialized.redoStack[0], expected.redoStack[0]);
  assert.equal(core.getUndoEntry(initialized), initialized.undoStack.at(-1));
  assert.equal(core.getRedoEntry(initialized), initialized.redoStack.at(-1));

  for (const policy of ["batch", "adjacent"]) {
    for (const mode of ["empty", "append", "merge"]) {
      const history = core.createHistoryState(
        [entry("older"), entry("typing")],
        mode === "empty" ? [entry("redo")] : [],
      );
      const input = entry(mode === "append" ? "new" : "typing");
      if (mode === "empty") input.transaction = core.createTransaction();
      const next = core.recordHistory({ history, mergePolicy: policy, ...input });
      const detached = structuredClone(next);
      history.undoStack[0].before.document.children[0].children[0].text = "changed";
      history.undoStack[1].transaction.operations.length = 0;
      if (history.redoStack.length)
        history.redoStack[0].before.selection.anchor.path[0] = 99;
      assert.deepEqual(next, detached);
      assert.equal(next.undoStack.length, mode === "append" ? 3 : 2);
      assert.equal(next.redoStack.length, mode === "empty" ? 1 : 0);
      const undone = core.undoHistory(next);
      undone.document.children[0].children[0].text = "host edit";
      undone.entry.before.selection.anchor.path[0] = 99;
      assert.deepEqual(next, detached);
      const redone = core.redoHistory(undone.history);
      assert.deepEqual(redone.document, detached.undoStack.at(-1).after.document);
    }
  }
}

function verifyHistoryBlockSelection(core) {
  const document = core.createDocument([core.createImage("https://example.com/a.png")]);
  const blockSelection = core.createBlockSelection([0]);
  const cut = core.deleteImageCommand.execute({
    context: { document },
    payload: { selection: blockSelection },
  });
  const after = core.applyTransaction(document, cut.transaction);
  const history = core.recordHistory({
    history: core.createHistoryState(),
    transaction: cut.transaction,
    before: core.createHistorySnapshot(document, undefined, blockSelection),
    after: core.createHistorySnapshot(after, cut.selection),
  });
  blockSelection.path[0] = 9;
  const undone = core.undoCommand.execute({
    context: { document: after },
    payload: { history },
  });
  assert.equal(undone.ok, true);
  assert.deepEqual(undone.blockSelection, core.createBlockSelection([0]));
  assert.equal(undone.selection, undefined);
  const redone = core.redoCommand.execute({
    context: { document },
    payload: { history: undone.history },
  });
  assert.deepEqual(redone.document, after);
  assert.deepEqual(redone.selection, cut.selection);
  assert.equal(Object.hasOwn(redone, "blockSelection"), false);
  assert.deepEqual(
    core.undoHistory(history).blockSelection,
    core.createBlockSelection([0]),
  );
  assert.equal(
    core.canMergeHistoryEntries(
      { ...history.undoStack[0], batch: "typing" },
      { ...history.undoStack[0], batch: "typing" },
    ),
    false,
  );
}

function verifyCellNavigation(core) {
  const document = core.createDocument([
    core.createParagraph(),
    core.createTable(2, 2),
  ]);
  const original = structuredClone(document);
  const range = (row, column, offset = 0) => {
    const point = { path: [1, row, column, 0, 0], offset };
    return { anchor: point, focus: { ...point, path: [...point.path] } };
  };
  const next = core.getAdjacentCellSelection(document, range(0, 1));
  assert.deepEqual(next, range(1, 0));
  assert.deepEqual(
    core.getAdjacentCellSelection(document, next, "previous"),
    range(0, 1),
  );
  assert.equal(core.getAdjacentCellSelection(document, range(1, 1)), undefined);
  assert.equal(
    core.getAdjacentCellSelection(document, range(0, 0), "previous"),
    undefined,
  );
  assert.notEqual(next.anchor.path, next.focus.path);
  assert.equal(core.isValidPoint(document, next.anchor), true);
  assert.deepEqual(document, original);
  const input = core.insertTextCommand.execute({
    context: { document, selection: next },
    payload: { text: "typed" },
  });
  assert.equal(input.status, "success");
  const after = core.applyTransaction(document, input.transaction);
  const history = core.recordHistory({
    history: core.createHistoryState(),
    before: core.createHistorySnapshot(document, next),
    after: core.createHistorySnapshot(after, input.selection),
    transaction: input.transaction,
  });
  assert.equal(history.undoStack.length, 1);
  const undone = core.undoHistory(history);
  assert.deepEqual(undone.document, original);
  assert.deepEqual(undone.selection, next);
  assert.deepEqual(core.redoHistory(undone.history).document, after);
}

function verifyClipboardText(core) {
  const document = core.createDocument([
    core.createParagraph([core.createText("abc")]),
    core.createParagraph([core.createText("xyz")]),
  ]);
  const selection = {
    anchor: { path: [1, 0], offset: 1 },
    focus: { path: [0, 0], offset: 1 },
  };
  const text = core.getClipboardText(document, selection);
  assert.equal(text, "bc\nx");
  assert.equal(
    core.getClipboardText(document, {
      anchor: selection.anchor,
      focus: selection.anchor,
    }),
    undefined,
  );
  const cut = core.deleteSelectionCommand.execute({ context: { document, selection } });
  assert.equal(cut.ok, true);
  const after = core.applyTransaction(document, cut.transaction);
  const history = core.recordHistory({
    history: core.createHistoryState(),
    transaction: cut.transaction,
    before: core.createHistorySnapshot(document, selection),
    after: core.createHistorySnapshot(after, cut.selection),
  });
  const undone = core.undoHistory(history);
  assert.deepEqual(undone.document, document);
  assert.deepEqual(undone.selection, selection);
  assert.deepEqual(core.redoHistory(undone.history).document, after);
  const pasted = core.pasteCommand.execute({
    context: { document: after, selection: cut.selection },
    payload: { fragment: core.parsePlainText(text) },
  });
  assert.equal(pasted.ok, true);
  assert.deepEqual(core.applyTransaction(after, pasted.transaction), document);
}

function verifyClipboardHtml(core) {
  const document = core.createDocument([
    core.createParagraph([
      core.createText("rich<&", {
        bold: true,
        code: true,
        italic: true,
        textColor: "#123456",
        link: {
          href: "https://example.com/",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    ]),
  ]);
  const selection = {
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [0, 0], offset: 6 },
  };
  const html = core.getClipboardHtml(document, selection);
  assert.ok(html.includes("<code>rich&lt;&amp;</code>"));
  assert.equal(html.includes("data-crucialy"), false);
  assert.deepEqual(core.parseHtml(html).blocks, document.children);
  assert.equal(core.getClipboardText(document, selection), "rich<&");
  const table = core.createTable(1, 2);
  assert.deepEqual(
    core.parseHtml(
      core.getClipboardHtml(core.createDocument([table]), {
        anchor: { path: [0, 0, 0, 0, 0], offset: 0 },
        focus: { path: [0, 0, 1, 0, 0], offset: 0 },
      }),
    ).blocks,
    [table],
  );
}

function verifyImageBlockClipboard(core) {
  const image = core.createImage("https://example.com/block.png", {
    alt: "图片",
    width: 120,
    height: 80,
  });
  const document = core.createDocument([
    core.createParagraph([core.createText("未选文字")]),
    image,
  ]);
  const selection = core.createBlockSelection([1]);
  const html = core.getClipboardHtml(document, selection);
  assert.deepEqual(core.parseHtml(html).blocks, [image]);
  assert.equal(/未选|data-|aria-|contenteditable|status=/.test(html), false);
  assert.equal(
    core.getClipboardHtml(document, core.createBlockSelection([0])),
    undefined,
  );
  assert.equal(
    core.getClipboardHtml(document, core.createBlockSelection([9])),
    undefined,
  );
  const temporary = core.createDocument([
    core.createImage("blob:https://example.com/local"),
  ]);
  assert.equal(
    core.getClipboardHtml(temporary, core.createBlockSelection([0])),
    undefined,
  );
}

function verifyImageClipboard(core) {
  const image = core.createImage("https://example.com/a.png", {
    alt: "中文图片",
    width: 120,
    height: 80,
  });
  const document = core.createDocument([
    core.createParagraph([core.createText("前甲", { bold: true })]),
    image,
    core.createParagraph([core.createText("乙后", { italic: true })]),
  ]);
  const original = structuredClone(document);
  const anchor = { path: [0, 0], offset: 1 };
  const focus = { path: [2, 0], offset: 1 };
  const html = core.getClipboardHtml(document, { anchor, focus });
  assert.deepEqual(core.parseHtml(html).blocks, [
    core.createParagraph([core.createText("甲", { bold: true })]),
    image,
    core.createParagraph([core.createText("乙", { italic: true })]),
  ]);
  assert.equal(core.getClipboardHtml(document, { anchor: focus, focus: anchor }), html);
  assert.equal(/data-|aria-|contenteditable|status=|class=/i.test(html), false);
  const parsed = core.parseHtml(html).blocks;
  parsed[1].alt = "修改";
  assert.deepEqual(document, original);
  for (const replacement of [
    core.createImage("blob:https://example.com/local"),
    core.createImage(image.src, { status: "loading" }),
    core.createImage("https://user:secret@example.com/a.png"),
  ]) {
    const unsafe = core.createDocument([
      document.children[0],
      replacement,
      document.children[2],
    ]);
    assert.equal(core.getClipboardHtml(unsafe, { anchor, focus }), undefined);
    assert.equal(core.getClipboardText(unsafe, { anchor, focus }), "甲\n\n乙");
  }
}

function verifyMixedClipboard(core) {
  const document = core.createDocument([
    core.createParagraph([core.createText("前甲", { bold: true })]),
    core.createOrderedList([core.createListItem([core.createText("列表")])], 7),
    core.createDivider(),
    core.createTable(1, 2),
    core.createParagraph([core.createText("乙后", { italic: true })]),
  ]);
  const original = structuredClone(document);
  const anchor = { path: [0, 0], offset: 1 };
  const focus = { path: [4, 0], offset: 1 };
  const html = core.getClipboardHtml(document, { anchor, focus });
  const expected = structuredClone(document.children);
  expected[0] = core.createParagraph([core.createText("甲", { bold: true })]);
  expected[4] = core.createParagraph([core.createText("乙", { italic: true })]);
  assert.deepEqual(core.parseHtml(html).blocks, expected);
  assert.equal(core.getClipboardHtml(document, { anchor: focus, focus: anchor }), html);
  assert.equal(/data-|aria-|contenteditable|class=/i.test(html), false);
  const parsed = core.parseHtml(html).blocks;
  parsed[1].children[0].children[0].text = "修改";
  assert.deepEqual(document, original);
  const withImage = structuredClone(document);
  withImage.children[2] = core.createImage("blob:https://example.com/local");
  assert.equal(core.getClipboardHtml(withImage, { anchor, focus }), undefined);
  assert.equal(
    core.getClipboardText(withImage, { anchor, focus }),
    core.getClipboardText(document, { anchor, focus }),
  );
}

function verifyTableClipboard(core) {
  const table = core.createTable(3, 3);
  for (const [rowIndex, row] of table.children.entries())
    for (const [column, cell] of row.children.entries())
      cell.children = [
        core.createParagraph([
          core.createText(`${rowIndex}:${column}`, { bold: true }),
        ]),
      ];
  const document = core.createDocument([table]);
  const original = structuredClone(document);
  for (const [selection, expected] of [
    [
      {
        anchor: { path: [0, 1, 1, 0, 0], offset: 1 },
        focus: { path: [0, 1, 2, 0, 0], offset: 2 },
      },
      [":1", "1:"],
    ],
    [
      {
        anchor: { path: [0, 1, 0, 0, 0], offset: 0 },
        focus: { path: [0, 2, 2, 0, 0], offset: 3 },
      },
      ["1:0", "1:1", "1:2", "2:0", "2:1", "2:2"],
    ],
  ]) {
    const html = core.getClipboardHtml(document, selection);
    const parsed = core.parseHtml(html).blocks[0];
    assert.equal(parsed.type, "table");
    assert.deepEqual(
      parsed.children.flatMap((row) =>
        row.children.map((cell) => cell.children[0].children[0].text),
      ),
      expected,
    );
    assert.equal(/data-|aria-|contenteditable|class=/i.test(html), false);
    assert.deepEqual(
      core.parseHtml(
        core.getClipboardHtml(document, {
          anchor: selection.focus,
          focus: selection.anchor,
        }),
      ).blocks,
      [parsed],
    );
    parsed.children[0].children[0].children[0].children[0].text = "修改";
    assert.deepEqual(document, original);
  }
  assert.equal(
    core.getClipboardHtml(document, {
      anchor: { path: [0, 0, 1, 0, 0], offset: 0 },
      focus: { path: [0, 1, 1, 0, 0], offset: 3 },
    }),
    undefined,
  );
}

function verifyListClipboard(core) {
  const entries = ["未选", "甲乙", "丙丁"].map((text) =>
    core.createListItem([core.createText(text, { bold: true })]),
  );
  const lists = [
    core.createOrderedList(entries, 5),
    core.createTaskList(
      entries.map((item, index) => core.createTaskItem(item.children, index === 1)),
    ),
  ];
  const selection = {
    anchor: { path: [0, 1, 0], offset: 1 },
    focus: { path: [0, 2, 0], offset: 1 },
  };
  for (const list of lists) {
    const document = core.createDocument([list]);
    const original = structuredClone(document);
    const html = core.getClipboardHtml(document, selection);
    const parsed = core.parseHtml(html).blocks[0];
    assert.equal(parsed.type, list.type);
    assert.equal(core.getClipboardText(document, selection), "乙\n丙");
    assert.deepEqual(
      parsed.children.map((item) => item.children.map((node) => node.text).join("")),
      ["乙", "丙"],
    );
    if (parsed.type === "orderedList") assert.equal(parsed.start, 6);
    if (parsed.type === "taskList")
      assert.deepEqual(
        parsed.children.map((item) => item.checked),
        [true, false],
      );
    assert.equal(/未选|data-|aria-|contenteditable/i.test(html), false);
    assert.deepEqual(document, original);
  }
}

function verifyHistoryMergePolicy(core) {
  const initial = core.createDocument([
    core.createParagraph([core.createText("abcd")]),
  ]);
  const caret = (offset) => ({
    anchor: { path: [0, 0], offset },
    focus: { path: [0, 0], offset },
  });
  function type(document, history, offset, text, mergePolicy) {
    const selection = caret(offset);
    const result = core.insertTextCommand.execute({
      context: { document, selection },
      payload: { text },
    });
    assert.equal(result.status, "success");
    const after = core.applyTransaction(document, result.transaction);
    return {
      document: after,
      history: core.recordHistory({
        history,
        batch: "typing",
        ...(mergePolicy ? { mergePolicy } : {}),
        before: core.createHistorySnapshot(document, selection),
        after: core.createHistorySnapshot(after, result.selection),
        transaction: result.transaction,
      }),
    };
  }
  for (const policy of [undefined, "batch", "adjacent"]) {
    const first = type(initial, core.createHistoryState(), 1, "x", policy);
    const contiguous = type(first.document, first.history, 2, "y", policy);
    assert.equal(contiguous.history.undoStack.length, 1);
    const jumped = type(contiguous.document, contiguous.history, 0, "z", policy);
    assert.equal(jumped.history.undoStack.length, policy === "adjacent" ? 2 : 1);
    const undone = core.undoHistory(jumped.history);
    assert.deepEqual(
      undone.document,
      policy === "adjacent" ? contiguous.document : initial,
    );
    assert.deepEqual(core.redoHistory(undone.history).document, jumped.document);
    assert.equal("mergePolicy" in jumped.history.undoStack[0], false);
    if (policy === "adjacent") {
      const branch = type(undone.document, undone.history, 3, "n", policy);
      assert.equal(branch.history.undoStack.length, 2);
      assert.equal(branch.history.redoStack.length, 0);
      assert.deepEqual(core.undoHistory(branch.history).document, contiguous.document);
    }
  }
}

function verifyCodePaste(core) {
  const document = core.createDocument([
    core.createCodeBlock([core.createText("pre"), core.createText("tail")]),
  ]);
  const point = { path: [0, 1], offset: 0 };
  const context = { document, selection: { anchor: point, focus: point } };
  const text = "line1\n\tline2";
  const fragment = core.parseClipboardData(
    {
      types: ["text/html", "text/plain"],
      getData: (type) => (type === "text/html" ? "<p>rich</p>" : "line1\r\n\tline2"),
    },
    core.DEFAULT_CLIPBOARD_PARSERS,
    (candidate) =>
      core.canExecutePasteCommand({ context, payload: { fragment: candidate } }),
  );
  assert.equal(fragment?.mimeType, "text/plain");
  const result = core.pasteCommand.execute({ context, payload: { fragment } });
  assert.equal(result.status, "success");
  assert.deepEqual(
    result.transaction.operations.map((operation) => operation.type),
    ["insert_text"],
  );
  const next = core.applyTransaction(document, result.transaction);
  assert.deepEqual(
    next,
    core.createDocument([core.createCodeBlock([core.createText(`pre${text}tail`)])]),
  );
  assert.deepEqual(result.selection.anchor, { path: [0, 0], offset: 3 + text.length });
  assert.equal(core.isValidPoint(next, result.selection.anchor), true);
  assert.equal(
    core.canExecutePasteCommand({
      context,
      payload: {
        fragment: {
          mimeType: "text/plain",
          blocks: [core.createHeading(1, [core.createText("invalid")])],
        },
      },
    }),
    false,
  );
}

for (const packageConfig of publicPackages) {
  const packageRoot = resolve(repositoryRoot, packageConfig.directory);
  const manifest = JSON.parse(
    await readFile(resolve(packageRoot, "package.json"), "utf8"),
  );
  const rootExport = manifest.exports?.["."];

  assert.equal(manifest.private, undefined, `${manifest.name} must be public.`);
  assert.equal(
    manifest.sideEffects,
    false,
    `${manifest.name} must be side-effect free.`,
  );
  assert.equal(rootExport?.import, manifest.main);
  assert.equal(rootExport?.default, manifest.main);
  assert.equal(rootExport?.types, manifest.types);

  const runtimePath = resolve(packageRoot, manifest.main);
  const declarationPath = resolve(packageRoot, manifest.types);

  await access(runtimePath);
  await access(declarationPath);

  const runtime = await import(pathToFileURL(runtimePath).href);
  const declarations = await readFile(declarationPath, "utf8");

  for (const exportName of packageConfig.expectedExports) {
    assert.ok(exportName in runtime, `${manifest.name} is missing ${exportName}.`);
    assert.ok(
      declarations.includes(exportName),
      `${manifest.name} declarations are missing ${exportName}.`,
    );
  }

  if (packageConfig.directory === "packages/core") {
    verifyCompositionSnapshots(runtime);
    verifyCharacterDeletion(runtime);
    verifyExtensionFailureBoundaries(runtime);
    verifyDomBoundaryMapping(runtime);
    assert.match(
      declarations,
      /domPointToModelPoint\(document: DocumentNode, domPoint: DomPoint\)/,
    );
    assert.match(
      declarations,
      /modelPointToDomPoint\(root: ParentNode, document: DocumentNode, point: Point\)/,
    );
    verifyClipboardFiltering(runtime);
    verifyCodePaste(runtime);
    verifyOfficePaste(runtime);
    verifyMixedImagePaste(runtime);
    verifyCellNavigation(runtime);
    verifyHistoryMergePolicy(runtime);
    verifyHistoryOwnership(runtime);
    verifyHistoryBlockSelection(runtime);
    for (const name of ["HistorySnapshot", "HistoryChange", "CommandResult"]) {
      assert.match(
        declarations,
        new RegExp(`interface ${name} \\{[^}]*blockSelection\\?: BlockSelection`),
      );
    }
    assert.match(
      declarations,
      /createHistorySnapshot\(document: DocumentNode, selection\?: RangeSelection, blockSelection\?: BlockSelection\)/,
    );
    verifyClipboardText(runtime);
    verifyClipboardHtml(runtime);
    verifyListClipboard(runtime);
    verifyTableClipboard(runtime);
    verifyMixedClipboard(runtime);
    verifyImageClipboard(runtime);
    verifyImageBlockClipboard(runtime);
    assert.match(
      declarations,
      /getClipboardHtml\(document: DocumentNode, selection: RangeSelection \| BlockSelection\)/,
    );
    assert.ok(declarations.includes("CellNavigationDirection"));
    assert.ok(declarations.includes("HistoryMergePolicy"));
    assert.ok(declarations.includes("mergePolicy?: HistoryMergePolicy"));
  }

  if (packageConfig.directory === "packages/react") {
    await verifySlashMenuContract(runtime);
    assert.ok(declarations.includes('"insertLineBreak"'));
    assert.match(declarations, /onNativeBeforeInput\?: \(event: InputEvent\) => void/);
    await verifyNativeInputBinding(runtime);
    assert.ok(declarations.includes('"onCopy"'));
    assert.ok(declarations.includes('"onCut"'));
    assert.ok(declarations.includes('"deleteByCut"'));
    assert.match(declarations, /beforeSelection\?: RangeSelection/);
    assert.match(declarations, /beforeBlockSelection\?: BlockSelection/);
    assert.ok(declarations.includes('clipboardFormat?: "plain" | "html"'));
  }

  process.stdout.write(`Verified ${manifest.name}@${manifest.version}\n`);
}
