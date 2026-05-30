


import { useState, useRef, useEffect, useCallback } from "react";
import api from "../api";
import Navbar from "../components/Navbar";

function PDFReader() {
    const canvasRef = useRef(null);
    const fileRef = useRef(null);
    const pdfRef = useRef(null);
    const textLayerRef = useRef(null);

    const [pdfLoaded, setPdfLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
    const [fileName, setFileName] = useState("");

    const [selectedText, setSelectedText] = useState("");
    const [word, setWord] = useState("");
    const [explaining, setExplaining] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [added, setAdded] = useState(false);

    // Load PDF.js + its text layer CSS from CDN
    useEffect(() => {
        // Load CSS for text layer selection
        if (!document.getElementById("pdfjs-css")) {
            const link = document.createElement("link");
            link.id = "pdfjs-css";
            link.rel = "stylesheet";
            link.href = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.min.css";
            document.head.appendChild(link);
        }

        if (window.pdfjsLib) { setPdfjsLoaded(true); return; }

        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
            setPdfjsLoaded(true);
        };
        document.head.appendChild(script);
    }, []);

    const renderPage = useCallback(async (pageNum) => {
        if (!pdfRef.current || !canvasRef.current) return;
        setLoading(true);

        try {
            const page = await pdfRef.current.getPage(pageNum);
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            // Use a good scale for readability
            const containerWidth = canvas.parentElement?.clientWidth || 800;
            const viewport = page.getViewport({ scale: 1 });
            const scale = Math.max((containerWidth - 40) / viewport.width, 1.2);
            const scaledViewport = page.getViewport({ scale });

            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            canvas.style.width = `${scaledViewport.width}px`;
            canvas.style.height = `${scaledViewport.height}px`;

            // Render PDF page
            await page.render({
                canvasContext: ctx,
                viewport: scaledViewport
            }).promise;

            // Build text layer for selection
            const textContent = await page.getTextContent();
            const textLayer = textLayerRef.current;

            if (textLayer) {
                textLayer.innerHTML = "";
                textLayer.style.width = `${scaledViewport.width}px`;
                textLayer.style.height = `${scaledViewport.height}px`;

                // Manually render text spans
                textContent.items.forEach((item) => {
                    if (!item.str) return;
                    const tx = window.pdfjsLib.Util.transform(
                        scaledViewport.transform,
                        item.transform
                    );
                    const span = document.createElement("span");
                    span.textContent = item.str;
                    span.style.position = "absolute";
                    span.style.left = `${tx[4]}px`;
                    span.style.top = `${tx[5] - item.height * scale}px`;
                    span.style.fontSize = `${Math.abs(tx[0])}px`;
                    span.style.fontFamily = item.fontName || "sans-serif";
                    span.style.color = "transparent";
                    span.style.whiteSpace = "pre";
                    span.style.cursor = "text";
                    span.style.transformOrigin = "0% 0%";
                    textLayer.appendChild(span);
                });
            }

        } catch (err) {
            console.log("Render error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (pdfLoaded && pdfjsLoaded) renderPage(currentPage);
    }, [currentPage, pdfLoaded, pdfjsLoaded, renderPage]);

    const loadPDF = async (file) => {
        if (!file || !pdfjsLoaded) return;
        setFileName(file.name);
        setLoading(true);
        setResult(null);
        setSelectedText("");
        setWord("");
        setPdfLoaded(false);

        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const typedArray = new Uint8Array(ev.target.result);
                const pdf = await window.pdfjsLib.getDocument({ data: typedArray }).promise;
                pdfRef.current = pdf;
                setTotalPages(pdf.numPages);
                setCurrentPage(1);
                setPdfLoaded(true);
            } catch (err) {
                console.log("PDF load error:", err);
                setError("Failed to load PDF.");
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) loadPDF(file);
    };

    const handleChangePDF = () => {
        // Reset file input and open picker
        if (fileRef.current) {
            fileRef.current.value = "";
            fileRef.current.click();
        }
    };

    const handleTextSelection = () => {
        setTimeout(() => {
            const selection = window.getSelection();
            const text = selection?.toString().trim();
            if (text && text.length > 3) {
                setSelectedText(text);
                setResult(null);
                setAdded(false);
                // Auto-fill if single word selected
                const words = text.trim().split(/\s+/);
                if (words.length === 1) {
                    setWord(text.toLowerCase().replace(/[^a-z]/g, ""));
                }
            }
        }, 150);
    };

    const handleExplain = async () => {
        if (!selectedText || !word) return;
        setExplaining(true);
        setError("");
        setResult(null);
        setAdded(false);
        try {
            const res = await api.post("/contextual/explain", {
                paragraph: selectedText,
                word: word.trim()
            });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to get explanation.");
        } finally {
            setExplaining(false);
        }
    };

    const handleAdd = async () => {
        if (!result) return;
        try {
            await api.post("/words", {
                word: word.toLowerCase(),
                meaning: result.explanation,
                exampleSentence: selectedText.substring(0, 200)
            });
            setAdded(true);
        } catch {
            setError("Failed to add word.");
        }
    };

    return (
        <div>
            <Navbar />
            <div className="reader-layout">

                {/* LEFT — PDF Viewer */}
                <div className="reader-left">

                    {/* Toolbar */}
                    <div className="reader-toolbar">
                        {!pdfLoaded ? (
                            <button className="btn btn-primary"
                                style={{ width: "auto", fontSize: "0.85rem", padding: "8px 18px" }}
                                onClick={() => fileRef.current.click()}>
                                📄 Open PDF
                            </button>
                        ) : (
                            <>
                                <button className="btn btn-ghost"
                                    style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px" }}
                                    onClick={handleChangePDF}>
                                    📄 Change PDF
                                </button>
                                <div className="reader-page-controls">
                                    <button className="btn btn-ghost"
                                        style={{ width: "auto", padding: "6px 14px" }}
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1 || loading}>
                                        ←
                                    </button>
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button className="btn btn-ghost"
                                        style={{ width: "auto", padding: "6px 14px" }}
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || loading}>
                                        →
                                    </button>
                                </div>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {fileName}
                                </span>
                            </>
                        )}
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".pdf"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Canvas area */}
                    <div className="reader-canvas-container"
                        onMouseUp={handleTextSelection}>

                        {!pdfLoaded && !loading && (
                            <div className="reader-empty" onClick={() => fileRef.current.click()}>
                                <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>📖</div>
                                <p style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "6px" }}>Open a PDF to start reading</p>
                                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                    Select any text → get contextual meaning instantly
                                </p>
                            </div>
                        )}

                        {loading && (
                            <div className="reader-empty">
                                <div className="loading-dots"><span/><span/><span/></div>
                                <p style={{ marginTop: "16px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                    Rendering page {currentPage}...
                                </p>
                            </div>
                        )}

                        {/* PDF canvas + text layer wrapper */}
                        <div style={{
                            position: "relative",
                            display: pdfLoaded && !loading ? "inline-block" : "none",
                            boxShadow: "0 4px 32px rgba(0,0,0,0.15)",
                            borderRadius: "4px",
                            overflow: "hidden"
                        }}>
                            <canvas ref={canvasRef} style={{ display: "block" }}/>
                            <div
                                ref={textLayerRef}
                                style={{
                                    position: "absolute",
                                    top: 0, left: 0,
                                    overflow: "hidden",
                                    pointerEvents: "auto",
                                    userSelect: "text",
                                    WebkitUserSelect: "text"
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT — Context Panel */}
                <div className="reader-right">
                    <h3 style={{ fontFamily: "Fraunces, serif", marginBottom: "20px", fontSize: "1.3rem" }}>
                        🔍 Contextual Meaning
                    </h3>

                    {!selectedText && (
                        <div className="reader-tip">
                            <p style={{ fontWeight: 600, marginBottom: "8px" }}>💡 How to use:</p>
                            <ol style={{ paddingLeft: "16px", fontSize: "0.85rem", lineHeight: "2", color: "var(--text-muted)" }}>
                                <li>Open any PDF on the left</li>
                                <li>Click and drag to select text</li>
                                <li>Type the confusing word</li>
                                <li>Click Explain</li>
                            </ol>
                        </div>
                    )}

                    {selectedText && (
                        <div className="reader-selected-text">
                            <p className="context-label" style={{ marginBottom: "8px" }}>Selected paragraph:</p>
                            <p style={{ fontSize: "0.83rem", lineHeight: "1.7", color: "#555", fontStyle: "italic" }}>
                                "{selectedText.length > 250 ? selectedText.substring(0, 250) + "..." : selectedText}"
                            </p>
                        </div>
                    )}

                    <div style={{ marginTop: "16px" }}>
                        <p className="context-label">Which word confuses you?</p>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input
                                placeholder="Type the word..."
                                value={word}
                                onChange={e => setWord(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))}
                                onKeyDown={e => e.key === "Enter" && handleExplain()}
                                style={{ flex: 1, margin: 0 }}
                                disabled={!selectedText}
                            />
                            <button className="btn btn-primary"
                                style={{ width: "auto", whiteSpace: "nowrap" }}
                                onClick={handleExplain}
                                disabled={!selectedText || !word || explaining}>
                                {explaining ? "..." : "Explain"}
                            </button>
                        </div>
                    </div>

                    {explaining && (
                        <div style={{ textAlign: "center", padding: "28px 0" }}>
                            <div className="loading-dots"><span/><span/><span/></div>
                            <p style={{ color: "var(--text-muted)", marginTop: "12px", fontSize: "0.85rem" }}>
                                Reading your context...
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="context-error" style={{ marginTop: "12px" }}>❌ {error}</div>
                    )}

                    {result && !explaining && (
                        <div className="reader-result">
                            <div className="result-word" style={{ fontSize: "1.5rem" }}>"{word}"</div>

                            <div className="result-section">
                                <p className="result-label">In this context means:</p>
                                <p className="result-explanation">{result.explanation}</p>
                            </div>

                            {result.example && (
                                <div className="result-section">
                                    <p className="result-label">Simpler way to think:</p>
                                    <p className="result-simpler">{result.example}</p>
                                </div>
                            )}

                            {result.relatedWords && (
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                                    {(Array.isArray(result.relatedWords)
                                        ? result.relatedWords
                                        : result.relatedWords.split(",").map(w => w.trim())
                                    ).map((w, i) => (
                                        <span key={i} className="related-chip">{w}</span>
                                    ))}
                                </div>
                            )}

                            <button className="btn btn-primary"
                                onClick={handleAdd}
                                disabled={added}
                                style={{ width: "100%" }}>
                                {added ? "✅ Added to My Words!" : "+ Add to My Words"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PDFReader;
