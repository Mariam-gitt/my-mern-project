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
    const [sidebarOpen, setSidebarOpen]       = useState(true);

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
        <div className="flex h-screen w-full bg-[#FDFBF7] overflow-hidden">
            {/* Moveable Sidebar */}
            <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-[#FDFBF7] border-r-2 border-black transition-all duration-300 flex flex-col`}>
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-4 text-left font-mono text-xs font-bold border-b border-black hover:bg-[#F5C754]"
                >
                    {sidebarOpen ? "« CLOSE" : "»"}
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <Navbar />
                <div className="page-container p-6">
                    {/* Your original logic structure continues here exactly as before */}
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
                            <div className="stat-number">{learnedCount}</div>
                            <div className="stat-label">Learned</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{words.length - learnedCount}</div>
                            <div className="stat-label">To Review</div>
                        </div>
                        <div className="stat-card clickable" onClick={() => pdfRef.current.click()}>
                            <div className="stat-number">{importing ? "…" : "+"}</div>
                            <div className="stat-label">{importing ? "Importing…" : "Import PDF"}</div>
                            <input ref={pdfRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handlePDFImport} />
                        </div>
                    </div>

                    {loadingProfile && (
                        <div className="flex flex-col items-center justify-center p-20">
                            {/* Knitting Yarn Ball Spinner */}
                            <div className="w-16 h-16 rounded-full border-4 border-[#F5C754] animate-spin border-t-transparent"></div>
                            <p className="mt-4 font-serif italic">Knitting vocabulary...</p>
                        </div>
                    )}
                    
                    {/* ... (Include the rest of your original Dashboard logic here) */}
                </div>
            </main>
        </div>
    );
}

export default Dashboard;

//new