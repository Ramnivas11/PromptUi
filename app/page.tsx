"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ResizableSchematic } from "@/components/ui/resizable-schematic";
import { Header } from "@/components/ui/header";
import { PromptForm } from "@/components/prompt/prompt-form";
import { PreviewPanel } from "@/components/preview/preview-panel";
import { HistorySidebar } from "@/components/sidebar/history-sidebar";
import { ToastProvider, useToast } from "@/components/ui/toast";

// Default Code Template
const DEFAULT_CODE = `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 sm:p-8">
      <div className="text-center space-y-6 sm:space-y-8 max-w-2xl w-full px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium uppercase tracking-wider">
          ✨ Professional Components
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
          Prompt<span className="text-amber-500">UI</span>
        </h1>
        <p className="text-lg sm:text-xl text-neutral-400 leading-relaxed max-w-lg mx-auto">
          Describe any UI component, and watch it build instantly.
          <br />
          <span className="text-neutral-500 text-sm mt-4 block">Production-ready React & Tailwind.</span>
        </p>
      </div>
    </div>
  );
}`;

function HomeContent() {
  // --- State ---
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [sandpackKey, setSandpackKey] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"prompt" | "preview">("prompt");

  const { toast } = useToast();

  // --- Effects ---

  // Load from LocalStorage
  useEffect(() => {
    try {
      const savedPrompt = localStorage.getItem("promptui_prompt");
      const savedCode = localStorage.getItem("promptui_code");
      if (savedPrompt) setPrompt(savedPrompt);
      if (savedCode) {
        setCode(savedCode);
        setSandpackKey((k) => k + 1);
      }
    } catch {
      // localStorage may be unavailable in some environments
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("promptui_prompt", prompt);
      localStorage.setItem("promptui_code", code);
    } catch {
      // Silently fail if storage is full or unavailable
    }
  }, [prompt, code]);

  // Countdown Logic
  useEffect(() => {
    if (retryCountdown === null) return;
    if (retryCountdown <= 0) {
      setRetryCountdown(null);
      setError(null);
      return;
    }
    const timer = setInterval(() => {
      setRetryCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryCountdown]);

  // --- Handlers ---

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isLoading || retryCountdown !== null) return;

    setIsLoading(true);
    setError(null);
    setRetryCountdown(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 && data.isRateLimit) {
          setRetryCountdown(15);
          throw new Error(data.error);
        }
        throw new Error(data.error || "Failed to generate component.");
      }

      setCode(data.code);
      setSandpackKey((k) => k + 1);
      setActiveTab("preview");
      toast("Component generated!", "success");

      // Save History
      try {
        const item = { prompt, code: data.code, timestamp: Date.now() };
        const saved = localStorage.getItem("promptui_history");
        const history = saved ? JSON.parse(saved) : [];
        const newHistory = [item, ...history].slice(0, 50);
        localStorage.setItem("promptui_history", JSON.stringify(newHistory));
      } catch {
        // History save failed, non-critical
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      toast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, retryCountdown, toast]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        handleCopy();
        toast("Code copied!", "success");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGenerate, handleCopy, toast]);

  // --- Render ---

  return (
    <div className="h-[100dvh] w-screen bg-black text-foreground flex flex-col overflow-hidden">
      <Header onHistoryClick={() => setShowHistory(true)} />

      <HistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelect={(item) => {
          setPrompt(item.prompt);
          setCode(item.code);
          setSandpackKey((k) => k + 1);
          setShowHistory(false);
          toast("Prompt restored from history", "info");
        }}
      />

      {/* Main Layout Area */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row relative">
        {/* Mobile Tabs */}
        <div className="lg:hidden flex-shrink-0 bg-zinc-950 border-b border-white/10 p-1.5 sm:p-2 flex gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab("prompt")}
            className={`flex-1 py-2 sm:py-2.5 text-xs font-medium rounded-md transition-all duration-200 ${activeTab === "prompt"
                ? "bg-zinc-800 text-white border border-white/10 shadow-lg"
                : "text-zinc-500 hover:text-zinc-300"
              }`}
          >
            ✏️ Prompt
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 py-2 sm:py-2.5 text-xs font-medium rounded-md transition-all duration-200 ${activeTab === "preview"
                ? "bg-zinc-800 text-white border border-white/10 shadow-lg"
                : "text-zinc-500 hover:text-zinc-300"
              }`}
          >
            👁️ Preview
          </button>
        </div>

        {/* Desktop: Custom Resizable Layout */}
        <div className="hidden lg:flex flex-1 min-h-0 min-w-0">
          <ResizableSchematic
            initialLeftWidth={35}
            leftPanel={
              <PromptForm
                prompt={prompt}
                setPrompt={setPrompt}
                onSubmit={handleGenerate}
                isLoading={isLoading}
                retryCountdown={retryCountdown}
                error={error}
              />
            }
            rightPanel={
              <PreviewPanel
                code={code}
                sandpackKey={sandpackKey}
                copied={copied}
                onCopy={handleCopy}
                onToast={toast}
              />
            }
          />
        </div>

        {/* Mobile: Stacked View & Visibility Control */}
        <div className="lg:hidden flex-1 min-h-0 relative">
          <div
            className={`absolute inset-0 z-10 bg-black ${activeTab === "prompt" ? "block" : "hidden"
              }`}
          >
            <PromptForm
              prompt={prompt}
              setPrompt={setPrompt}
              onSubmit={handleGenerate}
              isLoading={isLoading}
              retryCountdown={retryCountdown}
              error={error}
            />
          </div>
          <div
            className={`absolute inset-0 z-10 bg-black ${activeTab === "preview" ? "block" : "hidden"
              }`}
          >
            <PreviewPanel
              code={code}
              sandpackKey={sandpackKey}
              copied={copied}
              onCopy={handleCopy}
              onToast={toast}
            />
          </div>
        </div>
      </main>

      {/* Keyboard Shortcut Hint — desktop only */}
      <div className="flex-shrink-0 hidden lg:flex items-center justify-center gap-4 py-1.5 bg-zinc-950/80 border-t border-white/5 text-[10px] text-zinc-600">
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[9px] mr-1">
            Ctrl+Enter
          </kbd>
          Generate
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[9px] mr-1">
            Ctrl+Shift+C
          </kbd>
          Copy Code
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <HomeContent />
    </ToastProvider>
  );
}
