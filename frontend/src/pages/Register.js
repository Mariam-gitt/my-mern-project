import { useState, useEffect } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import YarnBallLogo from "../components/YarnBallLogo";
import { applyTheme } from "../hooks/useTheme";

export default function Register() {
    const navigate = useNavigate();
    useEffect(() => { applyTheme(localStorage.getItem("wk-theme") || "gazette"); }, []);
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
                <div className="auth-brand">
                    <div className="auth-brand-logo">
                        <YarnBallLogo size={36} />
                    </div>
                    <div className="auth-brand-name">WordKnit.</div>
                    <div className="auth-brand-sub">Create your vocabulary companion</div>
                </div>

                <div className="input-group">
                    <input placeholder="Your name" onChange={e => setName(e.target.value)}/>
                    <input type="email" placeholder="Email address" onChange={e => setEmail(e.target.value)}/>
                    <input type="password" placeholder="Password"
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleRegister()}/>
                </div>

                {error && <p className="auth-error">{error}</p>}

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
