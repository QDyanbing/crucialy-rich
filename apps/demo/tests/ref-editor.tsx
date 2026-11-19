import {
  BOLD_COMMAND_NAME,
  cloneRangeSelection,
  createBlockSelection,
  createDocument,
  createImage,
  createParagraph,
  createText,
  DELETE_IMAGE_COMMAND_NAME,
  type RangeSelection,
} from "@crucialy-rich/core";
import {
  RichTextEditor,
  type RichTextEditorHandle,
  type RichTextEditorTransactionEvent,
} from "@crucialy-rich/react";
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const initial = createDocument([createParagraph([createText("命令式正文")])]);
const initialImage = createDocument([
  createImage("https://example.com/ref.png", { alt: "测试图片" }),
]);
const controlled = new URLSearchParams(location.search).get("controlled") === "true";

function Fixture() {
  const textRef = useRef<RichTextEditorHandle>(null),
    imageRef = useRef<RichTextEditorHandle>(null);
  const [document, setDocument] = useState(initial);
  const [selection, setSelection] = useState<RangeSelection>({
    anchor: { path: [0, 0], offset: 0 },
    focus: { path: [0, 0], offset: 2 },
  });
  const [changes, setChanges] = useState(0),
    [transactions, setTransactions] = useState(0);
  const [mutate, setMutate] = useState(false);
  const [read, setRead] = useState<RangeSelection>();
  const [imageDocument, setImageDocument] = useState(initialImage);
  const [imageEvent, setImageEvent] = useState<RichTextEditorTransactionEvent>();
  return (
    <main>
      <h1>命令式编辑验收</h1>
      <section aria-label="文字命令">
        <h2>文字</h2>
        <label>
          <input
            type="checkbox"
            checked={mutate}
            onChange={(event) => setMutate(event.target.checked)}
          />
          修改事务通知
        </label>
        <button
          type="button"
          onClick={() => {
            const first = textRef.current!.getSelection();
            if (first) {
              first.anchor.offset = 99;
              first.focus.path[0] = 99;
            }
            setRead(textRef.current!.getSelection());
          }}
        >
          检查选区副本
        </button>
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => textRef.current!.executeCommand(BOLD_COMMAND_NAME)}
        >
          加粗
        </button>
        <RichTextEditor
          ref={textRef}
          className="editor"
          contentEditable
          label="命令文字编辑器"
          defaultValue={initial}
          {...(controlled ? { value: document } : {})}
          selection={selection}
          onChange={(next) => {
            setDocument(next);
            setChanges((count) => count + 1);
          }}
          onTransaction={(event) => {
            setTransactions((count) => count + 1);
            if (mutate) {
              event.selection.anchor.offset = 99;
              event.selection.focus.path[0] = 99;
            }
          }}
          onSelectionChange={(next) => setSelection(cloneRangeSelection(next))}
        />
        <output aria-label="读取选区">{JSON.stringify(read)}</output>
        <output aria-label="文字选区">{JSON.stringify(selection)}</output>
        <output aria-label="文字文档">{JSON.stringify(document)}</output>
        <output aria-label="文字通知">
          {JSON.stringify({ changes, transactions })}
        </output>
      </section>
      <section aria-label="图片命令">
        <h2>图片</h2>
        <button
          type="button"
          onClick={() => {
            window.getSelection()!.removeAllRanges();
            imageRef.current!.executeCommand(DELETE_IMAGE_COMMAND_NAME, {
              selection: createBlockSelection([0]),
            });
          }}
        >
          删除图片
        </button>
        <RichTextEditor
          ref={imageRef}
          className="editor"
          contentEditable
          label="命令图片编辑器"
          defaultValue={initialImage}
          onChange={setImageDocument}
          onTransaction={setImageEvent}
        />
        <output aria-label="图片文档">{JSON.stringify(imageDocument)}</output>
        <output aria-label="图片事务">{JSON.stringify(imageEvent)}</output>
      </section>
    </main>
  );
}

createRoot(window.document.getElementById("root")!).render(<Fixture />);
