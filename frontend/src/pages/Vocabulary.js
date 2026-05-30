import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import WordList from "../components/WordList";

function Vocabulary() {
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchWords = async () => {
        try {
            const res = await api.get("/words");
            setWords(res.data);
        } catch (err) { console.log(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchWords(); }, []);

    const learnedCount = words.filter(w => w.status === "learned").length;
    const reviewCount = words.length - learnedCount;

    return (
        <div className="app-layout">
            <Navbar />
            <div className="main-content">
                <div className="page-container">
                    <div className="page-header">
                        <h1>My Words</h1>
                        <p>Search, filter and manage your vocabulary collection.</p>
                    </div>

                    <div className="stats-row" style={{ marginBottom: "20px" }}>
                        <div className="stat-card">
                            <div className="stat-number">{words.length}</div>
                            <div className="stat-label">Total</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number" style={{ color: "#1b5e20" }}>{learnedCount}</div>
                            <div className="stat-label">Learned</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number" style={{ color: "var(--red)" }}>{reviewCount}</div>
                            <div className="stat-label">To Review</div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "40px" }}>
                            <div className="loading-dots"><span/><span/><span/></div>
                        </div>
                    ) : (
                        <WordList words={words} onStatusChange={fetchWords} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Vocabulary;
