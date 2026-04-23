import { useRef, useState, useCallback } from "react";
import {
  DragbleEditor,
  type DragbleEditorRef,
  type DragbleSDK,
  type DesignJson,
  type EditorOptions,
} from "dragble-react-editor";

// ── Editor configuration ──────────────────────────────────────────────────────
// Only non-default options are needed here. Features like preview, undoRedo,
// stock images, and all tools are enabled by default.

const editorOptions: EditorOptions = {
  appearance: {
    theme: "light",
    accentColor: "indigo",
  },
  // Add your custom options here, e.g.:
  // mergeTags: { customMergeTags: [...] },
  // fonts: { showDefaultFonts: true, customFonts: [...] },
  // tools: { html: { enabled: false } },
};

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const editorRef = useRef<DragbleEditorRef>(null);
  const [isReady, setIsReady] = useState(false);

  // ── Event handlers ──────────────────────────────────────────────────────────

  const handleReady = useCallback((_editor: DragbleSDK) => {
    setIsReady(true);
    console.log("Editor ready");
  }, []);

  const handleChange = useCallback(
    (data: { design: DesignJson; type: string }) => {
      console.log("Design changed:", data.type);
    },
    [],
  );

  const handleError = useCallback((error: Error) => {
    console.error("Error:", error.message);
  }, []);

  // ── Toolbar actions ─────────────────────────────────────────────────────────

  const handleNewBlank = () => {
    editorRef.current?.editor?.loadBlank();
  };

  const handleSaveDesign = async () => {
    const result = await editorRef.current?.editor?.getDesign();
    if (result) {
      console.log("Design saved:", result);
    }
  };

  const handleExportHtml = async () => {
    const html = await editorRef.current?.editor?.exportHtml();
    if (html) {
      console.log("Exported HTML:", html);
    }
  };

  const handleUndo = () => editorRef.current?.editor?.undo();
  const handleRedo = () => editorRef.current?.editor?.redo();
  const handlePreview = () => editorRef.current?.editor?.showPreview("desktop");

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <span style={styles.title}>Dragble React Editor</span>
          <span style={isReady ? styles.badgeReady : styles.badgeLoading}>
            {isReady ? "Ready" : "Loading..."}
          </span>
        </div>
        <div style={styles.toolbarActions}>
          <button
            onClick={handleNewBlank}
            style={styles.btn}
            disabled={!isReady}
          >
            New Blank
          </button>
          <button
            onClick={handleSaveDesign}
            style={styles.btn}
            disabled={!isReady}
          >
            Save Design
          </button>
          <button
            onClick={handleExportHtml}
            style={{ ...styles.btn, ...styles.btnPrimary }}
            disabled={!isReady}
          >
            Export HTML
          </button>
          <div style={styles.separator} />
          <button onClick={handleUndo} style={styles.btn} disabled={!isReady}>
            Undo
          </button>
          <button onClick={handleRedo} style={styles.btn} disabled={!isReady}>
            Redo
          </button>
          <button
            onClick={handlePreview}
            style={styles.btn}
            disabled={!isReady}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Editor */}
      <DragbleEditor
        ref={editorRef}
        editorKey="db_pxl81cxn92wignwx"
        editorMode="email"
        designMode="edit"
        height="100%"
        minHeight="600px"
        options={editorOptions}
        style={{ flex: 1, minHeight: 0 }}
        onReady={handleReady}
        onChange={handleChange}
        onError={handleError}
      />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
    gap: "12px",
    flexWrap: "wrap",
  },
  toolbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  title: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "#111827",
  },
  badgeReady: {
    padding: "3px 10px",
    borderRadius: "9999px",
    fontSize: "0.6875rem",
    fontWeight: 600,
    background: "#dcfce7",
    color: "#15803d",
  },
  badgeLoading: {
    padding: "3px 10px",
    borderRadius: "9999px",
    fontSize: "0.6875rem",
    fontWeight: 600,
    background: "#fef3c7",
    color: "#b45309",
  },
  toolbarActions: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap" as const,
  },
  btn: {
    padding: "6px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#fff",
    cursor: "pointer",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "#374151",
    transition: "background 0.15s",
  },
  btnPrimary: {
    background: "#4f46e5",
    color: "#fff",
    borderColor: "#4f46e5",
  },
  separator: {
    width: "1px",
    height: "24px",
    background: "#e5e7eb",
  },
};
