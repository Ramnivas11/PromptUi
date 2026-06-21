"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { ResizableSchematic } from "@/components/ui/resizable-schematic";
import { Header } from "@/components/ui/header";
import { PromptForm } from "@/components/prompt/prompt-form";
import { PreviewPanel } from "@/components/preview/preview-panel";
import { HistorySidebar } from "@/components/sidebar/history-sidebar";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { stripMarkdownFences } from "@/lib/parse-multi-file";
import { decompressFromEncodedURIComponent } from "lz-string";
import { StorageManager } from "@/lib/storage-manager";
import { parseStreamWithValidation } from "@/lib/stream-parser";

// Default Code Template (Luxury Editorial)
const DEFAULT_CODE = `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] relative overflow-hidden font-sans">
      {/* Paper texture overlay is built into the system, but we simulate it here just in case */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.02]" 
        style={{ backgroundImage: "url(\\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\\")" }}
      ></div>

      {/* Grid framework */}
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-between px-8 md:px-16 opacity-20">
        <div className="w-px h-full bg-[#1A1A1A]"></div>
        <div className="w-px h-full bg-[#1A1A1A] hidden md:block"></div>
        <div className="w-px h-full bg-[#1A1A1A] hidden md:block"></div>
        <div className="w-px h-full bg-[#1A1A1A]"></div>
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 py-8">
        <div className="text-xl font-serif italic tracking-wide">Maison</div>
        <div className="flex gap-8 text-xs uppercase tracking-[0.2em] font-medium text-[#6C6863]">
            <a href="#" className="hover:text-[#D4AF37] transition-colors duration-500">Collection</a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors duration-500">Atelier</a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors duration-500">Journal</a>
        </div>
      </nav>

      <main className="relative z-10 max-w-[1600px] mx-auto px-8 md:px-16 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-x-12 items-end">
            
            {/* Left aligned massive text */}
            <div className="md:col-span-8 md:col-start-2">
                <div className="flex items-center gap-6 mb-12">
                    <div className="h-px w-12 bg-[#1A1A1A]/30"></div>
                    <span className="text-xs uppercase tracking-[0.3em] font-medium text-[#6C6863]">Automne / Hiver</span>
                </div>
                
                <h1 className="text-[clamp(4rem,8vw,9rem)] font-serif leading-[0.85] tracking-tight mb-8">
                    The Art of <br />
                    <span className="italic text-[#6C6863]">Subtlety.</span>
                </h1>
            </div>

            {/* Asymmetrical descriptive text */}
            <div className="md:col-span-3 md:pb-4">
                <p className="text-lg leading-relaxed text-[#6C6863] max-w-sm">
                    Elegance is not about being noticed, it is about being remembered. Discover the new collection defined by architectural precision.
                </p>
                <div className="mt-12">
                     <button className="group relative overflow-hidden px-10 py-4 border border-[#1A1A1A] bg-transparent text-[#1A1A1A] transition-all duration-500 rounded-none w-full sm:w-auto">
                        <span className="absolute inset-0 bg-[#D4AF37] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] z-0"></span>
                        <span className="relative z-10 text-xs font-medium uppercase tracking-[0.2em] group-hover:text-white transition-colors duration-500 delay-100">Explore Collection</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Feature Image with deep shadow and grayscale reveal */}
        <div className="mt-32 w-full md:w-10/12 ml-auto relative group cursor-pointer">
            <div className="absolute -left-12 top-12 hidden lg:block rotate-180" style={{ writingMode: 'vertical-rl' }}>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#6C6863]">Editorial / Vol. 01</span>
            </div>
            
            <div className="aspect-[21/9] overflow-hidden bg-[#EBE5DE] relative shadow-[0_8px_32px_rgba(0,0,0,0.08)] group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition-shadow duration-[1500ms]">
                <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] z-10 pointer-events-none"></div>
                <img 
                    src="https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=2600&auto=format&fit=crop" 
                    alt="Editorial Model" 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[2000ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                />
            </div>
        </div>
      </main>
    </div>
  );
}`;

