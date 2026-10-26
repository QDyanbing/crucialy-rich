import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicPackages = [
  {
    directory: "packages/core",
    expectedExports: [
      "createCompositionState",
      "createDocument",
      "executeCommand",
      "parseClipboardData",
      "DEFAULT_CLIPBOARD_PARSERS",
      "getAdjacentCellSelection",
      "getClipboardText",
      "getClipboardHtml",
    ],
  },
  {
    directory: "packages/react",
    expectedExports: ["FixedToolbar", "FloatingSlashMenu", "RichTextEditor"],
  },
];

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
    verifyClipboardFiltering(runtime);
    verifyCodePaste(runtime);
    verifyOfficePaste(runtime);
    verifyMixedImagePaste(runtime);
    verifyCellNavigation(runtime);
    verifyHistoryMergePolicy(runtime);
    verifyClipboardText(runtime);
    verifyClipboardHtml(runtime);
    verifyListClipboard(runtime);
    verifyTableClipboard(runtime);
    assert.ok(declarations.includes("CellNavigationDirection"));
    assert.ok(declarations.includes("HistoryMergePolicy"));
    assert.ok(declarations.includes("mergePolicy?: HistoryMergePolicy"));
  }

  if (packageConfig.directory === "packages/react") {
    assert.ok(declarations.includes('"onCopy"'));
    assert.ok(declarations.includes('"onCut"'));
    assert.ok(declarations.includes('"deleteByCut"'));
    assert.ok(declarations.includes('clipboardFormat?: "plain" | "html"'));
  }

  process.stdout.write(`Verified ${manifest.name}@${manifest.version}\n`);
}
