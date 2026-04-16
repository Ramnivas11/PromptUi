"use client";

import React, { useEffect, useState } from "react";
import { History, X, ChevronRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

    const loadHistory = () => {
        const saved = localStorage.getItem("promptui_history");
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    };

    useEffect(() => {
        if (isOpen) loadHistory();
    }, [isOpen]);

    useEffect(() => {
        const handler = () => loadHistory();
        window.addEventListener("promptui_history_updated", handler);
        return () => window.removeEventListener("promptui_history_updated", handler);
    }, []);

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem("promptui_history");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                        onClick={onClose}
                        className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm z-40"
                    />

                    {/* Sidebar Panel */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="fixed left-0 top-0 bottom-0 w-[85vw] max-w-[480px] bg-background border-r border-border z-50 flex flex-col shadow-[24px_0_48px_rgba(0,0,0,0.05)]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-8 md:p-12 border-b border-border bg-transparent">
                            <div className="flex items-center gap-4 text-charcoal">
                                <History size={20} className="stroke-[1.5]" />
                                <span className="font-editorial text-2xl italic tracking-wide">Archive</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 border border-transparent hover:border-border text-muted-foreground hover:text-charcoal transition-all duration-500 ease-out"
                            >
                                <X size={20} className="stroke-[1.5]" />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto px-8 md:px-12 py-8 space-y-2">
                            {history.length === 0 ? (
                                <div className="text-left text-muted-foreground py-16 flex flex-col gap-6">
                                    <div className="h-px w-12 bg-border"></div>
                                    <p className="font-editorial text-2xl italic">The archive is empty.</p>
                                    <p className="text-sm tracking-wide">Begin generating components to record your progress.</p>
                                </div>
                            ) : (
                                history.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            onSelect(item);
                                            onClose();
                                        }}
                                        className="w-full text-left group bg-transparent border-t border-border hover:bg-muted/50 rounded-none p-6 md:p-8 transition-colors duration-700 ease-out flex flex-col gap-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-1 w-1 bg-gold rounded-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.25em] font-sans">
                                                {new Date(item.timestamp).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <p className="text-lg md:text-xl text-charcoal font-editorial line-clamp-3 leading-relaxed group-hover:text-gold transition-colors duration-700">
                                            &quot;{item.prompt}&quot;
                                        </p>
                                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground group-hover:text-charcoal tracking-[0.2em] uppercase transition-colors duration-700">
                                            <span>Restore</span>
                                            <ChevronRight size={14} className="stroke-[1.5] group-hover:translate-x-1 transition-transform duration-700" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {history.length > 0 && (
                            <div className="p-8 md:p-12 border-t border-border bg-transparent">
                                <button
                                    onClick={clearHistory}
                                    className="w-full flex items-center justify-center gap-3 text-xs text-muted-foreground hover:text-destructive py-4 border border-transparent hover:border-destructive/30 transition-all duration-500 uppercase tracking-[0.2em]"
                                >
                                    <Trash2 size={14} className="stroke-[1.5]" />
                                    Clear Archive
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
