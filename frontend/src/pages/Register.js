import { useState, useEffect } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const navigate = useNavigate();
    useEffect(() => { const s = localStorage.getItem("wk-theme") || "crimson"; document.documentElement.setAttribute("data-theme", s); }, []);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async () => {
        setLoading(true); setError("");
        try {
            await API.post("/auth/register", { name, email, password });
            navigate("/");
        } catch {
            setError("Registration failed. Please try again.");
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="13" fill="#c0392b"/>
                        <path d="M6,12 Q16,8 26,12" stroke="white" strokeWidth="1.2" fill="none" opacity="0.6"/>
                        <path d="M5,16 Q16,11 27,16" stroke="white" strokeWidth="1.2" fill="none" opacity="0.8"/>
                        <path d="M6,20 Q16,15 26,20" stroke="white" strokeWidth="1.2" fill="none" opacity="0.6"/>
                        <path d="M10,6 Q14,16 10,26" stroke="white" strokeWidth="1.2" fill="none" opacity="0.5"/>
                        <path d="M16,4 Q18,16 16,28" stroke="white" strokeWidth="1.2" fill="none" opacity="0.7"/>
                        <path d="M22,6 Q18,16 22,26" stroke="white" strokeWidth="1.2" fill="none" opacity="0.5"/>
                        <path d="M26,18 Q30,20 32,24" stroke="#c0392b" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.5px" }}>WordKnit</span>
                </div>

                <h2 className="auth-brand-name" style={{ marginBottom: "4px", fontSize: "1.5rem" }}>Start reading smarter</h2>
                <p className="auth-brand-sub" style={{ marginBottom: "24px" }}>Create your vocabulary companion</p>

                <div className="input-group">
                    <input placeholder="Your name" onChange={e => setName(e.target.value)}/>
                    <input type="email" placeholder="Email address" onChange={e => setEmail(e.target.value)}/>
                    <input type="password" placeholder="Password"
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleRegister()}/>
                </div>

                {error && <p style={{ color: "var(--red)", fontSize: "0.85rem", marginBottom: "12px" }}>{error}</p>}

                <button className="btn btn-primary" onClick={handleRegister} disabled={loading}>
                    {loading ? "Creating..." : "Create Account"}
                </button>

                <p className="auth-link">
                    Already have an account? <span onClick={() => navigate("/")}>Sign in</span>
                </p>
            </div>
        </div>
    );
}
