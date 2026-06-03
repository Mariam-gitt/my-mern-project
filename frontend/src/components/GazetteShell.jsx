import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import YarnBallLogo from "./YarnBallLogo";
import { NAV_LINKS } from "../navLinks";

const ASIDE_MIN = 240;
const ASIDE_MAX_RATIO = 0.45;
const ASIDE_DEFAULT = 320;

function GazetteShell({ children, rightSlot, reader, statusCount }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [sectionsOpen, setSectionsOpen] = useState(false);
    const [asideWidth, setAsideWidth] = useState(() => {
        const saved = parseInt(localStorage.getItem("wk-gazette-aside-w"), 10);
        return saved > ASIDE_MIN ? saved : ASIDE_DEFAULT;
    });
    const dragging = useRef(false);

    useEffect(() => {
        if (!sectionsOpen) return;
        const onKey = (e) => { if (e.key === "Escape") setSectionsOpen(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [sectionsOpen]);

    useEffect(() => {
        document.body.style.overflow = sectionsOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [sectionsOpen]);

    const closeSections = () => setSectionsOpen(false);

    const goTo = (path) => {
        navigate(path);
        closeSections();
    };

    const onResizeStart = useCallback((e) => {
        e.preventDefault();
        dragging.current = true;
        const startX = e.clientX;
        const startW = asideWidth;

        const onMove = (ev) => {
            if (!dragging.current) return;
            const maxW = window.innerWidth * ASIDE_MAX_RATIO;
            const delta = startX - ev.clientX;
            const next = Math.min(maxW, Math.max(ASIDE_MIN, startW + delta));
            setAsideWidth(next);
        };

        const onUp = () => {
            dragging.current = false;
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            setAsideWidth((w) => {
                localStorage.setItem("wk-gazette-aside-w", String(Math.round(w)));
                return w;
            });
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    }, [asideWidth]);

    const count = statusCount ?? "—";

    return (
        <div className={`gazette-viewport${reader ? " gazette-viewport--reader" : ""}`}>
            <div className="gazette-frame">
                <header className="gazette-header">
                    <button
                        type="button"
                        className="gazette-sections-btn"
                        onClick={() => setSectionsOpen((o) => !o)}
                        aria-expanded={sectionsOpen}
                        aria-label="Open sections menu"
                    >
                        <span className="gazette-hamburger" aria-hidden="true">
                            <span /><span />
                        </span>
                        <span className="gazette-sections-label">Sections</span>
                    </button>

                    <div className="gazette-logo-center">
                        <YarnBallLogo size={30} />
                        <span className="gazette-brand-text">WordKnit.</span>
                    </div>

                    <div className="gazette-status">
                        <span className="gazette-status-label">Active thread stack</span>
                        <span className="gazette-status-value">
                            <span className="gazette-status-dot" aria-hidden="true" />
                            {typeof count === "number" ? `${count} Saved Elements` : count}
                        </span>
                    </div>
                </header>

                <div className="gazette-header-rule" />

                {sectionsOpen && (
                    <button
                        type="button"
                        className="gazette-backdrop"
                        aria-label="Close menu"
                        onClick={closeSections}
                    />
                )}

                <nav className={`gazette-drawer${sectionsOpen ? " open" : ""}`} aria-hidden={!sectionsOpen}>
                    <p className="gazette-drawer-title">Sections</p>
                    {NAV_LINKS.map((link) => (
                        <button
                            key={link.path}
                            type="button"
                            className={`gazette-drawer-link${location.pathname === link.path ? " active" : ""}`}
                            onClick={() => goTo(link.path)}
                        >
                            <span className="link-icon">{link.icon}</span>
                            {link.label}
                        </button>
                    ))}
                    <div className="gazette-drawer-footer">
                        <button
                            type="button"
                            className="gazette-drawer-link gazette-drawer-logout"
                            onClick={() => {
                                localStorage.removeItem("token");
                                navigate("/");
                                closeSections();
                            }}
                        >
                            <span className="link-icon">⇥</span>
                            Logout
                        </button>
                    </div>
                </nav>

                <div className={`gazette-body${rightSlot ? " has-aside" : ""}${reader ? " gazette-body--reader" : ""}`}>
                    <main className="gazette-main">{children}</main>
                    {rightSlot && (
                        <>
                            <div
                                className="gazette-resizer"
                                role="separator"
                                aria-orientation="vertical"
                                onPointerDown={onResizeStart}
                            >
                                <span className="gazette-resizer-pill" />
                            </div>
                            <aside className="gazette-aside" style={{ width: asideWidth }}>
                                {rightSlot}
                            </aside>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default GazetteShell;
