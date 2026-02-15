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
];

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

    return (
        <div className="flex flex-col h-full bg-black">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-white/5 bg-zinc-950">
                <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 tracking-wide uppercase">
                    <Wand2 size={14} className="text-amber-500" />
                    Component Prompt
                </h2>
            </div>

            {/* Content */}
            <div className="flex-1 p-5 flex flex-col gap-5 min-h-0 overflow-y-auto">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Describe the component you want to build...\n\ne.g. "A modern pricing table with 3 tiers..."`}
                    className="w-full h-[180px] rounded-lg bg-zinc-900/50 border border-white/10 p-4 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                />

                {/* Quick Start */}
                <div className="space-y-3 flex-shrink-0">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Quick Start
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {EXAMPLE_PROMPTS.map((example) => (
                            <button
                                key={example}
                                onClick={() => setPrompt(example)}
                                className="text-xs px-3 py-1.5 rounded-md bg-zinc-900 border border-white/5 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-200 text-left"
                            >
                                {example}
                            </button>
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
                            className="flex-shrink-0 rounded-lg bg-red-500/10 border-l-2 border-red-500 p-3 text-sm text-red-400 flex items-start gap-2 overflow-hidden"
                        >
                            <span className="mt-0.5 font-bold">Error:</span>
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Button */}
                <button
                    onClick={onSubmit}
                    disabled={isLoading || !prompt.trim() || retryCountdown !== null}
                    className={cn(
                        "flex-shrink-0 w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 text-black shadow-lg transition-all duration-200 mt-auto sm:mt-0 relative overflow-hidden group",
                        retryCountdown !== null
                            ? "bg-zinc-800 cursor-not-allowed text-zinc-500 shadow-none"
                            : "bg-amber-500 hover:bg-amber-400 shadow-amber-500/20"
                    )}
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Processing...
                        </>
                    ) : retryCountdown !== null ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Wait ({retryCountdown}s)
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} className="fill-black/20" />
                            Generate Component
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
