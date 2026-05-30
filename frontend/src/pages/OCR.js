import { useState, useRef } from "react";
import api from "../api";
import Navbar from "../components/Navbar";

function OCR() {
    const [preview, setPreview] = useState(null);
    const [file, setFile]       = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult]   = useState(null);
    const [error, setError]     = useState("");
    const fileRef = useRef();

    const handleImageChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setResult(null);
        setError("");
    };

    const handleExtract = async () => {
        if (!file) return;
        setLoading(true); setError(""); setResult(null);
        const formData = new FormData();
        formData.append("image", file);
        try {
            const res = await api.post("/ocr/extract", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to process image. Make sure the OCR service is running.");
        } finally { setLoading(false); }
    };

    const handleReset = () => {
        setPreview(null); setFile(null); setResult(null); setError("");
        if (fileRef.current) fileRef.current.value = "";
    };

    return (
        <div className="app-layout">
            <Navbar />
            <div className="main-content">
                <div className="page-container">

                    <div className="page-header">
                        <h1>OCR Scanner</h1>
                        <p>Photo a book page — we'll extract highlighted or underlined words automatically.</p>
                    </div>

                    {/* Tips box */}
                    <div style={{
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        padding: "14px 18px",
                        marginBottom: "24px",
                        fontSize: "0.82rem",
                        lineHeight: "1.75",
                        color: "var(--text-2)"
                    }}>
                        <strong style={{ color: "var(--text)", display: "block", marginBottom: "6px" }}>📸 For best results:</strong>
                        <span style={{ display: "block" }}>• Good lighting, flat page, no glare</span>
                        <span style={{ display: "block" }}>• Yellow / pink / green highlights detected automatically</span>
                        <span style={{ display: "block" }}>• Ball-pen underlines (any colour) detected via edge detection</span>
                        <span style={{ display: "block" }}>• Requires the OCR service running: <code style={{ background: "var(--bg)", padding: "1px 5px", fontFamily: "monospace" }}>python ocr_service.py</code></span>
                    </div>

                    {/* Upload area */}
                    {!preview && (
                        <div className="ocr-upload-area" onClick={() => fileRef.current?.click()}>
                            <span className="emoji">📷</span>
                            <p style={{ fontWeight: 600, marginBottom: "5px", fontSize: "1rem" }}>
                                Tap to upload a photo
                            </p>
                            <p style={{ fontSize: "0.83rem", color: "var(--text-2)" }}>
                                JPG, PNG, HEIC — phone camera photos work great
                            </p>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleImageChange}
                            />
                        </div>
                    )}

                    {/* Preview + extract */}
                    {preview && !result && (
                        <div>
                            <img src={preview} alt="Preview" className="ocr-preview-img" />

                            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleExtract}
                                    disabled={loading}
                                    style={{ width: "auto" }}
                                >
                                    {loading ? "Scanning…" : "🔍 Extract Words"}
                                </button>
                                <button className="btn btn-ghost" onClick={handleReset} style={{ width: "auto" }}>
                                    ✕ Cancel
                                </button>
                            </div>

                            {loading && (
                                <div style={{ textAlign: "center", padding: "24px", border: "1px dashed var(--border)", background: "var(--card)" }}>
                                    <div className="loading-dots"><span/><span/><span/></div>
                                    <p style={{ color: "var(--text-2)", marginTop: "12px", fontSize: "0.87rem" }}>
                                        Running OCR · detecting highlights & underlines…
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="context-error" style={{ marginBottom: "16px" }}>
                            {error}
                        </div>
                    )}

                    {/* Results */}
                    {result && (
                        <div style={{ animation: "fadeUp 0.25s ease" }}>

                            {/* Summary bar */}
                            <div style={{
                                display: "flex",
                                gap: "0",
                                border: "2px solid var(--text)",
                                marginBottom: "20px",
                                background: "var(--card)"
                            }}>
                                <div style={{ flex: 1, padding: "14px 18px", borderRight: "1px solid var(--border)" }}>
                                    <div style={{ fontFamily: "var(--heading)", fontSize: "1.6rem", fontWeight: 700 }}>
                                        {result.added?.length ?? 0}
                                    </div>
                                    <div style={{ fontSize: "0.65rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px" }}>
                                        Words Added
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: "14px 18px", borderRight: "1px solid var(--border)" }}>
                                    <div style={{ fontFamily: "var(--heading)", fontSize: "1.6rem", fontWeight: 700 }}>
                                        {result.highlighted?.length ?? 0}
                                    </div>
                                    <div style={{ fontSize: "0.65rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px" }}>
                                        Highlighted
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: "14px 18px", borderRight: "1px solid var(--border)" }}>
                                    <div style={{ fontFamily: "var(--heading)", fontSize: "1.6rem", fontWeight: 700 }}>
                                        {result.underlined?.length ?? 0}
                                    </div>
                                    <div style={{ fontSize: "0.65rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px" }}>
                                        Underlined
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: "14px 18px" }}>
                                    <div style={{ fontFamily: "var(--heading)", fontSize: "1.6rem", fontWeight: 700 }}>
                                        {result.skipped?.length ?? 0}
                                    </div>
                                    <div style={{ fontSize: "0.65rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px" }}>
                                        Already Known
                                    </div>
                                </div>
                            </div>

                            {/* Detected word lists */}
                            {result.highlighted?.length > 0 && (
                                <div style={{ marginBottom: "14px" }}>
                                    <p className="section-title">🟡 Highlighted words</p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {result.highlighted.map(w => (
                                            <span key={w} style={{
                                                background: "rgba(255,220,50,0.2)",
                                                border: "1px solid rgba(200,170,0,0.4)",
                                                padding: "4px 12px",
                                                fontSize: "0.83rem",
                                                fontFamily: "var(--serif)"
                                            }}>{w}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {result.underlined?.length > 0 && (
                                <div style={{ marginBottom: "20px" }}>
                                    <p className="section-title">〰️ Underlined words</p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {result.underlined.map(w => (
                                            <span key={w} style={{
                                                background: "var(--surface)",
                                                border: "1px solid var(--border-dk)",
                                                borderBottom: "2.5px solid var(--text)",
                                                padding: "4px 12px",
                                                fontSize: "0.83rem",
                                                fontFamily: "var(--serif)"
                                            }}>{w}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Added word cards */}
                            {result.added?.length > 0 && (
                                <>
                                    <p className="section-title">Words saved to vocabulary</p>
                                    <div className="word-list" style={{ marginBottom: "20px" }}>
                                        {result.added.map(w => (
                                            <div key={w._id} className="word-card">
                                                <div className="word-card-top">
                                                    <h3 style={{ fontFamily: "var(--heading)", fontSize: "1rem" }}>{w.word}</h3>
                                                    <span className="status-btn review">Review</span>
                                                </div>
                                                <p className="meaning">{w.meaning}</p>
                                                {w.exampleSentence && w.exampleSentence !== "No example available" && (
                                                    <p className="example">"{w.exampleSentence}"</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {result.added?.length === 0 && (
                                <div className="empty-state" style={{ marginBottom: "20px" }}>
                                    <p>No new words were added — they may already be in your vocabulary.</p>
                                </div>
                            )}

                            <button className="btn btn-ghost" onClick={handleReset} style={{ width: "auto" }}>
                                📷 Scan another image
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OCR;
