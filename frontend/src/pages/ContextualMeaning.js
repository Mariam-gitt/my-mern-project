import { useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";

function ContextualMeaning() {
    // --- YOUR ORIGINAL LOGIC PRESERVED ---
    const [paragraph, setParagraph] = useState("");
    const [word, setWord] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);
    
    // --- NEW UI STATE ---
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleExplain = async () => {
        if (!paragraph.trim() || !word.trim()) {
            setError("Please paste a paragraph and enter a word.");
            return;
        }
        setLoading(true);
        setError("");
        setResult(null);
        setAdded(false);

        try {
            const res = await api.post("/contextual/explain", { paragraph, word });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to get explanation.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddToVocab = async () => {
        if (!result) return;
        setAdding(true);
        try {
            await api.post("/words", {
                word: word.trim().toLowerCase(),
                meaning: result.explanation,
                exampleSentence: result.example || "No example available",
                source: "Contextual"
            });
            setAdded(true);
        } catch (err) {
            setError("Failed to add word.");
        } finally {
            setAdding(false);
        }
    };

    const highlightWord = (text, w) => {
        if (!w) return text;
        const regex = new RegExp(`\\b(${w})\\b`, 'gi');
        return text.replace(regex, `<mark>$1</mark>`);
    };

    const handleWordClick = (e) => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            const selected = selection.toString().trim().toLowerCase().replace(/[^a-z]/g, '');
            if (selected) setWord(selected);
        }
    };

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
                <div className="dashboard-page p-6">
                    <div className="dashboard-header">
                        <h1>Contextual Meaning 🔍</h1>
                        <p>Paste any paragraph — we'll explain a word exactly in that context.</p>
                    </div>

                    {/* Paragraph input */}
                    <div className="context-card border-2 border-black p-4 bg-white">
                        <label className="context-label font-bold">Paste your paragraph here</label>
                        <textarea
                            className="context-textarea w-full border border-black p-2 mt-2"
                            placeholder="Paste the paragraph you're reading here..."
                            value={paragraph}
                            onChange={e => setParagraph(e.target.value)}
                            rows={6}
                        />
                        {paragraph && (
                            <div
                                className="paragraph-preview mt-4 p-4 bg-[#FDFBF7] border border-black"
                                onMouseUp={handleWordClick}
                                dangerouslySetInnerHTML={{
                                    __html: result ? highlightWord(paragraph, word) : paragraph
                                }}
                            />
                        )}
                    </div>

                    {/* Word input */}
                    <div className="context-card mt-4 p-4 border-2 border-black">
                        <label className="context-label font-bold">Which word confuses you?</label>
                        <div className="flex gap-2 mt-2">
                            <input
                                placeholder="Type or select..."
                                value={word}
                                onChange={e => setWord(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
                                className="border border-black p-2 flex-1"
                            />
                            <button className="bg-[#F5C754] border-2 border-black px-4 font-bold" onClick={handleExplain} disabled={loading}>
                                {loading ? "Thinking..." : "🔍 Explain"}
                            </button>
                        </div>
                    </div>

                    {/* Knitting Yarn Ball Loader */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center p-20">
                            <div className="w-16 h-16 rounded-full border-4 border-[#F5C754] animate-spin border-t-transparent"></div>
                            <p className="mt-4 font-serif italic">Knitting your explanation...</p>
                        </div>
                    )}

                    {/* Result */}
                    {result && !loading && (
                        <div className="context-result mt-6 p-4 border-2 border-black">
                            <div className="result-word font-bold text-xl">"{word}"</div>
                            <p className="mt-2">{result.explanation}</p>
                            <button className="mt-4 bg-[#F5C754] border-2 border-black p-2 font-bold" onClick={handleAddToVocab} disabled={adding || added}>
                                {added ? "✅ Added!" : adding ? "Adding..." : "+ Add to My Words"}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default ContextualMeaning;