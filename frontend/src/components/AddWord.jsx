import { useState } from "react";
import api from "../api";

function AddWord({ onWordAdded }) {
    const [word, setWord] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!word.trim()) return;
        setLoading(true);
        try {
            await api.post("/words", { word: word.trim() });
            const added = word.trim().toLowerCase();
            setWord("");
            onWordAdded(added); // pass word string back
        } catch (err) {
            alert(err.response?.data?.message || "Failed to add word");
        } finally { setLoading(false); }
    };

    return (
        <div className="add-word-box">
            <input
                value={word}
                onChange={e => setWord(e.target.value)}
                placeholder="Add a new word..."
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Adding..." : "+ Add"}
            </button>
        </div>
    );
}

export default AddWord;
