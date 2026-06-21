"use client";

import React from "react";
import { Code2, History, Keyboard } from "lucide-react";
import { useStorageQuota } from "@/hooks/use-storage-quota";

interface HeaderProps {
    onHistoryClick: () => void;
}

export function Header({ onHistoryClick }: HeaderProps) {
    const { quota, status } = useStorageQuota();

    return (
        <header className="flex-shrink-0 h-20 border-b border-border bg-transparent flex items-center justify-between px-8 md:px-16 z-50">
            <div className="flex items-center gap-6 min-w-0">
                <div className="flex items-center justify-center p-2 border border-border flex-shrink-0">
                    <Code2 size={24} className="text-charcoal stroke-[1.5]" />
                </div>
                <span className="text-2xl tracking-tight text-foreground whitespace-nowrap">
                    <span className="font-editorial capitalize">Prompt</span>
                    <span className="font-sans uppercase tracking-widest text-xs ml-1 text-gold">UI</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-3 py-1 bg-transparent text-muted-foreground text-[10px] uppercase tracking-[0.25em] border border-border">
                    BETA
                </span>
            </div>
            <div className="flex items-center gap-6 flex-shrink-0">
                {/* Keyboard Shortcut Hint */}
                <div className="hidden lg:flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mr-4">
                    <Keyboard size={14} className="stroke-[1.5]" />
                    <kbd className="px-2 py-1 border border-border/50 text-muted-foreground font-sans tracking-widest">
                        CTRL+↵
                    </kbd>
                    <span>To Generate</span>
                </div>

                {/* Storage Status */}
                {quota.percentUsed > 0.7 && (
                    <div className="hidden md:block mr-4 text-[10px] uppercase tracking-[0.2em] text-amber-600 font-medium border border-amber-200 px-3 py-1 bg-amber-50">
                        Storage: {status}
                    </div>
                )}

                {/* GitHub link */}
                <a
                    href="https://github.com/Ramnivas11/PromptUI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 border border-transparent hover:border-border text-muted-foreground hover:text-charcoal transition-all duration-500 ease-out"
                    title="GitHub"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                </a>

                <button
                    onClick={onHistoryClick}
                    className="group relative overflow-hidden px-8 py-3 border border-border bg-transparent text-charcoal transition-all duration-500 ease-out flex items-center gap-3"
                    title="History"
                >
                    <span className="absolute inset-0 bg-[#A0A0A0] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] z-0"></span>
                    <History size={16} className="relative z-10 stroke-[1.5] group-hover:text-white transition-colors duration-500 delay-100" />
                    <span className="hidden sm:inline relative z-10 text-xs tracking-[0.2em] uppercase font-medium group-hover:text-white transition-colors duration-500 delay-100">History</span>
                </button>
            </div>
        </header>
    );
}