function HomeContent() {
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
  const [isIterating, setIsIterating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixAttempt, setFixAttempt] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const storageManager = useMemo(() => {
    return new StorageManager({
      onQuotaWarning: (quota) => {
        toast(
          `Storage nearly full: ${(quota.percentUsed * 100).toFixed(0)}% used. Consider clearing history.`,
          "warning"
        );
      },
      onQuotaExceeded: () => {
        try {
          localStorage.removeItem("promptui_history");
          toast("Cleared old history to make space", "info");
        } catch {
          // Ignore
        }
      },
    });
  }, [toast]);

  useEffect(() => {
    try {
      const savedPrompt = storageManager.getItem("promptui_prompt");
      const savedCode = storageManager.getItem("promptui_code");
      const savedFiles = storageManager.getItem("promptui_files");
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
            window.history.replaceState({}, "", "/");
          }
        } catch {
          // Invalid
        }
      }
    } catch {
      // no local storage
    }
  }, [storageManager]);

  useEffect(() => {
    try {
      storageManager.setItem("promptui_prompt", prompt);
      storageManager.setItem("promptui_code", code);
      storageManager.setItem("promptui_files", JSON.stringify(files));
    } catch (error) {
      if (error instanceof Error) {
        toast(error.message, "error");
      }
    }
  }, [prompt, code, files, storageManager, toast]);

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

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading || retryCountdown !== null) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setRetryCountdown(null);
    setIsFixing(false);
    setFixAttempt(0);
    setLoadingStatus("GENERATING COMPONENT SYSTEM...");

    try {
      const body: Record<string, unknown> = {};
      if (isIterating && hasGenerated) {
        body.previousCode = code;
        body.refinement = trimmed;
      } else {
        body.prompt = trimmed + "\n\nCRITICAL DESIGN RULES: Use Luxury/Editorial design system. #F9F8F6 Alabaster background, #1A1A1A Charcoal text, #D4AF37 Gold accents, #6C6863 muted text. Massive negative space/padding. STRICT 0px border radius everywhere. Use Playfair Display font class ('font-editorial', 'font-serif') for massive headers (text-6xl to 9xl) and italic accents. Use Inter ('font-sans') for body. 1px borders only. Subtly deep shadows. Extremely slow cinematic hover transitions (duration-500 to duration-[2000ms]). Image hover should transition from grayscale to full color. NO harsh borders. Buttons should have gold backgrounds slide in from left on hover if primary.";
      }

      let res: Response;
      try {
        res = await fetch("/api/generate-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 429 && data.isRateLimit) {
            setRetryCountdown(15);
          }
          throw new Error(data.error || `Server returned ${res.status}: ${res.statusText}`);
        }
      } catch (networkError) {
        if (networkError instanceof Error && networkError.name === "AbortError") throw networkError;
        throw new Error(
          `Network request failed: ${
            networkError instanceof Error ? networkError.message : "Unknown error"
          }`
        );
      }

      try {
        const accumulated = await parseStreamWithValidation(
          res,
          () => {},
          (err) => console.warn(err)
        );

        const finalCode = stripMarkdownFences(accumulated);
        setCode(finalCode);
        setFiles({ "/App.js": finalCode });

        setSandpackKey((k) => k + 1);
        setActiveTab("preview");
        setHasGenerated(true);
        toast("COMPONENT ASSEMBLED", "success");

        try {
          const item = { prompt: trimmed, code: accumulated, timestamp: Date.now() };
          const saved = storageManager.getItem("promptui_history");
          const history = saved ? JSON.parse(saved) : [];
          const newHistory = [item, ...history].slice(0, 50);
          storageManager.setItem("promptui_history", JSON.stringify(newHistory));
          window.dispatchEvent(new Event("promptui_history_updated"));
        } catch {}
      } catch (streamError) {
        throw new Error(
          `Stream processing failed: ${
            streamError instanceof Error ? streamError.message : "Unknown error"
          }`
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "SYSTEM FAILURE.";
      setError(message);
      toast(message, "error");
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [prompt, isLoading, retryCountdown, toast, code, isIterating, hasGenerated, storageManager]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setIsFixing(false);
    setFixAttempt(0);
    setLoadingStatus(undefined);
  }, []);

  const MAX_FIX_ATTEMPTS = 3;

  const handleAutoFix = useCallback(async (errors: string[]) => {
    if (isFixing || isLoading || !hasGenerated) return;
    if (fixAttempt >= MAX_FIX_ATTEMPTS) {
      toast("Max fix attempts reached. Please refine manually.", "error");
      return;
    }

    const currentAttempt = fixAttempt + 1;
    setIsFixing(true);
    setFixAttempt(currentAttempt);
    setLoadingStatus(`AUTO-FIX ROUTINE (${currentAttempt}/${MAX_FIX_ATTEMPTS})...`);

    try {
      const errorText = errors.slice(0, 3).join("\\n");

      let res: Response;
      try {
        res = await fetch("/api/generate-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            previousCode: code,
            refinement: `The generated code has the following runtime errors. Please fix ALL errors and return the complete corrected code:\\n\\n${errorText}`,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || `Server returned ${res.status}: ${res.statusText}`
          );
        }
      } catch (networkError) {
        throw new Error(
          `Network request failed: ${
            networkError instanceof Error
              ? networkError.message
              : "Unknown error"
          }`
        );
      }

      try {
        const accumulated = await parseStreamWithValidation(
          res,
          () => {},
          (err) => console.warn(err)
        );

        const finalCode = stripMarkdownFences(accumulated);
        setCode(finalCode);
        setFiles({ "/App.js": finalCode });
        setSandpackKey((k) => k + 1);
        toast(
          `FIX APPLIED (ATTEMPT ${currentAttempt}/${MAX_FIX_ATTEMPTS})`,
          "success"
        );
      } catch (streamError) {
        throw new Error(
          `Stream processing failed: ${
            streamError instanceof Error
              ? streamError.message
              : "Unknown error"
          }`
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unknown error during auto-fix";
  
      console.error("Auto-fix error:", errorMessage);
      toast(`AUTO-FIX FAILED: ${errorMessage}`, "error");
    } finally {
      setIsFixing(false);
      setLoadingStatus(undefined);
    }
  }, [isFixing, isLoading, hasGenerated, fixAttempt, code, toast]);

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

  const handleGenerateRef = useRef(handleGenerate);
  const handleCopyRef = useRef(handleCopy);
  const toastRef = useRef(toast);

  useEffect(() => {
    handleGenerateRef.current = handleGenerate;
    handleCopyRef.current = handleCopy;
    toastRef.current = toast;
  }, [handleGenerate, handleCopy, toast]);

  const memoizedKeyboardHandler = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerateRef.current?.();
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
      e.preventDefault();
      handleCopyRef.current?.();
      toastRef.current?.("SOURCE COPIED", "success");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", memoizedKeyboardHandler);
    return () => window.removeEventListener("keydown", memoizedKeyboardHandler);
  }, [memoizedKeyboardHandler]);

  return (
    <div className="h-[100dvh] w-screen bg-background text-foreground flex flex-col justify-between overflow-hidden relative">
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
          toast("STATE RESTORED", "info");
        }}
      />

      {/* Grid Lines for Desktop */}
      <div className="fixed inset-0 pointer-events-none flex justify-between px-8 md:px-16 z-0 mix-blend-multiply opacity-5">
        <div className="w-px h-full bg-border"></div>
        <div className="w-px h-full bg-border hidden md:block"></div>
        <div className="w-px h-full bg-border hidden md:block"></div>
        <div className="w-px h-full bg-border"></div>
      </div>

      {/* Main Layout Area */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row relative z-10 mx-auto w-full max-w-[1600px] border-l border-r border-border/20">
        <div className="lg:hidden flex-shrink-0 bg-transparent border-b border-border p-0 flex">
          <button
            onClick={() => setActiveTab("prompt")}
            className={`flex-1 py-4 text-[10px] font-medium tracking-[0.2em] uppercase transition-colors duration-500 ${activeTab === "prompt"
              ? "bg-transparent text-charcoal border-b-2 border-gold"
              : "text-muted-foreground hover:bg-muted/30"
              }`}
          >
            PROMPT
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 py-4 text-[10px] font-medium tracking-[0.2em] uppercase transition-colors duration-500 ${activeTab === "preview"
              ? "bg-transparent text-charcoal border-b-2 border-gold"
              : "text-muted-foreground hover:bg-muted/30"
              }`}
          >
            PREVIEW
          </button>
        </div>

        {/* Desktop: Custom Resizable Layout */}
        <div className="hidden lg:flex flex-1 min-h-0 min-w-0">
          <ResizableSchematic
            initialLeftWidth={35}
            leftPanel={
              <div className="h-full border-r border-border bg-transparent">
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
                  onClearError={() => setError(null)}
                />
              </div>
            }
            rightPanel={
              <ErrorBoundary>
                <div className="h-full bg-transparent relative">
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
                </div>
              </ErrorBoundary>
            }
          />
        </div>

        {/* Mobile: Stacked View & Visibility Control */}
        <div className="lg:hidden flex-1 min-h-0 relative">
          <div
            className={`absolute inset-0 z-10 bg-background ${activeTab === "prompt" ? "block" : "hidden"
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
              onClearError={() => setError(null)}
            />
          </div>
          <div
            className={`absolute inset-0 z-10 bg-background ${activeTab === "preview" ? "block" : "hidden"
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
