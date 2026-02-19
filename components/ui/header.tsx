"use client";

import React from "react";
import { Code2, History, Keyboard } from "lucide-react";

interface HeaderProps {
    onHistoryClick: () => void;
}

export function Header({ onHistoryClick }: HeaderProps) {
    return (
        <header className="flex-shrink-0 h-12 sm:h-14 border-b border-white/10 bg-zinc-950 flex items-center justify-between px-3 sm:px-6 z-50">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
                    <Code2 size={16} className="text-black fill-current sm:w-[18px] sm:h-[18px]" />
                </div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
                    Prompt<span className="text-amber-500">UI</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                    Beta
                </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {/* Keyboard Shortcut Hint */}
                <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-zinc-500 mr-2">
                    <Keyboard size={12} />
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[9px]">
                        Ctrl+↵
                    </kbd>
                    <span>to generate</span>
                </div>

                {/* GitHub link — inline SVG so it always works */}
                <a
                    href="https://github.com/Ramnivas11/PromptUI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 sm:p-2 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/5 hover:border-white/10"
                    title="GitHub"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                </a>

                <button
                    onClick={onHistoryClick}
                    className="p-1.5 sm:p-2 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/5 hover:border-white/10"
                    title="History"
                >
                    <History size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
            </div>
        </header>
    );
}
