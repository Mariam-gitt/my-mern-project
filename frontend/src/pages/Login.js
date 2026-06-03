import { useState, useEffect } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import YarnBallLogo from "../components/YarnBallLogo";
import { applyTheme } from "../hooks/useTheme";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState("");

    useEffect(() => {
        applyTheme(localStorage.getItem("wk-theme") || "gazette");
    }, []);

    const handleLogin = async () => {
        setLoading(true); setError("");
        try {
            const res = await API.post("/auth/login", { email, password });
            localStorage.setItem("token", res.data.token);
            navigate("/dashboard");
        } catch { setError("Invalid email or password."); }
        finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <div className="auth-brand-logo">
                        <YarnBallLogo size={36} />
                    </div>
                    <div className="auth-brand-name">WordKnit.</div>
                    <div className="auth-brand-sub">Read · Learn · Retain</div>
                </div>

                <div className="input-group">
                    <label className="input-label">Email</label>
                    <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}/>
                </div>
                <div className="input-group">
                    <label className="input-label">Password</label>
                    <input type="password" placeholder="••••••••" value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleLogin()}/>
                </div>

                {error && <p className="auth-error">{error}</p>}

                <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
                    {loading ? "Signing in…" : "Sign In"}
                </button>

                <p className="auth-link">
                    New here? <span onClick={() => navigate("/register")}>Create an account</span>
                </p>
            </div>
        </div>
    );
}
