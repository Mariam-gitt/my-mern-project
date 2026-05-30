import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function WordList({ words, onStatusChange }) {
    const navigate = useNavigate();
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [updating, setUpdating] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const toggleStatus = async (word) => {
        const newStatus = word.status === "learned" ? "review" : "learned";
        setUpdating(word._id);
        try {
            await api.patch(`/words/${word._id}/status`, { status: newStatus });
            if (onStatusChange) onStatusChange();
        } catch (err) { console.log(err); }
        finally { setUpdating(null); }
    };

    const handleDelete = async (e, word) => {
        e.stopPropagation();
        if (!window.confirm(`Remove "${word.word}" from your vocabulary?`)) return;
        setDeleting(word._id);
        try {
            await api.delete(`/words/${word._id}`);
            if (onStatusChange) onStatusChange();
        } catch {
            alert("Failed to delete word.");
        }
        finally { setDeleting(null); }
    };

    const filtered = words
        .filter(w => filter === "all" || w.status === filter)
        .filter(w =>
            w.word.toLowerCase().includes(search.toLowerCase()) ||
            w.meaning?.toLowerCase().includes(search.toLowerCase())
        );

    const learnedCount = words.filter(w => w.status === "learned").length;
    const reviewCount = words.filter(w => w.status !== "learned").length;

    return (
        <div>
            <input
                className="search-input"
                placeholder="Search words or meanings…"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <div className="filter-tabs">
                <button className={`filter-tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
                    All ({words.length})
                </button>
                <button className={`filter-tab ${filter === "review" ? "active" : ""}`} onClick={() => setFilter("review")}>
                    Review ({reviewCount})
                </button>
                <button className={`filter-tab ${filter === "learned" ? "active" : ""}`} onClick={() => setFilter("learned")}>
                    Learned ({learnedCount})
                </button>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="emoji">{search ? "?" : "+"}</div>
                    <p>{search ? `No words matching "${search}"` : "No words here yet."}</p>
                </div>
            ) : (
                <div className="word-list">
                    {filtered.map(w => (
                        <div key={w._id} className={`word-card ${w.status === "learned" ? "learned" : ""}`}>
                            <div className="word-card-top">
                                <h3 className="word-card-word-link" onClick={() => navigate(`/profile/${w.word}`)}>
                                    {w.word} →
                                </h3>
                                <div className="word-card-actions">
                                    <button
                                        className={`status-btn ${w.status === "learned" ? "learned" : "review"}`}
                                        onClick={() => toggleStatus(w)}
                                        disabled={updating === w._id}
                                    >
                                        {updating === w._id ? "…" : w.status === "learned" ? "✓ Learned" : "Review"}
                                    </button>
                                    <button
                                        className="btn-icon-delete"
                                        onClick={(e) => handleDelete(e, w)}
                                        disabled={deleting === w._id}
                                        title="Delete word"
                                    >
                                        {deleting === w._id ? "…" : "✕"}
                                    </button>
                                </div>
                            </div>
                            <p className="meaning">{w.meaning}</p>
                            {w.exampleSentence && w.exampleSentence !== "No example available" && (
                                <p className="example">"{w.exampleSentence}"</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default WordList;
