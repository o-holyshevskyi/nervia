"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useCallback, useLayoutEffect, useRef } from "react";

const STORAGE_KEY = "theme";

function getShouldBeDark(theme: string): boolean {
    if (typeof window === "undefined") return false;
    return (
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
}

function applyThemeToDocument(theme: string) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const isDark = getShouldBeDark(theme);
    if (isDark) {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }
}

export default function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const appliedRef = useRef<string | null>(null);

    const effectiveTheme = resolvedTheme ?? theme ?? "light";
    const themeToApply = theme === "system" ? "system" : effectiveTheme;

    // Apply immediately on mount and whenever theme changes (useLayoutEffect runs sync after DOM)
    useLayoutEffect(() => {
        applyThemeToDocument(themeToApply);
        appliedRef.current = themeToApply;
    }, [themeToApply]);

    // If something (e.g. React) removes the class, re-apply from localStorage
    useLayoutEffect(() => {
        const root = document.documentElement;
        const observer = new MutationObserver(() => {
            const stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
            const wantDark = stored === "dark" || (stored === "system" && getShouldBeDark("system"));
            const hasDark = root.classList.contains("dark");
            if (wantDark !== hasDark) {
                applyThemeToDocument(stored ?? "light");
            }
        });
        observer.observe(root, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    const handleThemeChange = useCallback(
        (value: "light" | "dark" | "system") => {
            setTheme(value);
            applyThemeToDocument(value);
            appliedRef.current = value;
        },
        [setTheme]
    );

    const options = [
        { value: "light" as const, icon: Sun, label: "Light" },
        { value: "dark" as const, icon: Moon, label: "Dark" },
        { value: "system" as const, icon: Monitor, label: "System" },
    ];

    return (
        <div
            role="group"
            aria-label="Theme"
            className="flex h-8 w-[7.5rem] rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-0.5 shrink-0"
        >
            {options.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    type="button"
                    title={label}
                    aria-label={label}
                    aria-pressed={theme === value}
                    onClick={() => handleThemeChange(value)}
                    className={`flex-1 flex items-center justify-center rounded-full transition-all duration-200 hover:cursor-pointer ${
                        theme === value
                            ? "bg-indigo-500/20 dark:bg-cyan-500/20 text-indigo-600 dark:text-cyan-400 border border-indigo-500/30 dark:border-cyan-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] dark:shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                            : "text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                >
                    <Icon size={14} />
                </button>
            ))}
        </div>
    );
}
