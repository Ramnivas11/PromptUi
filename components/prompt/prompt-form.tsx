"use client";

import React from "react";
import { Wand2, Loader2, Sparkles, RotateCcw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PromptFormProps {
    prompt: string;
    setPrompt: (value: string) => void;
    onSubmit: () => void;
    onCancel?: () => void;
    isLoading: boolean;
    retryCountdown: number | null;
    error: string | null;
    // Feature flags
    isIterating?: boolean;
    onToggleIterate?: () => void;
    hasGenerated?: boolean;
}

const EXAMPLE_PROMPTS = [
    "A modern pricing table with 3 tiers",
    "A sleek dashboard stats card row",
    "A hero section with solid typography",
    "An animated testimonial carousel",
    "A login form with social auth buttons",
    "A product card grid with hover effects",
    "A feature comparison table",
    "A team member showcase section",
];

const MAX_CHARS = 1000;

export function PromptForm({
    prompt,
    setPrompt,
    onSubmit,
    onCancel,
    isLoading,
    retryCountdown,
    error,
    isIterating = false,
    onToggleIterate,
    hasGenerated = false,
}: PromptFormProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            onSubmit();
        }
    };

    const charCount = prompt.length;
    const isOverLimit = charCount > MAX_CHARS;

    return (
        <div className="flex flex-col h-full bg-black">
            {/* Header */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 bg-zinc-950">
                <h2 className="text-xs sm:text-sm font-semibold text-zinc-100 flex items-center gap-2 tracking-wide uppercase">
                    <Wand2 size={14} className="text-amber-500" />
                    {isIterating ? "Refine Component" : "Component Prompt"}
                </h2>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 min-h-0 overflow-y-auto">
                {/* Iterate Mode Banner */}
                <AnimatePresence>
                    {isIterating && hasGenerated && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex-shrink-0 rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-xs text-amber-400 overflow-hidden"
                        >
                            <div className="flex items-center gap-2 mb-1 font-semibold">
                                <RotateCcw size={12} />
                                Iterate Mode Active
                            </div>
                            <p className="text-amber-500/60">
                                Describe changes you want. Your current component will be sent as context.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Textarea with character count */}
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            isIterating && hasGenerated
                                ? `Describe what to change...\n\ne.g. "Make the buttons rounded" or "Add a dark mode toggle"`
                                : `Describe the component you want to build...\n\ne.g. "A modern pricing table with 3 tiers..."`
                        }
                        maxLength={MAX_CHARS + 50}
                        className={cn(
                            "w-full h-[140px] sm:h-[180px] rounded-lg bg-zinc-900/50 border p-3 sm:p-4 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 transition-all duration-200",
                            isOverLimit
                                ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50"
                                : "border-white/10 focus:ring-amber-500/50 focus:border-amber-500/50"
                        )}
                    />
                    <div
                        className={cn(
                            "absolute bottom-3 right-3 text-[10px] font-mono transition-colors",
                            isOverLimit
                                ? "text-red-400"
                                : charCount > MAX_CHARS * 0.8
                                    ? "text-amber-500/70"
                                    : "text-zinc-600"
                        )}
                    >
                        {charCount}/{MAX_CHARS}
                    </div>
                </div>

                {/* Feature Toggles */}
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {/* Iterate Toggle — only show after first generation */}
                    {hasGenerated && onToggleIterate && (
                        <button
                            onClick={onToggleIterate}
                            className={cn(
                                "flex items-center gap-1.5 text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-md border transition-all duration-200",
                                isIterating
                                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                    : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/10"
                            )}
                        >
                            <RotateCcw size={12} />
                            Iterate
                        </button>
                    )}


                </div>

                {/* Quick Start — hide in iterate mode */}
                {!isIterating && (
                    <div className="space-y-2 sm:space-y-3 flex-shrink-0">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            Quick Start
                        </span>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {EXAMPLE_PROMPTS.map((example) => (
                                <motion.button
                                    key={example}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setPrompt(example)}
                                    className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-md bg-zinc-900 border border-white/5 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-200 text-left"
                                >
                                    {example}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex-shrink-0 rounded-lg bg-red-500/10 border-l-2 border-red-500 p-3 text-xs sm:text-sm text-red-400 flex items-start gap-2 overflow-hidden"
                        >
                            <span className="mt-0.5 font-bold">Error:</span>
                            <span className="break-words">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto flex-shrink-0">
                    <motion.button
                        whileHover={!isLoading && retryCountdown === null ? { scale: 1.01 } : {}}
                        whileTap={!isLoading && retryCountdown === null ? { scale: 0.98 } : {}}
                        onClick={onSubmit}
                        disabled={isLoading || !prompt.trim() || retryCountdown !== null || isOverLimit}
                        className={cn(
                            "flex-1 py-3 sm:py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 text-black shadow-lg transition-all duration-200 relative overflow-hidden group",
                            retryCountdown !== null || isOverLimit
                                ? "bg-zinc-800 cursor-not-allowed text-zinc-500 shadow-none"
                                : isLoading
                                    ? "bg-amber-600 cursor-wait text-black/70 shadow-none"
                                    : "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20 hover:shadow-amber-500/30"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Streaming...
                            </>
                        ) : retryCountdown !== null ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Rate limited — wait ({retryCountdown}s)
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} className="fill-black/20" />
                                {isIterating && hasGenerated ? "Refine Component" : "Generate Component"}
                            </>
                        )}
                    </motion.button>

                    {/* Cancel button during loading */}
                    {isLoading && onCancel && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={onCancel}
                            className="px-4 py-3 sm:py-3.5 rounded-lg bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                            title="Cancel generation"
                        >
                            <X size={16} />
                        </motion.button>
                    )}
                </div>

                {/* Shortcut hint */}
                <p className="hidden sm:block text-center text-[10px] text-zinc-600 -mt-2">
                    Press <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono text-[9px]">Ctrl+Enter</kbd> to generate
                </p>
            </div>
        </div>
    );
}
