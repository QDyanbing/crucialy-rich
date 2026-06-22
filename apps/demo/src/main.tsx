import {
  createDocument,
  createParagraph,
  createText,
  getNodeAtPath,
  getTextInRange,
  isValidPoint,
  type Point,
  type RangeSelection,
} from "@crucialy-rich/core";
import { RichTextEditor } from "@crucialy-rich/react";
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

const initialDocument = createDocument([
  createParagraph([createText("Hello crucialy-rich.")]),
  createParagraph([createText("Selection model ready.")]),
]);

const documentPreview = JSON.stringify(initialDocument, null, 2);

function parsePath(value: string): number[] {
  if (value.trim() === "") {
    return [];
  }

  return value.split(",").map((item) => Number(item.trim()));
}

function createPoint(pathValue: string, offsetValue: string): Point {
  return {
    path: parsePath(pathValue),
    offset: Number(offsetValue),
  };
}

function SelectionDebugger() {
  const [anchorPath, setAnchorPath] = useState("0,0");
  const [anchorOffset, setAnchorOffset] = useState("0");
  const [focusPath, setFocusPath] = useState("0,0");
  const [focusOffset, setFocusOffset] = useState("5");

  const selection = useMemo<RangeSelection>(
    () => ({
      anchor: createPoint(anchorPath, anchorOffset),
      focus: createPoint(focusPath, focusOffset),
    }),
    [anchorOffset, anchorPath, focusOffset, focusPath],
  );
  const anchorValid = isValidPoint(initialDocument, selection.anchor);
  const focusValid = isValidPoint(initialDocument, selection.focus);
  const selectedText =
    anchorValid && focusValid ? getTextInRange(initialDocument, selection) : "";
  const anchorNode = getNodeAtPath(initialDocument, selection.anchor.path);

  return (
    <section className="selection-debugger" aria-label="Selection debugger">
      <h2>Selection</h2>

      <div className="control-grid">
        <label>
          <span>Anchor path</span>
          <input
            aria-label="Anchor path"
            value={anchorPath}
            onChange={(event) => setAnchorPath(event.target.value)}
          />
        </label>
        <label>
          <span>Anchor offset</span>
          <input
            aria-label="Anchor offset"
            inputMode="numeric"
            value={anchorOffset}
            onChange={(event) => setAnchorOffset(event.target.value)}
          />
        </label>
        <label>
          <span>Focus path</span>
          <input
            aria-label="Focus path"
            value={focusPath}
            onChange={(event) => setFocusPath(event.target.value)}
          />
        </label>
        <label>
          <span>Focus offset</span>
          <input
            aria-label="Focus offset"
            inputMode="numeric"
            value={focusOffset}
            onChange={(event) => setFocusOffset(event.target.value)}
          />
        </label>
      </div>

      <div
        className="selection-status"
        data-state={anchorValid && focusValid ? "valid" : "invalid"}
      >
        {anchorValid && focusValid ? "Valid selection" : "Invalid selection"}
      </div>

      <div className="selection-result">
        <span>Selected text</span>
        <code aria-label="Selected text">{selectedText || "(empty)"}</code>
      </div>

      <div className="debug-stack">
        <div>
          <h3>Selection JSON</h3>
          <pre aria-label="Selection JSON">{JSON.stringify(selection, null, 2)}</pre>
        </div>
        <div>
          <h3>Anchor node</h3>
          <pre aria-label="Selected node">
            {JSON.stringify(anchorNode ?? null, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing root element.");
}

createRoot(rootElement).render(
  <StrictMode>
    <main className="app-shell" aria-labelledby="page-title">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Demo workspace</p>
          <h1 id="page-title">crucialy-rich</h1>
        </div>
        <span className="status-pill">Scaffold ready</span>
      </header>

      <section className="workspace-grid" aria-label="Editor workspace">
        <div className="editor-surface" aria-label="Editor preview">
          <RichTextEditor className="empty-state" label="Editor shell" />
        </div>

        <aside className="debug-panel" aria-label="Document debug panel">
          <h2>Document JSON</h2>
          <pre>{documentPreview}</pre>
        </aside>
      </section>

      <SelectionDebugger />
    </main>
  </StrictMode>,
);
