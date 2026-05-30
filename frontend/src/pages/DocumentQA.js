import { useEffect, useState, useRef } from "react";
import api from "../api";
import Navbar from "../components/Navbar";

function DocumentQA() {
    const [docStatus, setDocStatus] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState("");
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState(null);
    const [asking, setAsking] = useState(false);
    const [error, setError] = useState("");
    const [history, setHistory] = useState([]);
    const fileRef = useRef();
    const bottomRef = useRef();

    useEffect(() => { fetchStatus(); }, []);
    useEffect(() => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }, [history]);

    const fetchStatus = async () => {
        try {
            const res = await api.get("/ragl/status");
            setDocStatus(res.data);
        } catch {}
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setUploadMsg("");
        setHistory([]);
        setAnswer(null);

        const formData = new FormData();
        formData.append("pdf", file);

        try {
            const res = await api.post("/ragl/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setUploadMsg(`✅ ${res.data.message}`);
            fetchStatus();
        } catch (err) {
            setUploadMsg("❌ " + (err.response?.data?.message || "Failed to upload"));
        } finally {
            setUploading(false);
            fileRef.current.value = "";
        }
    };

    const handleAsk = async () => {
        if (!question.trim()) return;
        setAsking(true);
        setError("");

        const q = question.trim();
        setQuestion("");

        // Add question to history immediately
        setHistory(prev => [...prev, { type: "question", text: q }]);

        try {
            const res = await api.post("/ragl/ask", { question: q });
            setHistory(prev => [...prev, { type: "answer", data: res.data }]);
        } catch (err) {
            setHistory(prev => [...prev, {
                type: "error",
                text: err.response?.data?.message || "Failed to get answer"
            }]);
        } finally {
            setAsking(false);
        }
    };

    const handleAddWord = async (word, meaning) => {
        try {
            await api.post("/words", {
                word: word.toLowerCase(),
                meaning,
                exampleSentence: "No example available"
            });
            alert(`✅ "${word}" added to your vocabulary!`);
        } catch {
            alert("Failed to add word");
        }
    };

    return (
        <div>
            <Navbar />
            <div className="dashboard-page">

                <div className="dashboard-header">
                    <h1>Document Q&A 📄🤖</h1>
                    <p>Upload any PDF — ask anything — get answers from YOUR document.</p>
                </div>

                {/* Upload section */}
                <div className="context-card" style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                            <p className="context-label" style={{ marginBottom: "4px" }}>
                                {docStatus?.hasDocument
                                    ? `📄 Document loaded — ${docStatus.chunks} sections indexed`
                                    : "📄 No document uploaded yet"}
                            </p>
                            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                {docStatus?.hasDocument
                                    ? "Upload a new document to replace the current one"
                                    : "Upload a textbook, paper, or article to get started"}
                            </p>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ width: "auto" }}
                            onClick={() => fileRef.current.click()}
                            disabled={uploading}
                        >
                            {uploading ? "⏳ Indexing..." : "📤 Upload PDF"}
                        </button>
                        <input ref={fileRef} type="file" accept=".pdf"
                            style={{ display: "none" }} onChange={handleUpload} />
                    </div>

                    {uploadMsg && (
                        <div style={{
                            marginTop: "12px", padding: "10px 16px", borderRadius: "10px",
                            background: uploadMsg.startsWith("✅") ? "#d4f7d4" : "#fff1f0",
                            border: `1px solid ${uploadMsg.startsWith("✅") ? "#52c41a" : "#ff4d4f"}`,
                            fontSize: "0.88rem"
                        }}>
                            {uploadMsg}
                        </div>
                    )}
                </div>

                {/* Chat history */}
                {history.length > 0 && (
                    <div className="qa-history">
                        {history.map((item, i) => (
                            <div key={i}>
                                {item.type === "question" && (
                                    <div className="qa-question">
                                        <span className="qa-avatar">You</span>
                                        <p>{item.text}</p>
                                    </div>
                                )}

                                {item.type === "answer" && (
                                    <div className="qa-answer">
                                        <span className="qa-avatar ai">AI</span>
                                        <div className="qa-answer-body">
                                            <p className="qa-answer-text">{item.data.answer}</p>

                                            {item.data.quote && (
                                                <blockquote className="qa-quote">
                                                    "{item.data.quote}"
                                                </blockquote>
                                            )}

                                            {/* Source chunks */}
                                            {item.data.chunks?.length > 0 && (
                                                <details className="qa-sources">
                                                    <summary>📖 View source sections ({item.data.chunks.length})</summary>
                                                    {item.data.chunks.map((c, j) => (
                                                        <p key={j} className="qa-source-chunk">{c.text}</p>
                                                    ))}
                                                </details>
                                            )}

                                            {/* Confidence badge */}
                                            <div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center", flexWrap: "wrap" }}>
                                                <span className={`confidence-badge ${item.data.confidence}`}>
                                                    {item.data.confidence === "high" ? "✅ High confidence" :
                                                     item.data.confidence === "medium" ? "⚡ Medium confidence" :
                                                     "⚠️ Low confidence"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {item.type === "error" && (
                                    <div className="context-error" style={{ margin: "8px 0" }}>
                                        ❌ {item.text}
                                    </div>
                                )}
                            </div>
                        ))}

                        {asking && (
                            <div className="qa-answer">
                                <span className="qa-avatar ai">AI</span>
                                <div className="loading-dots" style={{ padding: "8px 0" }}>
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                )}

                {/* Empty state */}
                {!docStatus?.hasDocument && history.length === 0 && (
                    <div className="empty-state">
                        <div className="emoji">📚</div>
                        <p>Upload a PDF to start asking questions about it!</p>
                    </div>
                )}

                {/* Question input */}
                {docStatus?.hasDocument && (
                    <div className="qa-input-row">
                        <input
                            placeholder="Ask anything about your document..."
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && !asking && handleAsk()}
                            disabled={asking}
                            style={{ flex: 1, margin: 0 }}
                        />
                        <button
                            className="btn btn-primary"
                            style={{ width: "auto", whiteSpace: "nowrap" }}
                            onClick={handleAsk}
                            disabled={asking || !question.trim()}
                        >
                            {asking ? "..." : "Ask →"}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

export default DocumentQA;
