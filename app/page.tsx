"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { ResizableSchematic } from "@/components/ui/resizable-schematic";
import { Header } from "@/components/ui/header";
import { PromptForm } from "@/components/prompt/prompt-form";
import { PreviewPanel } from "@/components/preview/preview-panel";
import { HistorySidebar } from "@/components/sidebar/history-sidebar";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { stripMarkdownFences } from "@/lib/parse-multi-file";
import { decompressFromEncodedURIComponent } from "lz-string";

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
  const [files, setFiles] = useState<Record<string, string>>({ "/App.js": DEFAULT_CODE });
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [sandpackKey, setSandpackKey] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"prompt" | "preview">("prompt");

  // Feature toggles
  const [isIterating, setIsIterating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Auto-fix state
  const [isFixing, setIsFixing] = useState(false);
  const [fixAttempt, setFixAttempt] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<string | undefined>(undefined);

  // SSE abort controller
  const abortRef = useRef<AbortController | null>(null);

  const { toast } = useToast();

  // --- Effects ---

  // Load from LocalStorage
  useEffect(() => {
    try {
      const savedPrompt = localStorage.getItem("promptui_prompt");
      const savedCode = localStorage.getItem("promptui_code");
      const savedFiles = localStorage.getItem("promptui_files");
      if (savedPrompt) setPrompt(savedPrompt);
      if (savedFiles) {
        try {
          const parsed = JSON.parse(savedFiles);
          setFiles(parsed);
          setCode(parsed["/App.js"] || Object.values(parsed)[0] || DEFAULT_CODE);
          setSandpackKey((k) => k + 1);
          setHasGenerated(true);
        } catch {
          if (savedCode) {
            setCode(savedCode);
            setFiles({ "/App.js": savedCode });
            setSandpackKey((k) => k + 1);
            setHasGenerated(true);
          }
        }
      } else if (savedCode) {
        setCode(savedCode);
        setFiles({ "/App.js": savedCode });
        setSandpackKey((k) => k + 1);
        setHasGenerated(true);
      }

      // Handle shared link query param
      const params = new URLSearchParams(window.location.search);
      const sharedCode = params.get("code");
      if (sharedCode) {
        try {
          const decoded = decompressFromEncodedURIComponent(sharedCode);
          if (decoded) {
            setCode(decoded);
            setFiles({ "/App.js": decoded });
            setSandpackKey((k) => k + 1);
            setHasGenerated(true);
            // Clean URL
            window.history.replaceState({}, "", "/");
          }
        } catch {
          // Invalid shared code
        }
      }
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("promptui_prompt", prompt);
      localStorage.setItem("promptui_code", code);
      localStorage.setItem("promptui_files", JSON.stringify(files));
    } catch {
      // Silently fail
    }
  }, [prompt, code, files]);

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
    const trimmed = prompt.trim();
    if (!trimmed || isLoading || retryCountdown !== null) return;

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setRetryCountdown(null);
    setIsFixing(false);
    setFixAttempt(0);
    setLoadingStatus("Generating component...");

    try {
      // Build request body
      const body: Record<string, unknown> = {};
      if (isIterating && hasGenerated) {
        body.previousCode = code;
        body.refinement = trimmed;
      } else {
        body.prompt = trimmed;
      }

      const res = await fetch("/api/generate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429 && data.isRateLimit) {
          setRetryCountdown(15);
        }
        throw new Error(data.error || "Failed to generate component.");
      }

      // Read SSE stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();

          if (payload === "[DONE]") {
            // Stream complete — process final output
            const finalCode = stripMarkdownFences(accumulated);
            setCode(finalCode);
            setFiles({ "/App.js": finalCode });

            setSandpackKey((k) => k + 1);
            setActiveTab("preview");
            setHasGenerated(true);
            toast("Component generated!", "success");

            // Save History
            try {
              const item = { prompt: trimmed, code: accumulated, timestamp: Date.now() };
              const saved = localStorage.getItem("promptui_history");
              const history = saved ? JSON.parse(saved) : [];
              const newHistory = [item, ...history].slice(0, 50);
              localStorage.setItem("promptui_history", JSON.stringify(newHistory));
              window.dispatchEvent(new Event("promptui_history_updated"));
            } catch {
              // History save failed
            }
            continue;
          }

          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) {
              if (parsed.isRateLimit) setRetryCountdown(15);
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulated += parsed.text;
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue; // Skip malformed JSON
            throw e;
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      toast(message, "error");
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [prompt, isLoading, retryCountdown, toast, code, isIterating, hasGenerated]);

  // Cancel generation
  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setIsFixing(false);
    setFixAttempt(0);
    setLoadingStatus(undefined);
  }, []);

  // Auto-fix: when Sandpack detects errors, send code + error to AI for repair
  const MAX_FIX_ATTEMPTS = 3;

  const handleAutoFix = useCallback(async (errors: string[]) => {
    // Guard: don't fix if already fixing, loading, or no generation happened
    if (isFixing || isLoading || !hasGenerated) return;
    // Guard: respect max attempts per generation cycle
    if (fixAttempt >= MAX_FIX_ATTEMPTS) return;

    const currentAttempt = fixAttempt + 1;
    setIsFixing(true);
    setFixAttempt(currentAttempt);
    setLoadingStatus(`Auto-fixing errors (attempt ${currentAttempt}/${MAX_FIX_ATTEMPTS})...`);

    try {
      const errorText = errors.slice(0, 3).join("\n");

      const res = await fetch("/api/generate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousCode: code,
          refinement: `The generated code has the following runtime errors. Please fix ALL errors and return the complete corrected code:\n\n${errorText}`,
        }),
      });

      if (!res.ok) {
        throw new Error("Fix request failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();

          if (payload === "[DONE]") {
            const finalCode = stripMarkdownFences(accumulated);
            setCode(finalCode);
            setFiles({ "/App.js": finalCode });

            setSandpackKey((k) => k + 1);
            toast(`Auto-fix applied (attempt ${currentAttempt})`, "success");
            continue;
          }

          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) accumulated += parsed.text;
          } catch {
            // skip malformed
          }
        }
      }
    } catch {
      toast("Auto-fix failed", "error");
    } finally {
      setIsFixing(false);
      setLoadingStatus(undefined);
    }
  }, [isFixing, isLoading, hasGenerated, fixAttempt, code, toast]);

  // Copy handler
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (success) setCopied(true);
      } catch {
        return;
      }
    }
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
          setFiles({ "/App.js": item.code });
          setSandpackKey((k) => k + 1);
          setShowHistory(false);
          setHasGenerated(true);
          toast("Prompt restored from history", "info");
        }}
      />

      {/* Main Layout Area */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row relative">
        {/* Mobile Tabs */}
        <div className="lg:hidden flex-shrink-0 bg-zinc-950 border-b border-white/10 p-1 sm:p-1.5 flex gap-1 sm:gap-1.5">
          <button
            onClick={() => setActiveTab("prompt")}
            className={`flex-1 py-2.5 text-[11px] sm:text-xs font-medium rounded-md transition-all duration-200 ${activeTab === "prompt"
              ? "bg-zinc-800 text-white border border-white/10 shadow-lg"
              : "text-zinc-500 hover:text-zinc-300"
              }`}
          >
            ✏️ Prompt
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 py-2.5 text-[11px] sm:text-xs font-medium rounded-md transition-all duration-200 ${activeTab === "preview"
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
                onCancel={handleCancel}
                isLoading={isLoading}
                retryCountdown={retryCountdown}
                error={error}
                isIterating={isIterating}
                onToggleIterate={() => setIsIterating((v) => !v)}
                hasGenerated={hasGenerated}
              />
            }
            rightPanel={
              <ErrorBoundary>
                <PreviewPanel
                  code={code}
                  files={files}
                  sandpackKey={sandpackKey}
                  copied={copied}
                  isLoading={isLoading}
                  isFixing={isFixing}
                  fixAttempt={fixAttempt}
                  loadingStatus={loadingStatus}
                  onCopy={handleCopy}
                  onSandpackError={handleAutoFix}
                  onToast={toast}
                />
              </ErrorBoundary>
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
              onCancel={handleCancel}
              isLoading={isLoading}
              retryCountdown={retryCountdown}
              error={error}
              isIterating={isIterating}
              onToggleIterate={() => setIsIterating((v) => !v)}
              hasGenerated={hasGenerated}
            />
          </div>
          <div
            className={`absolute inset-0 z-10 bg-black ${activeTab === "preview" ? "block" : "hidden"
              }`}
          >
            <ErrorBoundary>
              <PreviewPanel
                code={code}
                files={files}
                sandpackKey={sandpackKey}
                copied={copied}
                isLoading={isLoading}
                isFixing={isFixing}
                fixAttempt={fixAttempt}
                loadingStatus={loadingStatus}
                onCopy={handleCopy}
                onSandpackError={handleAutoFix}
                onToast={toast}
              />
            </ErrorBoundary>
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
