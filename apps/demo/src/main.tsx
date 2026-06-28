import {
  createDocument,
  createParagraph,
  createText,
  domSelectionToModelSelection,
  getNodeAtPath,
  getTextInRange,
  isValidPoint,
  normalizeDocument,
  validateDocument,
  type DocumentNode,
  type Path,
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

interface RenderBoundaryExample {
  document: DocumentNode;
  id: string;
  label: string;
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

const uncontrolledPreviewDocument = createDocument([
  createParagraph([createText("Uncontrolled initial document.")]),
]);

const renderBoundaryExamples: RenderBoundaryExample[] = [
  {
    id: "empty-document",
    label: "Empty document boundary",
    document: {
      type: "document",
      children: [],
    },
  },
  {
    id: "empty-paragraph",
    label: "Empty paragraph boundary",
    document: {
      type: "document",
      children: [{ type: "paragraph", children: [] }],
    },
  },
  {
    id: "multi-paragraph",
    label: "Multiple paragraph boundary",
    document: createDocument([
      createParagraph([createText("Boundary first paragraph.")]),
      createParagraph([createText("Boundary second paragraph.")]),
      createParagraph([createText("Boundary third paragraph.")]),
    ]),
  },
];

const defaultSelection: RangeSelection = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 5 },
};

function cloneModelValue(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

function getModelExample(id: ModelExampleId): ModelExample {
  return modelExamples.find((example) => example.id === id) ?? modelExamples[0]!;
}

interface JsonLine {
  key: string;
  path?: Path;
  text: string;
}

function isSamePath(left: Path, right: Path): boolean {
  return (
    left.length === right.length && left.every((part, index) => part === right[index])
  );
}

function createDocumentJsonLines(document: DocumentNode): JsonLine[] {
  const lines: JsonLine[] = [
    { key: "document-open", path: [], text: "{" },
    { key: "document-type", path: [], text: '  "type": "document",' },
    { key: "document-children-open", path: [], text: '  "children": [' },
  ];

  document.children.forEach((block, blockIndex) => {
    const blockPath = [blockIndex];
    const blockSuffix = blockIndex === document.children.length - 1 ? "" : ",";

    lines.push(
      { key: `block-${blockIndex}-open`, path: blockPath, text: "    {" },
      {
        key: `block-${blockIndex}-type`,
        path: blockPath,
        text: '      "type": "paragraph",',
      },
      {
        key: `block-${blockIndex}-children-open`,
        path: blockPath,
        text: '      "children": [',
      },
    );

    block.children.forEach((node, textIndex) => {
      const textPath = [blockIndex, textIndex];
      const textSuffix = textIndex === block.children.length - 1 ? "" : ",";

      lines.push(
        {
          key: `text-${blockIndex}-${textIndex}-open`,
          path: textPath,
          text: "        {",
        },
        {
          key: `text-${blockIndex}-${textIndex}-type`,
          path: textPath,
          text: '          "type": "text",',
        },
        {
          key: `text-${blockIndex}-${textIndex}-value`,
          path: textPath,
          text: `          "text": ${JSON.stringify(node.text)}`,
        },
        {
          key: `text-${blockIndex}-${textIndex}-close`,
          path: textPath,
          text: `        }${textSuffix}`,
        },
      );
    });

    lines.push(
      {
        key: `block-${blockIndex}-children-close`,
        path: blockPath,
        text: "      ]",
      },
      {
        key: `block-${blockIndex}-close`,
        path: blockPath,
        text: `    }${blockSuffix}`,
      },
    );
  });

  lines.push(
    { key: "document-children-close", path: [], text: "  ]" },
    { key: "document-close", path: [], text: "}" },
  );

  return lines;
}

interface DocumentJsonMapProps {
  document: DocumentNode;
  selectedPath: Path;
}

function DocumentJsonMap({ document, selectedPath }: DocumentJsonMapProps) {
  return (
    <pre aria-label="Document JSON selection map">
      {createDocumentJsonLines(document).map((line) => {
        const selected = line.path ? isSamePath(line.path, selectedPath) : false;

        return (
          <span
            key={line.key}
            className="json-line"
            data-selected={selected ? "true" : "false"}
          >
            {line.text}
            {"\n"}
          </span>
        );
      })}
    </pre>
  );
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
  onSelectionChange: (selection: RangeSelection) => void;
  selection: RangeSelection;
}

function SelectionDebugger({
  document,
  onSelectionChange,
  selection,
}: SelectionDebuggerProps) {
  const anchorValid = isValidPoint(document, selection.anchor);
  const focusValid = isValidPoint(document, selection.focus);
  const selectedText =
    anchorValid && focusValid ? getTextInRange(document, selection) : "";
  const anchorNode = getNodeAtPath(document, selection.anchor.path);

  function updateAnchor(pathValue: string, offsetValue: string) {
    onSelectionChange({
      ...selection,
      anchor: createPoint(pathValue, offsetValue),
    });
  }

  function updateFocus(pathValue: string, offsetValue: string) {
    onSelectionChange({
      ...selection,
      focus: createPoint(pathValue, offsetValue),
    });
  }

  return (
    <section className="selection-debugger" aria-label="Selection debugger">
      <h2>Selection</h2>

      <div className="control-grid">
        <label>
          <span>Anchor path</span>
          <input
            aria-label="Anchor path"
            value={selection.anchor.path.join(",")}
            onChange={(event) =>
              updateAnchor(event.target.value, String(selection.anchor.offset))
            }
          />
        </label>
        <label>
          <span>Anchor offset</span>
          <input
            aria-label="Anchor offset"
            inputMode="numeric"
            value={selection.anchor.offset}
            onChange={(event) =>
              updateAnchor(selection.anchor.path.join(","), event.target.value)
            }
          />
        </label>
        <label>
          <span>Focus path</span>
          <input
            aria-label="Focus path"
            value={selection.focus.path.join(",")}
            onChange={(event) =>
              updateFocus(event.target.value, String(selection.focus.offset))
            }
          />
        </label>
        <label>
          <span>Focus offset</span>
          <input
            aria-label="Focus offset"
            inputMode="numeric"
            value={selection.focus.offset}
            onChange={(event) =>
              updateFocus(selection.focus.path.join(","), event.target.value)
            }
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
        <div>
          <h3>Document map</h3>
          <DocumentJsonMap document={document} selectedPath={selection.anchor.path} />
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
  const [modelSelection, setModelSelection] =
    useState<RangeSelection>(defaultSelection);
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

  function handleBrowserSelectionSync() {
    const browserSelection = window.getSelection();
    const nextSelection = browserSelection
      ? domSelectionToModelSelection(normalizedDocument, browserSelection)
      : undefined;

    if (nextSelection) {
      setModelSelection(nextSelection);
    }
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
          <RichTextEditor
            className="rendered-document"
            contentEditable
            label="Rendered document"
            onKeyUp={handleBrowserSelectionSync}
            onMouseUp={handleBrowserSelectionSync}
            suppressContentEditableWarning
            value={normalizedDocument}
          />
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

      <section className="component-examples" aria-label="Component API examples">
        <h2>Component API</h2>

        <div className="component-grid">
          <div className="component-example">
            <h3>Controlled</h3>
            <RichTextEditor
              className="mini-editor"
              label="Controlled editor"
              value={normalizedDocument}
            />
          </div>
          <div className="component-example">
            <h3>Uncontrolled</h3>
            <RichTextEditor
              className="mini-editor"
              defaultValue={uncontrolledPreviewDocument}
              label="Uncontrolled editor"
            />
          </div>
        </div>
      </section>

      <section className="render-boundaries" aria-label="Render boundary examples">
        <h2>Render boundaries</h2>

        <div className="boundary-grid">
          {renderBoundaryExamples.map((example) => (
            <div className="boundary-example" key={example.id}>
              <h3>{example.label}</h3>
              <RichTextEditor
                className="mini-editor"
                label={example.label}
                value={example.document}
              />
            </div>
          ))}
        </div>
      </section>

      <SelectionDebugger
        document={normalizedDocument}
        onSelectionChange={setModelSelection}
        selection={modelSelection}
      />
    </main>
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <DemoApp />
  </StrictMode>,
);
