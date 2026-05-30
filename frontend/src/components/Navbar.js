import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const LINKS = [
    { path: "/dashboard",  icon: "⌂", label: "Dashboard" },
    { path: "/vocabulary", icon: "≡", label: "My Words" },
    { path: "/reader",     icon: "◎", label: "PDF Reader" },
    { path: "/flashcards", icon: "▣", label: "Flashcards" },
    { path: "/quiz",       icon: "◈", label: "Quiz" },
    { path: "/ocr",        icon: "⊙", label: "Scan" },
];

const BookIcon = ({ theme }) => (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
        {theme === "golden" ? (
            <>
                <rect x="4" y="4" width="24" height="24" rx="2" fill="#ffd060" opacity="0.9"/>
                <rect x="4" y="4" width="4" height="24" rx="1" fill="#3a6080"/>
                <line x1="10" y1="10" x2="24" y2="10" stroke="#3a6080" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="10" y1="14" x2="24" y2="14" stroke="#3a6080" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="10" y1="18" x2="20" y2="18" stroke="#3a6080" strokeWidth="1.5" strokeLinecap="round"/>
            </>
        ) : (
            <>
                <rect x="4" y="4" width="24" height="24" rx="2" fill="#9b2335" opacity="0.9"/>
                <rect x="4" y="4" width="4" height="24" rx="1" fill="#7d1b29"/>
                <line x1="10" y1="10" x2="24" y2="10" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="10" y1="14" x2="24" y2="14" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="10" y1="18" x2="20" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
            </>
        )}
    </svg>
);

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState(() => localStorage.getItem("wk-theme") || "crimson");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("wk-theme", theme);
    }, [theme]);

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-logo">
                    <BookIcon theme={theme} />
                    <span className="sidebar-name">WordKnit</span>
                </div>
                <p className="sidebar-tagline">Read · Learn · Retain</p>
            </div>

            <nav className="sidebar-nav">
                {LINKS.map(link => (
                    <div key={link.path}
                        className={`sidebar-link ${location.pathname === link.path ? "active" : ""}`}
                        onClick={() => navigate(link.path)}>
                        <span className="link-icon">{link.icon}</span>
                        {link.label}
                    </div>
                ))}
            </nav>

            <div className="sidebar-bottom">
                <div className="theme-switcher">
                    <span className="theme-switcher-label">Theme</span>
                    <div className="theme-pills">
                        <button
                            className={`theme-pill-btn ${theme === "crimson" ? "active" : ""}`}
                            onClick={() => setTheme("crimson")}
                            title="Bookish Crimson">
                            📕
                        </button>
                        <button
                            className={`theme-pill-btn ${theme === "golden" ? "active" : ""}`}
                            onClick={() => setTheme("golden")}
                            title="Golden Sky">
                            ☀️
                        </button>
                    </div>
                </div>
                <div className="sidebar-logout"
                    onClick={() => { localStorage.removeItem("token"); navigate("/"); }}>
                    <span className="link-icon">⇥</span>
                    Logout
                </div>
            </div>
        </aside>
    );
}

export default Navbar;
