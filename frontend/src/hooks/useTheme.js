import { useEffect, useState } from "react";

function resolveTheme(stored) {
    if (!stored || stored === "crimson") return "gazette";
    return stored;
}

export function useTheme() {
    const [theme, setTheme] = useState(() => resolveTheme(localStorage.getItem("wk-theme")));

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("wk-theme", theme);
    }, [theme]);

    return { theme, setTheme, isGazette: theme === "gazette" };
}

export function applyTheme(theme) {
    const t = resolveTheme(theme || localStorage.getItem("wk-theme"));
    document.documentElement.setAttribute("data-theme", t);
    if (!theme) localStorage.setItem("wk-theme", t);
}
