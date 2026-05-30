import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";

function Quiz() {
    const [quiz, setQuiz]         = useState(null);
    const [score, setScore]       = useState(0);
    const [total, setTotal]       = useState(0);
    const [answered, setAnswered] = useState(false);
    const [selected, setSelected] = useState(null);
    const [error, setError]       = useState("");
    const [streak, setStreak]     = useState(0);

    useEffect(() => { loadQuiz(); }, []);

    const loadQuiz = async () => {
        try {
            setError(""); setQuiz(null); setAnswered(false); setSelected(null);
            const res = await api.get("/words/quiz");
            setQuiz(res.data);
            setTotal(t => t + 1);
        } catch (err) {
            setError(err.response?.data?.message || "Not enough words yet — add at least 4 words to start quizzing.");
        }
    };

    const checkAnswer = (opt) => {
        if (answered) return;
        setSelected(opt);
        const correct = opt === quiz.correctAnswer;
        if (correct) { setScore(s => s + 1); setStreak(s => s + 1); }
        else { setStreak(0); }
        setAnswered(true);
    };

    const getClass = (opt) => {
        if (!answered) return "quiz-option";
        if (opt === quiz.correctAnswer) return "quiz-option correct";
        if (opt === selected) return "quiz-option wrong";
        return "quiz-option";
    };

    const pct = total > 1 ? Math.round((score / (total - 1)) * 100) : 0;

    return (
        <div className="app-layout">
            <Navbar />
            <div className="main-content">
                <div className="page-container" style={{ maxWidth: "620px" }}>

                    <div className="page-header">
                        <h1>Quiz</h1>
                        <p>Test your vocabulary knowledge.</p>
                    </div>

                    {/* Score row */}
                    <div className="stats-row" style={{ marginBottom: "28px" }}>
                        <div className="stat-card">
                            <div className="stat-number" style={{ color: "var(--green)" }}>{score}</div>
                            <div className="stat-label">Correct</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number" style={{ color: "var(--accent)" }}>
                                {total > 1 ? total - 1 - score : 0}
                            </div>
                            <div className="stat-label">Wrong</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{streak}</div>
                            <div className="stat-label">Streak 🔥</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{total > 1 ? `${pct}%` : "—"}</div>
                            <div className="stat-label">Accuracy</div>
                        </div>
                    </div>

                    {/* Error state */}
                    {error && (
                        <div style={{ textAlign: "center" }}>
                            <div className="empty-state">
                                <div className="emoji">◈</div>
                                <p style={{ marginBottom: "16px" }}>{error}</p>
                                <button className="btn btn-ghost" onClick={loadQuiz} style={{ width: "auto" }}>
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {!error && !quiz && (
                        <div style={{ textAlign: "center", padding: "50px" }}>
                            <div className="loading-dots"><span/><span/><span/></div>
                        </div>
                    )}

                    {/* Quiz card */}
                    {quiz && (
                        <>
                            <div className="quiz-card">
                                <p className="quiz-instruction" style={{ marginBottom: "10px" }}>
                                    What does this word mean?
                                </p>
                                <div className="quiz-word">"{quiz.word}"</div>
                            </div>

                            <div className="quiz-options">
                                {quiz.options.map((opt, i) => (
                                    <button key={i}
                                        className={getClass(opt)}
                                        onClick={() => checkAnswer(opt)}
                                        disabled={answered}>
                                        <span style={{
                                            display: "inline-block",
                                            width: "22px",
                                            fontWeight: 700,
                                            color: "var(--text-3)",
                                            flexShrink: 0
                                        }}>
                                            {["A", "B", "C", "D"][i]}.
                                        </span>
                                        {opt}
                                    </button>
                                ))}
                            </div>

                            {answered && (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    marginTop: "16px",
                                    padding: "14px 18px",
                                    border: `2px solid ${selected === quiz.correctAnswer ? "var(--green)" : "var(--accent)"}`,
                                    background: selected === quiz.correctAnswer ? "#e8f5e9" : "var(--accent-bg)"
                                }}>
                                    <span style={{
                                        fontSize: "1.3rem",
                                        flexShrink: 0
                                    }}>
                                        {selected === quiz.correctAnswer ? "✓" : "✗"}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <p style={{
                                            fontWeight: 700,
                                            fontSize: "0.85rem",
                                            color: selected === quiz.correctAnswer ? "var(--green)" : "var(--accent)",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.07em"
                                        }}>
                                            {selected === quiz.correctAnswer ? "Correct!" : "Incorrect"}
                                        </p>
                                        {selected !== quiz.correctAnswer && (
                                            <p style={{ fontSize: "0.82rem", color: "var(--text-2)", marginTop: "3px" }}>
                                                Answer: {quiz.correctAnswer}
                                            </p>
                                        )}
                                        {streak > 1 && selected === quiz.correctAnswer && (
                                            <p style={{ fontSize: "0.8rem", color: "var(--green)", marginTop: "3px" }}>
                                                {streak} in a row! 🔥
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={loadQuiz}
                                        style={{ width: "auto", flexShrink: 0 }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Quiz;
