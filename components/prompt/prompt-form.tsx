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
    isIterating?: boolean;
    onToggleIterate?: () => void;
    hasGenerated?: boolean;
}

const EXAMPLE_PROMPTS = [
    "A modern pricing table with 3 tiers",
    "A sleek dashboard stats card row",
    "A hero section with typography",
    "An animated testimonial carousel",
    "A login form with auth buttons",
    "A product card grid with hover effects",
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
        <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-8 md:px-12 py-8 relative">
                <h2 className="text-3xl font-editorial text-charcoal flex items-center gap-3">
                    <Wand2 size={24} className="text-gold stroke-[1.5] flex-shrink-0" />
                    <span className="font-editorial italic font-light tracking-wide">
                        {isIterating ? "Refine" : "Prompt"} <span className="not-italic font-normal">{isIterating ? "Component" : "Builder"}</span>
                    </span>
                </h2>
            </div>

            {/* Content */}
            <div className="flex-1 px-8 md:px-12 flex flex-col gap-8 min-h-0 overflow-y-auto relative z-10 pb-8">
                <AnimatePresence>
                    {isIterating && hasGenerated && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="flex-shrink-0 border-t border-b border-border py-6"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <RotateCcw size={16} className="text-gold" />
                                <span className="text-xs uppercase tracking-[0.25em] text-charcoal font-medium">Iterate Mode Active</span>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Describe changes you want. Your current component will be sent as context.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative group">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            isIterating && hasGenerated
                                ? "Describe what to change...\n\nE.g. \"Decrease border radius\" or \"Add a dark mode toggle\""
                                : "Describe the component you want to build...\n\nE.g. \"A modern pricing table with 3 tiers...\""
                        }
                        maxLength={MAX_CHARS + 50}
                        className={cn(
                            "w-full h-[180px] sm:h-[240px] bg-transparent border border-border/60 p-6 text-lg font-sans tracking-wide text-charcoal placeholder:font-editorial placeholder:italic placeholder:text-muted-foreground/80 resize-none focus:outline-none focus:ring-0 transition-all duration-500 rounded-none block shadow-[inset_0_4px_24px_rgba(0,0,0,0.02)]",
                            isOverLimit
                                ? "border-destructive text-destructive"
                                : "hover:border-charcoal focus:border-gold focus:bg-white/40"
                        )}
                    />
                    <div
                        className={cn(
                            "absolute -bottom-6 right-0 text-[10px] font-sans transition-colors duration-500 tracking-widest",
                            isOverLimit
                                ? "text-destructive"
                                : charCount > MAX_CHARS * 0.8
                                    ? "text-gold"
                                    : "text-muted-foreground"
                        )}
                    >
                        {charCount} / {MAX_CHARS}
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 flex-shrink-0 mt-4">
                    {hasGenerated && onToggleIterate && (
                        <button
                            onClick={onToggleIterate}
                            className={cn(
                                "flex items-center gap-3 text-xs px-8 py-3 border transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] tracking-[0.2em] uppercase rounded-none",
                                isIterating
                                    ? "bg-charcoal border-charcoal text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
                                    : "bg-transparent border-border text-charcoal hover:bg-muted"
                            )}
                        >
                            <RotateCcw size={14} className="stroke-[1.5]" />
                            Iterate
                        </button>
                    )}
                </div>

                {!isIterating && (
                    <div className="space-y-6 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="h-px w-8 bg-charcoal/20"></div>
                            <span className="text-xs text-muted-foreground uppercase tracking-[0.25em]">
                                Quick Start
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {EXAMPLE_PROMPTS.map((example) => (
                                <button
                                    key={example}
                                    onClick={() => setPrompt(example)}
                                    className="text-sm px-6 py-3 bg-transparent border border-border text-muted-foreground hover:bg-charcoal hover:border-charcoal hover:text-white transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] tracking-wide text-left rounded-none"
                                >
                                    {example}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex-shrink-0 bg-transparent border-t border-destructive text-destructive flex items-start gap-4 overflow-hidden rounded-none pt-4 tracking-wide text-sm"
                        >
                            <span className="font-semibold uppercase tracking-widest text-xs mt-0.5">Error</span>
                            <span className="break-words">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex gap-4 mt-auto flex-shrink-0 pt-6">
                    <button
                        onClick={onSubmit}
                        disabled={isLoading || !prompt.trim() || retryCountdown !== null || isOverLimit}
                        className={cn(
                            "group relative overflow-hidden flex-1 py-4 sm:py-5 flex items-center justify-center gap-3 uppercase tracking-[0.2em] transition-all duration-500 rounded-none border text-xs font-medium",
                            retryCountdown !== null || isOverLimit
                                ? "bg-transparent border-border text-muted-foreground cursor-not-allowed opacity-50"
                                : isLoading
                                    ? "bg-transparent border-gold text-gold cursor-wait"
                                    : "bg-charcoal border-charcoal text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
                        )}
                    >
                        {!isLoading && retryCountdown === null && !isOverLimit && (
                            <span className="absolute inset-0 bg-gold translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] z-0"></span>
                        )}
                        <div className="relative z-10 flex items-center gap-3">
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin stroke-[1.5]" />
                                    Developing...
                                </>
                            ) : retryCountdown !== null ? (
                                <>
                                    <Loader2 size={16} className="animate-spin stroke-[1.5]" />
                                    Wait ({retryCountdown}s)
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} className="stroke-[1.5]" />
                                    {isIterating && hasGenerated ? "Refine Component" : "Generate Component"}
                                </>
                            )}
                        </div>
                    </button>

                    {isLoading && onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-6 py-4 sm:py-5 bg-transparent border border-border text-charcoal hover:bg-muted transition-colors duration-500 rounded-none flex items-center justify-center"
                            title="Cancel generation"
                        >
                            <X size={18} className="stroke-[1.5]" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
