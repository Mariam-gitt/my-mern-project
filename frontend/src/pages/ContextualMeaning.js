// import { useState } from "react";
// import api from "../api";
// import Navbar from "../components/Navbar";

// function ContextualMeaning() {
//     const [paragraph, setParagraph] = useState("");
//     const [word, setWord] = useState("");
//     const [result, setResult] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [adding, setAdding] = useState(false);
//     const [added, setAdded] = useState(false);

//     const handleExplain = async () => {
//         if (!paragraph.trim() || !word.trim()) {
//             setError("Please paste a paragraph and enter a word.");
//             return;
//         }
//         setLoading(true);
//         setError("");
//         setResult(null);
//         setAdded(false);

//         try {
//             const res = await api.post("/contextual/explain", { paragraph, word });
//             setResult(res.data);
//         } catch (err) {
//             setError(err.response?.data?.message || "Failed to get explanation.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleAddToVocab = async () => {
//         if (!result) return;
//         setAdding(true);
//         try {
//             await api.post("/words", {
//                 word: word.trim().toLowerCase(),
//                 meaning: result.explanation,
//                 exampleSentence: result.example || "No example available",
//                 source: "Contextual"
//             });
//             setAdded(true);
//         } catch (err) {
//             setError("Failed to add word.");
//         } finally {
//             setAdding(false);
//         }
//     };

//     // Highlight the looked-up word in paragraph
//     const highlightWord = (text, w) => {
//         if (!w) return text;
//         const regex = new RegExp(`\\b(${w})\\b`, 'gi');
//         return text.replace(regex, `<mark>$1</mark>`);
//     };

//     // Handle clicking a word in the paragraph
//     const handleWordClick = (e) => {
//         const selection = window.getSelection();
//         if (selection && selection.toString().trim()) {
//             const selected = selection.toString().trim().toLowerCase().replace(/[^a-z]/g, '');
//             if (selected) setWord(selected);
//         }
//     };

//     return (
//         <div>
//             <Navbar />
//             <div className="dashboard-page">

//                 <div className="dashboard-header">
//                     <h1>Contextual Meaning 🔍</h1>
//                     <p>Paste any paragraph — we'll explain a word exactly in that context.</p>
//                 </div>

//                 {/* Paragraph input */}
//                 <div className="context-card">
//                     <label className="context-label">Paste your paragraph here</label>
//                     <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "10px" }}>
//                         💡 Tip: After pasting, you can also <strong>select/highlight a word</strong> directly in the paragraph below
//                     </p>
//                     <textarea
//                         className="context-textarea"
//                         placeholder="Paste the paragraph you're reading here..."
//                         value={paragraph}
//                         onChange={e => setParagraph(e.target.value)}
//                         rows={6}
//                     />

//                     {/* Clickable paragraph preview */}
//                     {paragraph && (
//                         <div
//                             className="paragraph-preview"
//                             onMouseUp={handleWordClick}
//                             dangerouslySetInnerHTML={{
//                                 __html: result
//                                     ? highlightWord(paragraph, word)
//                                     : paragraph
//                             }}
//                         />
//                     )}
//                 </div>

//                 {/* Word input */}
//                 <div className="context-card" style={{ marginTop: "16px" }}>
//                     <label className="context-label">Which word confuses you?</label>
//                     <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
//                         <input
//                             placeholder="Type or select the word above..."
//                             value={word}
//                             onChange={e => setWord(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
//                             style={{ flex: 1, margin: 0 }}
//                             onKeyDown={e => e.key === "Enter" && handleExplain()}
//                         />
//                         <button
//                             className="btn btn-primary"
//                             style={{ width: "auto", whiteSpace: "nowrap" }}
//                             onClick={handleExplain}
//                             disabled={loading}
//                         >
//                             {loading ? "Thinking..." : "🔍 Explain"}
//                         </button>
//                     </div>
//                 </div>

//                 {/* Error */}
//                 {error && (
//                     <div className="context-error">❌ {error}</div>
//                 )}

//                 {/* Loading */}
//                 {loading && (
//                     <div className="context-card" style={{ textAlign: "center", padding: "40px" }}>
//                         <div className="loading-dots">
//                             <span></span><span></span><span></span>
//                         </div>
//                         <p style={{ color: "var(--text-muted)", marginTop: "12px" }}>
//                             Llama is reading your paragraph...
//                         </p>
//                     </div>
//                 )}

//                 {/* Result */}
//                 {result && !loading && (
//                     <div className="context-result">
//                         <div className="result-word">"{word}"</div>

//                         <div className="result-section">
//                             <p className="result-label">In this context means:</p>
//                             <p className="result-explanation">{result.explanation}</p>
//                         </div>

//                         {result.example && (
//                             <div className="result-section">
//                                 <p className="result-label">Simpler way to think about it:</p>
//                                 <p className="result-simpler">{result.example}</p>
//                             </div>
//                         )}

