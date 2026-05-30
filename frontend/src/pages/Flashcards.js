import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";

function Flashcards() {
    const [words, setWords] = useState([]);
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);

    useEffect(() => {
        api.get("/words").then(res => setWords(res.data)).catch(console.log);
    }, []);

    if (words.length === 0) return (
        <div className="app-layout">
            <Navbar />
            <div className="main-content">
                <div className="page-container">
                    <div className="page-header"><h1>Flashcards</h1></div>
                    <div className="empty-state">
                        <div className="emoji">▣</div>
                        <p>Add some words first to start reviewing.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const word = words[index];

    const nextCard = () => { setFlipped(false); setTimeout(() => setIndex(p => (p + 1) % words.length), 150); };
    const prevCard = () => { setFlipped(false); setTimeout(() => setIndex(p => (p - 1 + words.length) % words.length), 150); };

    return (
        <div className="app-layout">
            <Navbar />
            <div className="main-content">
                <div className="flashcard-page">
                    <div className="page-header" style={{ textAlign: "center", borderBottom: "2px solid var(--black)", marginBottom: "32px" }}>
                        <h2>Flashcards</h2>
                        <p className="subtitle">Click card to reveal meaning</p>
                    </div>

                    <div className="flashcard" onClick={() => setFlipped(!flipped)}>
                        <div className={`flashcard-inner ${flipped ? "flipped" : ""}`}>
                            <div className="flashcard-front">
                                <h1>{word.word}</h1>
                                <p className="hint">Click to reveal</p>
                            </div>
                            <div className="flashcard-back">
                                <p className="meaning">{word.meaning}</p>
                                {word.exampleSentence && word.exampleSentence !== "No example available" && (
                                    <p className="example">"{word.exampleSentence}"</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flashcard-controls">
                        <button className="btn btn-ghost" onClick={prevCard}>← Prev</button>
                        <span className="card-counter">{index + 1} / {words.length}</span>
                        <button className="btn btn-primary" onClick={nextCard} style={{ width: "auto" }}>Next →</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Flashcards;
