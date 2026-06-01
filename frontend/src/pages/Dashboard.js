import { useEffect, useState, useRef } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import AddWord from "../components/AddWord";

function Dashboard() {
    const [words, setWords]                   = useState([]);
    const [importing, setImporting]           = useState(false);
    const [importMsg, setImportMsg]           = useState("");
    const [ragStatus, setRagStatus]           = useState(null);
    const [ingestingDict, setIngestingDict]   = useState(false);
    const [newWordProfile, setNewWordProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [diffWords, setDiffWords]           = useState([]);
    const [diffAnalyzing, setDiffAnalyzing]   = useState(false);
    const [diffAdded, setDiffAdded]           = useState(new Set());
    const [diffMsg, setDiffMsg]               = useState("");
    const [diffStats, setDiffStats]           = useState(null);

    const pdfRef  = useRef();
    const diffRef = useRef();
    const dictRef = useRef();

    const fetchWords     = async () => { try { const r = await api.get("/words"); setWords(r.data); } catch {} };
    const fetchRagStatus = async () => { try { const r = await api.get("/rag/status"); setRagStatus(r.data); } catch {} };
    useEffect(() => { fetchWords(); fetchRagStatus(); }, []);

    const handleWordAdded = async (word) => {
        fetchWords();
        setLoadingProfile(true); setNewWordProfile(null);
        try { const r = await api.get(`/profile/${word}`); setNewWordProfile(r.data); }
        catch {} finally { setLoadingProfile(false); }
    };

    const handlePDFImport = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setImporting(true); setImportMsg("");
        const fd = new FormData(); fd.append("pdf", file);
        try {
            const r = await api.post("/pdf/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
            setImportMsg({ type: "success", text: `✓ ${r.data.message}` }); fetchWords();
        } catch (err) {
            setImportMsg({ type: "error", text: `✗ ${err.response?.data?.message || "Import failed"}` });
        } finally { setImporting(false); pdfRef.current.value = ""; }
    };

    const handleDifficultyAnalyze = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setDiffAnalyzing(true);
        setDiffWords([]); setDiffAdded(new Set());
        setDiffMsg(""); setDiffStats(null);
        const fd = new FormData(); fd.append("pdf", file);
        try {
            const r = await api.post("/pdf/analyze-difficulty", fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            const found = r.data.words || [];
            setDiffWords(found);
            setDiffStats(r.data.pdfStats || null);
            if (!found.length) setDiffMsg("No difficult words found — try a longer academic PDF.");
        } catch (err) {
            setDiffMsg(err.response?.data?.message || "Analysis failed. Make sure the PDF has selectable text (not a scanned image).");
        } finally {
            setDiffAnalyzing(false);
            diffRef.current.value = "";
        }
    };

    const addDifficultWord = async (word) => {
        if (diffAdded.has(word)) return;
        try {
            await api.post("/words", { word });
            setDiffAdded(prev => new Set([...prev, word]));
            fetchWords();
        } catch { alert(`Could not add "${word}"`); }
    };

    const addAllDiffWords = async () => {
        for (const w of diffWords) {
            if (!diffAdded.has(w)) await addDifficultWord(w);
        }
    };

    const handleDictUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setIngestingDict(true);
        const fd = new FormData(); fd.append("pdf", file);
        try {
            const r = await api.post("/rag/ingest", fd, { headers: { "Content-Type": "multipart/form-data" } });
            setImportMsg({ type: "success", text: `✓ ${r.data.message}` }); fetchRagStatus();
        } catch (err) {
            setImportMsg({ type: "error", text: `✗ ${err.response?.data?.message || "Failed"}` });
        } finally { setIngestingDict(false); dictRef.current.value = ""; }
    };

    const learnedCount = words.filter(w => w.status === "learned").length;

    return (
        <div className="app-layout">
            <Navbar />
            <div className="main-content">
                <div className="page-container">

                    <div className="page-header">
                        <h1>Dashboard</h1>
                        <p>Your vocabulary at a glance.</p>
                    </div>

                    {/* Stats */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-number">{words.length}</div>
                            <div className="stat-label">Total Words</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number" style={{ color: "var(--green)" }}>{learnedCount}</div>
                            <div className="stat-label">Learned</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number" style={{ color: "var(--accent)" }}>{words.length - learnedCount}</div>
                            <div className="stat-label">To Review</div>
                        </div>
                        <div className="stat-card clickable" onClick={() => pdfRef.current.click()}>
                            <div className="stat-number" style={{ fontSize: "1.4rem" }}>{importing ? "…" : "+"}</div>
                            <div className="stat-label">{importing ? "Importing…" : "Import PDF"}</div>
                            <input ref={pdfRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handlePDFImport} />
                        </div>
                        <div className="stat-card clickable" onClick={() => dictRef.current.click()}>
                            <div className="stat-number" style={{ fontSize: "1.4rem" }}>{ingestingDict ? "…" : "⊕"}</div>
                            <div className="stat-label">{ingestingDict ? "Loading…" : ragStatus?.words_loaded > 0 ? `${ragStatus.words_loaded} dict` : "Load Dict"}</div>
                            <input ref={dictRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleDictUpload} />
                        </div>
                    </div>

                    {importMsg && (
                        <div className={`import-msg ${importMsg.type}`}>{importMsg.text}</div>
                    )}

                    <AddWord onWordAdded={handleWordAdded} />

                    {/* ── Difficult Words Detector ── */}
                    <div style={{ marginBottom: "28px" }}>
                        <p className="section-title">Auto-detect difficult words from PDF</p>

                        <button
                            className="btn btn-ghost"
                            style={{ width: "auto", marginBottom: "12px" }}
                            onClick={() => diffRef.current.click()}
                            disabled={diffAnalyzing}
                        >
                            {diffAnalyzing
                                ? <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span className="loading-dots" style={{ display: "inline-flex", gap: "3px" }}><span/><span/><span/></span>
                                    Analysing…
                                  </span>
                                : "📄 Upload PDF to find difficult words"
                            }
                        </button>
                        <input
                            ref={diffRef}
                            type="file"
                            accept=".pdf"
                            style={{ display: "none" }}
                            onChange={handleDifficultyAnalyze}
                        />

                        {diffMsg && (
                            <div style={{
                                padding: "10px 14px",
                                border: "1px solid var(--border)",
                                background: "var(--card)",
                                fontSize: "0.84rem",
                                color: "var(--text-2)",
                                marginBottom: "8px"
                            }}>
                                {diffMsg}
                            </div>
                        )}

                        {diffWords.length > 0 && (
                            <div className="difficult-panel">
                                <div className="difficult-panel-header">
                                    <div>
                                        <h3>🔍 {diffWords.length} difficult words found</h3>
                                        {diffStats && (
                                            <p style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: "3px" }}>
                                                {diffStats.pages > 0 ? `${diffStats.pages} pages · ` : ""}
                                                {diffStats.totalTokens?.toLocaleString()} tokens · {diffStats.uniqueWords?.toLocaleString()} unique words scanned
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        style={{ width: "auto" }}
                                        onClick={addAllDiffWords}
                                    >
                                        + Add All
                                    </button>
                                </div>
                                <div className="difficult-panel-body">
                                    <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginBottom: "12px" }}>
                                        Ranked by difficulty — length, academic patterns, rarity in this document.
                                        Click a word to add it to your vocabulary.
                                    </p>
                                    {diffWords.map(w => (
                                        <span
                                            key={w}
                                            className={`difficult-word-chip ${diffAdded.has(w) ? "added" : ""}`}
                                            onClick={() => !diffAdded.has(w) && addDifficultWord(w)}
                                        >
                                            {w}
                                            <span className="chip-badge">
                                                {diffAdded.has(w) ? "✓" : "+ Add"}
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Inline word profile preview */}
                    {loadingProfile && (
                        <div style={{
                            border: "2px dashed var(--border)", padding: "28px",
                            textAlign: "center", background: "var(--card)", marginBottom: "26px"
                        }}>
                            <div className="loading-dots"><span/><span/><span/></div>
                            <p style={{ color: "var(--text-2)", marginTop: "10px", fontSize: "0.82rem" }}>
                                Building word profile…
                            </p>
                        </div>
                    )}

                    {newWordProfile && !loadingProfile && (
                        <div className="word-profile-inline">
                            <div className="word-profile-inline-header">
                                <h3>{newWordProfile.word}</h3>
                                <button className="word-profile-inline-close" onClick={() => setNewWordProfile(null)}>✕</button>
                            </div>
                            <div className="word-profile-inline-body">
                                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "13px", flexWrap: "wrap" }}>
                                    {newWordProfile.partOfSpeech && <span className="profile-pos">{newWordProfile.partOfSpeech}</span>}
                                    {newWordProfile.pronunciation && <span className="profile-phonetic">{newWordProfile.pronunciation}</span>}
                                    {newWordProfile.audio && (
                                        <button className="profile-audio-btn" onClick={() => new Audio(newWordProfile.audio).play()}>▶ Listen</button>
                                    )}
                                </div>
                                {newWordProfile.definitions?.[0] && (
                                    <div className="profile-main-def" style={{ marginBottom: "14px" }}>
                                        {newWordProfile.definitions[0].definition}
                                    </div>
                                )}
                                {newWordProfile.memoryHook && (
                                    <div style={{
                                        borderLeft: "4px solid var(--accent)", padding: "10px 14px",
                                        background: "var(--surface)", fontStyle: "italic",
                                        fontSize: "0.87rem", lineHeight: "1.65"
                                    }}>
                                        🧠 {newWordProfile.memoryHook}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recent words */}
                    {words.length > 0 && !newWordProfile && !loadingProfile && (
                        <div>
                            <p className="section-title">Recent words</p>
                            <div className="word-list">
                                {words.slice(0, 5).map(w => (
                                    <div key={w._id} className="word-card">
                                        <div className="word-card-top">
                                            <h3
                                                className="word-card-word-link"
                                                onClick={() => window.location.href = `/profile/${w.word}`}
                                            >
                                                {w.word} →
                                            </h3>
                                            <span className={`status-btn ${w.status === "learned" ? "learned" : "review"}`}>
                                                {w.status === "learned" ? "✓ Learned" : "Review"}
                                            </span>
                                        </div>
                                        <p className="meaning">{w.meaning}</p>
                                    </div>
                                ))}
                            </div>
                            {words.length > 5 && (
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => window.location.href = "/vocabulary"}
                                    style={{ width: "100%", marginTop: "0", borderTop: "none" }}
                                >
                                    View all {words.length} words →
                                </button>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default Dashboard;