//                         {result.relatedWords && result.relatedWords.length > 0 && (
//                             <div className="result-section">
//                                 <p className="result-label">Related words:</p>
//                                 <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
//                                     {result.relatedWords.map(w => (
//                                         <span key={w} className="related-chip">{w}</span>
//                                     ))}
//                                 </div>
//                             </div>
//                         )}

//                         <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
//                             <button
//                                 className="btn btn-primary"
//                                 style={{ width: "auto" }}
//                                 onClick={handleAddToVocab}
//                                 disabled={adding || added}
//                             >
//                                 {added ? "✅ Added to vocab!" : adding ? "Adding..." : "+ Add to My Words"}
//                             </button>
//                             <button
//                                 className="btn btn-ghost"
//                                 style={{ width: "auto" }}
//                                 onClick={() => { setResult(null); setWord(""); setAdded(false); }}
//                             >
//                                 Try another word
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }

// export default ContextualMeaning;

import { useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";

function ContextualMeaning() {
    const [paragraph, setParagraph] = useState("");
    const [word, setWord] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);

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

    // Highlight the looked-up word in paragraph
    const highlightWord = (text, w) => {
        if (!w) return text;
        const regex = new RegExp(`\\b(${w})\\b`, 'gi');
        return text.replace(regex, `<mark>$1</mark>`);
    };

    // Handle clicking a word in the paragraph
    const handleWordClick = (e) => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            const selected = selection.toString().trim().toLowerCase().replace(/[^a-z]/g, '');
            if (selected) setWord(selected);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="dashboard-page">

                <div className="dashboard-header">
                    <h1>Contextual Meaning 🔍</h1>
                    <p>Paste any paragraph — we'll explain a word exactly in that context.</p>
                </div>

                {/* Paragraph input */}
                <div className="context-card">
                    <label className="context-label">Paste your paragraph here</label>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                        💡 Tip: After pasting, you can also <strong>select/highlight a word</strong> directly in the paragraph below
                    </p>
                    <textarea
                        className="context-textarea"
                        placeholder="Paste the paragraph you're reading here..."
                        value={paragraph}
                        onChange={e => setParagraph(e.target.value)}
                        rows={6}
                    />

                    {/* Clickable paragraph preview */}
                    {paragraph && (
                        <div
                            className="paragraph-preview"
                            onMouseUp={handleWordClick}
                            dangerouslySetInnerHTML={{
                                __html: result
                                    ? highlightWord(paragraph, word)
                                    : paragraph
                            }}
                        />
                    )}
                </div>

                {/* Word input */}
                <div className="context-card" style={{ marginTop: "16px" }}>
                    <label className="context-label">Which word confuses you?</label>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <input
                            placeholder="Type or select the word above..."
                            value={word}
                            onChange={e => setWord(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
                            style={{ flex: 1, margin: 0 }}
                            onKeyDown={e => e.key === "Enter" && handleExplain()}
                        />
                        <button
                            className="btn btn-primary"
                            style={{ width: "auto", whiteSpace: "nowrap" }}
                            onClick={handleExplain}
                            disabled={loading}
                        >
                            {loading ? "Thinking..." : "🔍 Explain"}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="context-error">❌ {error}</div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="context-card" style={{ textAlign: "center", padding: "40px" }}>
                        <div className="loading-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <p style={{ color: "var(--text-muted)", marginTop: "12px" }}>
                            Llama is reading your paragraph...
                        </p>
                    </div>
                )}

                {/* Result */}
                {result && !loading && (
                    <div className="context-result">
                        <div className="result-word">"{word}"</div>

                        <div className="result-section">
                            <p className="result-label">In this context means:</p>
                            <p className="result-explanation">{result.explanation}</p>
                        </div>

                        {result.example && (
                            <div className="result-section">
                                <p className="result-label">Simpler way to think about it:</p>
                                <p className="result-simpler">{result.example}</p>
                            </div>
                        )}

                        {Array.isArray(result.relatedWords) && result.relatedWords.length > 0 && (
                            <div className="result-section">
                                <p className="result-label">Related words:</p>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {(Array.isArray(result.relatedWords) ? result.relatedWords : result.relatedWords.split(",").map(w => w.trim())).map(w => (
                                        <span key={w} className="related-chip">{w}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
                            <button
                                className="btn btn-primary"
                                style={{ width: "auto" }}
                                onClick={handleAddToVocab}
                                disabled={adding || added}
                            >
                                {added ? "✅ Added to vocab!" : adding ? "Adding..." : "+ Add to My Words"}
                            </button>
                            <button
                                className="btn btn-ghost"
                                style={{ width: "auto" }}
                                onClick={() => { setResult(null); setWord(""); setAdded(false); }}
                            >
                                Try another word
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ContextualMeaning;
