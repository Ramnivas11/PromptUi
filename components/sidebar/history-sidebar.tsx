"use client";

import React, { useEffect, useState } from "react";
import { History, X, Clock, ChevronRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// import { cn } from "@/lib/utils";

interface HistoryItem {
    prompt: string;
    code: string;
    timestamp: number;
}

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: HistoryItem) => void;
}

export function HistorySidebar({ isOpen, onClose, onSelect }: HistorySidebarProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        // Load history from localStorage
        const saved = localStorage.getItem("promptui_history");
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, [isOpen]); // Reload when opened

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem("promptui_history");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />

                    {/* Sidebar Panel */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed left-0 top-0 bottom-0 w-[300px] bg-black border-r border-white/10 z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-zinc-950">
                            <div className="flex items-center gap-2 text-zinc-100 font-semibold uppercase tracking-wide text-xs">
                                <History size={16} className="text-amber-500" />
                                <span>History</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {history.length === 0 ? (
                                <div className="text-center text-zinc-600 py-12 text-sm">
                                    <Clock size={24} className="mx-auto mb-3 opacity-20" />
                                    No history yet.
                                </div>
                            ) : (
                                history.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            onSelect(item);
                                            onClose();
                                        }}
                                        className="w-full text-left group bg-zinc-900/40 border border-white/5 hover:border-amber-500/40 hover:bg-zinc-900 rounded-lg p-3 transition-all duration-200"
                                    >
                                        <p className="text-[10px] text-zinc-500 mb-1 flex items-center justify-between font-mono">
                                            {new Date(item.timestamp).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed group-hover:text-zinc-200 transition-colors">
                                            {item.prompt}
                                        </p>
                                        <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                            <span>RESTORE</span>
                                            <ChevronRight size={10} />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {history.length > 0 && (
                            <div className="p-4 border-t border-white/5 bg-zinc-950">
                                <button
                                    onClick={clearHistory}
                                    className="w-full flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/5 py-2.5 rounded-md transition-colors border border-transparent hover:border-red-500/10 uppercase tracking-wider font-medium"
                                >
                                    <Trash2 size={14} />
                                    Clear History
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
