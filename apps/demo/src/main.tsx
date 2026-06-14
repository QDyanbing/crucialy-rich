import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

const documentPreview = `{
  "type": "document",
  "children": []
}`;

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
          <div className="empty-state">Editor shell</div>
        </div>

        <aside className="debug-panel" aria-label="Document debug panel">
          <h2>Document JSON</h2>
          <pre>{documentPreview}</pre>
        </aside>
      </section>
    </main>
  </StrictMode>,
);

