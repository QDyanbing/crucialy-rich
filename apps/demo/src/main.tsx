import {
  createDocument,
  createParagraph,
  createText,
  getNodeAtPath,
  getTextInRange,
  isValidPoint,
  normalizeDocument,
  validateDocument,
  type DocumentNode,
  type Point,
  type RangeSelection,
} from "@crucialy-rich/core";
import { RichTextEditor } from "@crucialy-rich/react";
import { StrictMode, useMemo, useState, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

type ModelExampleId = "regular" | "empty" | "invalid";

interface ModelExample {
  id: ModelExampleId;
  label: string;
  value: unknown;
}

const modelExamples: ModelExample[] = [
  {
    id: "regular",
    label: "Regular document",
    value: createDocument([
      createParagraph([createText("Hello crucialy-rich.")]),
      createParagraph([createText("Selection model ready.")]),
    ]),
  },
  {
    id: "empty",
    label: "Empty document",
    value: { type: "document", children: [] },
  },
  {
    id: "invalid",
    label: "Invalid document",
    value: {
      type: "document",
      children: [{ type: "text", text: "Loose text" }],
    },
  },
];

function cloneModelValue(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

function getModelExample(id: ModelExampleId): ModelExample {
  return modelExamples.find((example) => example.id === id) ?? modelExamples[0]!;
}

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

interface SelectionDebuggerProps {
  document: DocumentNode;
}

function SelectionDebugger({ document }: SelectionDebuggerProps) {
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
  const anchorValid = isValidPoint(document, selection.anchor);
  const focusValid = isValidPoint(document, selection.focus);
  const selectedText =
    anchorValid && focusValid ? getTextInRange(document, selection) : "";
  const anchorNode = getNodeAtPath(document, selection.anchor.path);

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

function DemoApp() {
  const [modelExampleId, setModelExampleId] = useState<ModelExampleId>("regular");
  const [documentValue, setDocumentValue] = useState(() =>
    cloneModelValue(getModelExample("regular").value),
  );
  const validation = useMemo(() => validateDocument(documentValue), [documentValue]);
  const normalizedDocument = useMemo(
    () => normalizeDocument(documentValue),
    [documentValue],
  );
  const documentPreview = useMemo(
    () => JSON.stringify(documentValue, null, 2),
    [documentValue],
  );

  function handleModelExampleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextExampleId = event.target.value as ModelExampleId;

    setModelExampleId(nextExampleId);
    setDocumentValue(cloneModelValue(getModelExample(nextExampleId).value));
  }

  function handleNormalize() {
    setDocumentValue(normalizeDocument(documentValue));
  }

  return (
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
          <div className="panel-header">
            <h2>Document JSON</h2>
            <span
              aria-label="Model validation status"
              className="state-pill"
              data-state={validation.valid ? "valid" : "invalid"}
            >
              {validation.valid ? "Valid" : "Invalid"}
            </span>
          </div>

          <div className="model-controls" aria-label="Model controls">
            <label>
              <span>Model example</span>
              <select
                aria-label="Model example"
                value={modelExampleId}
                onChange={handleModelExampleChange}
              >
                {modelExamples.map((example) => (
                  <option key={example.id} value={example.id}>
                    {example.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={handleNormalize}>
              Normalize
            </button>
          </div>

          {validation.errors.length > 0 ? (
            <pre aria-label="Model validation errors" className="validation-errors">
              {JSON.stringify(validation.errors, null, 2)}
            </pre>
          ) : null}

          <pre aria-label="Document JSON">{documentPreview}</pre>
        </aside>
      </section>

      <SelectionDebugger document={normalizedDocument} />
    </main>
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <DemoApp />
  </StrictMode>,
);
