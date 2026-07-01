import {
  applyDeleteText,
  applyInsertText,
  createDocument,
  createDeleteTextOperation,
  createInsertTextOperation,
  createParagraph,
  createSelectionAfterDeleteText,
  createSelectionAfterInsertText,
  createText,
  domSelectionToModelSelection,
  getNodeAtPath,
  getTextInRange,
  isValidPoint,
  normalizeDocument,
  validateDocument,
  type DocumentNode,
  type Operation,
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
    label: "常规文档",
    value: createDocument([
      createParagraph([createText("你好，crucialy-rich。")]),
      createParagraph([createText("选区模型已就绪。")]),
    ]),
  },
  {
    id: "empty",
    label: "空文档",
    value: { type: "document", children: [] },
  },
  {
    id: "invalid",
    label: "非法文档",
    value: {
      type: "document",
      children: [{ type: "text", text: "游离文本" }],
    },
  },
];

const uncontrolledPreviewDocument = createDocument([
  createParagraph([createText("非受控初始文档。")]),
]);

const renderBoundaryExamples: RenderBoundaryExample[] = [
  {
    id: "empty-document",
    label: "空文档边界",
    document: {
      type: "document",
      children: [],
    },
  },
  {
    id: "empty-paragraph",
    label: "空段落边界",
    document: {
      type: "document",
      children: [{ type: "paragraph", children: [] }],
    },
  },
  {
    id: "multi-paragraph",
    label: "多段落边界",
    document: createDocument([
      createParagraph([createText("边界第一段。")]),
      createParagraph([createText("边界第二段。")]),
      createParagraph([createText("边界第三段。")]),
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
    <pre aria-label="文档 JSON 选区映射">
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
    <section className="selection-debugger" aria-label="选区调试器">
      <h2>选区</h2>

      <div className="control-grid">
        <label>
          <span>锚点路径</span>
          <input
            aria-label="锚点路径"
            value={selection.anchor.path.join(",")}
            onChange={(event) =>
              updateAnchor(event.target.value, String(selection.anchor.offset))
            }
          />
        </label>
        <label>
          <span>锚点偏移</span>
          <input
            aria-label="锚点偏移"
            inputMode="numeric"
            value={selection.anchor.offset}
            onChange={(event) =>
              updateAnchor(selection.anchor.path.join(","), event.target.value)
            }
          />
        </label>
        <label>
          <span>焦点路径</span>
          <input
            aria-label="焦点路径"
            value={selection.focus.path.join(",")}
            onChange={(event) =>
              updateFocus(event.target.value, String(selection.focus.offset))
            }
          />
        </label>
        <label>
          <span>焦点偏移</span>
          <input
            aria-label="焦点偏移"
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
        {anchorValid && focusValid ? "选区合法" : "选区非法"}
      </div>

      <div className="selection-result">
        <span>选中文本</span>
        <code aria-label="选中文本">{selectedText || "（空）"}</code>
      </div>

      <div className="debug-stack">
        <div>
          <h3>选区 JSON</h3>
          <pre aria-label="选区 JSON">{JSON.stringify(selection, null, 2)}</pre>
        </div>
        <div>
          <h3>锚点节点</h3>
          <pre aria-label="选中节点">{JSON.stringify(anchorNode ?? null, null, 2)}</pre>
        </div>
        <div>
          <h3>文档映射</h3>
          <DocumentJsonMap document={document} selectedPath={selection.anchor.path} />
        </div>
      </div>
    </section>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("缺少根节点。");
}

function DemoApp() {
  const [modelExampleId, setModelExampleId] = useState<ModelExampleId>("regular");
  const [modelSelection, setModelSelection] =
    useState<RangeSelection>(defaultSelection);
  const [insertTextValue, setInsertTextValue] = useState("插入文本");
  const [lastOperation, setLastOperation] = useState<Operation | null>(null);
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

  function handleInsertText() {
    const operation = createInsertTextOperation(modelSelection.anchor, insertTextValue);

    setDocumentValue(applyInsertText(normalizedDocument, operation));
    setModelSelection(createSelectionAfterInsertText(operation));
    setLastOperation(operation);
  }

  function handleDeleteText() {
    const operation = createDeleteTextOperation(modelSelection);

    setDocumentValue(applyDeleteText(normalizedDocument, operation));
    setModelSelection(createSelectionAfterDeleteText(operation));
    setLastOperation(operation);
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
          <p className="eyebrow">调试工作台</p>
          <h1 id="page-title">crucialy-rich</h1>
        </div>
        <span className="status-pill">脚手架就绪</span>
      </header>

      <section className="workspace-grid" aria-label="编辑器工作区">
        <div className="editor-surface" aria-label="编辑器预览">
          <RichTextEditor
            className="rendered-document"
            contentEditable
            label="已渲染文档"
            onKeyUp={handleBrowserSelectionSync}
            onMouseUp={handleBrowserSelectionSync}
            suppressContentEditableWarning
            value={normalizedDocument}
          />
        </div>

        <aside className="debug-panel" aria-label="文档调试面板">
          <div className="panel-header">
            <h2>文档 JSON</h2>
            <span
              aria-label="模型校验状态"
              className="state-pill"
              data-state={validation.valid ? "valid" : "invalid"}
            >
              {validation.valid ? "合法" : "非法"}
            </span>
          </div>

          <div className="model-controls" aria-label="模型控制">
            <label>
              <span>模型示例</span>
              <select
                aria-label="模型示例"
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
              规范化
            </button>
          </div>

          <div className="operation-controls" aria-label="操作控制">
            <label>
              <span>插入文本</span>
              <input
                aria-label="插入文本"
                value={insertTextValue}
                onChange={(event) => setInsertTextValue(event.target.value)}
              />
            </label>
            <button type="button" onClick={handleInsertText}>
              插入
            </button>
            <button type="button" onClick={handleDeleteText}>
              删除选区
            </button>
          </div>

          <pre aria-label="最近操作" className="operation-preview">
            {lastOperation ? JSON.stringify(lastOperation, null, 2) : "暂无操作"}
          </pre>

          {validation.errors.length > 0 ? (
            <pre aria-label="模型校验错误" className="validation-errors">
              {JSON.stringify(validation.errors, null, 2)}
            </pre>
          ) : null}

          <pre aria-label="文档 JSON">{documentPreview}</pre>
        </aside>
      </section>

      <section className="component-examples" aria-label="组件 API 示例">
        <h2>组件 API</h2>

        <div className="component-grid">
          <div className="component-example">
            <h3>受控组件</h3>
            <RichTextEditor
              className="mini-editor"
              label="受控编辑器"
              value={normalizedDocument}
            />
          </div>
          <div className="component-example">
            <h3>非受控组件</h3>
            <RichTextEditor
              className="mini-editor"
              defaultValue={uncontrolledPreviewDocument}
              label="非受控编辑器"
            />
          </div>
        </div>
      </section>

      <section className="render-boundaries" aria-label="渲染边界示例">
        <h2>渲染边界</h2>

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
