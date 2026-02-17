"use client";

import React from "react";
import { Wand2, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PromptFormProps {
    prompt: string;
    setPrompt: (value: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
    retryCountdown: number | null;
    error: string | null;
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
    isLoading,
    retryCountdown,
    error,
}: PromptFormProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
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
                    Component Prompt
                </h2>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 min-h-0 overflow-y-auto">
                {/* Textarea with character count */}
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Describe the component you want to build...\n\ne.g. "A modern pricing table with 3 tiers..."`}
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

                {/* Quick Start */}
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

                {/* Action Button */}
                <motion.button
                    whileHover={!isLoading && retryCountdown === null ? { scale: 1.01 } : {}}
                    whileTap={!isLoading && retryCountdown === null ? { scale: 0.98 } : {}}
                    onClick={onSubmit}
                    disabled={isLoading || !prompt.trim() || retryCountdown !== null || isOverLimit}
                    className={cn(
                        "flex-shrink-0 w-full py-3 sm:py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 text-black shadow-lg transition-all duration-200 mt-auto relative overflow-hidden group",
                        retryCountdown !== null || isOverLimit
                            ? "bg-zinc-800 cursor-not-allowed text-zinc-500 shadow-none"
                            : "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20 hover:shadow-amber-500/30"
                    )}
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Generating...
                        </>
                    ) : retryCountdown !== null ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Rate limited — wait ({retryCountdown}s)
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} className="fill-black/20" />
                            Generate Component
                        </>
                    )}
                </motion.button>

                {/* Shortcut hint (desktop only) */}
                <p className="hidden sm:block text-center text-[10px] text-zinc-600 -mt-2">
                    Press <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono text-[9px]">Enter</kbd> to generate
                    ·
                    <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono text-[9px] ml-1">Shift+Enter</kbd> for new line
                </p>
            </div>
        </div>
    );
}
