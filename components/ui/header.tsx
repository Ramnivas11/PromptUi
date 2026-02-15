import React from "react";
import { Code2, History } from "lucide-react";

interface HeaderProps {
    onHistoryClick: () => void;
}

export function Header({ onHistoryClick }: HeaderProps) {
    return (
        <header className="flex-shrink-0 h-14 border-b border-white/10 bg-zinc-950 flex items-center justify-between px-4 sm:px-6 z-50">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Code2 size={18} className="text-black fill-current" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">
                    Prompt<span className="text-amber-500">UI</span>
                </span>
            </div>
            <button
                onClick={onHistoryClick}
                className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-white/5 hover:border-white/10"
                title="History"
            >
                <History size={18} />
            </button>
        </header>
    );
}
