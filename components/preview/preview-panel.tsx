"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
    SandpackPreview,
    useSandpack,
} from "@codesandbox/sandpack-react";
import {
    Check,
    Copy,
    Download,
    Maximize2,
    ExternalLink,
    Eye,
    EyeOff,
    Loader2,
    Monitor,
    Tablet,
    Smartphone,
    ChevronDown,
    FolderArchive,
    FileCode,
    Wrench,
} from "lucide-react";

import { compressToEncodedURIComponent, compressToBase64 } from "lz-string";
import { SANDPACK_DEPS, SANDPACK_RESOURCES } from "@/lib/sandpack-config";
import { exportAsViteProject } from "@/lib/export-project";

const VIEWPORTS = {
    full: { width: "100%", label: "FULL", icon: Maximize2 },
    desktop: { width: "1280px", label: "DESKTOP", icon: Monitor },
    tablet: { width: "768px", label: "TABLET", icon: Tablet },
    mobile: { width: "375px", label: "MOBILE", icon: Smartphone },
} as const;

type ViewportKey = keyof typeof VIEWPORTS;

function SandpackErrorListener({
    onError,
    isFixing,
}: {
    onError: (errors: string[]) => void;
    isFixing: boolean;
}) {
    const { sandpack } = useSandpack();
    const lastReportedRef = useRef<string>("");

    useEffect(() => {
        if (isFixing) return;

        const errors: string[] = [];

        if (sandpack.status === "idle" || sandpack.status === "running") {
            const sandpackError = sandpack.error;
            if (sandpackError) {
                const msg = typeof sandpackError === "object" && sandpackError.message
                    ? sandpackError.message
                    : String(sandpackError);
                errors.push(msg);
            }
        }

        if (errors.length > 0) {
            const errorKey = errors.join("|");
            if (errorKey !== lastReportedRef.current) {
                lastReportedRef.current = errorKey;
                const timer = setTimeout(() => onError(errors), 2000);
                return () => clearTimeout(timer);
            }
        } else {
            lastReportedRef.current = "";
        }
    }, [sandpack.status, sandpack.error, onError, isFixing]);

    return null;
}

interface PreviewPanelProps {
    code: string;
    files?: Record<string, string>;
    sandpackKey: number;
    copied: boolean;
    isLoading?: boolean;
    isFixing?: boolean;
    fixAttempt?: number;
    loadingStatus?: string;
    onCopy: () => void;
    onSandpackError?: (errors: string[]) => void;
    onToast?: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function PreviewPanel({
    code,
    files,
    sandpackKey,
    copied,
    isLoading = false,
    isFixing = false,
    fixAttempt = 0,
    loadingStatus,
    onCopy,
    onSandpackError,
    onToast,
}: PreviewPanelProps) {
    const [showEditor, setShowEditor] = useState(false);
    const [viewport, setViewport] = useState<ViewportKey>("full");
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const downloadBtnRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

    const sandpackFiles = files && Object.keys(files).length > 1
        ? files
        : { "/App.js": code };

    const handleDownloadJSX = useCallback(() => {
        const blob = new Blob([code], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Component.jsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        onToast?.("JSX DOWNLOADED", "success");
        setShowDownloadMenu(false);
    }, [code, onToast]);

    const handleDownloadProject = useCallback(async () => {
        try {
            onToast?.("BUILDING ZIP...", "info");
            const blob = await exportAsViteProject(code, files);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "promptui-project.zip";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1500);
            onToast?.("VITE PROJECT DOWNLOADED", "success");
        } catch {
            onToast?.("FAILED TO EXPORT PROJECT", "error");
        }
        setShowDownloadMenu(false);
    }, [code, files, onToast]);

    const handleCopyWithToast = useCallback(() => {
        onCopy();
        onToast?.("SOURCE COPIED", "success");
    }, [onCopy, onToast]);

    const handleFullscreen = useCallback(() => {
        try {
            const compressed = compressToEncodedURIComponent(code);
            const url = `/preview?code=${compressed}`;
            window.open(url, "_blank");
        } catch {
            try {
                localStorage.setItem("promptui_code", code);
            } catch { /* ignore */ }
            window.open("/preview", "_blank");
        }
    }, [code]);

    const handleOpenInCodeSandbox = useCallback(() => {
        try {
            const csFiles: Record<string, { content: string }> = {
                "package.json": {
                    content: JSON.stringify(
                        {
                            name: "promptui-export",
                            version: "1.0.0",
                            main: "/src/index.js",
                            dependencies: {
                                react: "^18.0.0",
                                "react-dom": "^18.0.0",
                                "react-scripts": "^5.0.0",
                                "lucide-react": "^0.564.0",
                                clsx: "^2.1.1",
                                "tailwind-merge": "^3.4.1",
                            },
                        },
                        null,
                        2
                    ),
                },
                "src/index.js": {
                    content: `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\n\nconst root = ReactDOM.createRoot(document.getElementById("root"));\nroot.render(<App />);`,
                },
                "src/App.js": { content: code },
                "public/index.html": {
                    content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>PromptUI Export</title>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>`,
                },
            };

            const compressed = compressToBase64(JSON.stringify({ files: csFiles }));
            const form = document.createElement("form");
            form.method = "POST";
            form.action = "https://codesandbox.io/api/v1/sandboxes/define";
            form.target = "_blank";

            const paramInput = document.createElement("input");
            paramInput.type = "hidden";
            paramInput.name = "parameters";
            paramInput.value = compressed;
            form.appendChild(paramInput);

            const queryInput = document.createElement("input");
            queryInput.type = "hidden";
            queryInput.name = "query";
            queryInput.value = "file=/src/App.js";
            form.appendChild(queryInput);

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);

            onToast?.("SANDBOX OPENING...", "info");
        } catch {
            onToast?.("SANDBOX FAILED", "error");
        }
    }, [code, onToast]);

    const btnClass =
        "flex items-center gap-2 text-[10px] px-3 py-2 bg-transparent border border-transparent text-charcoal hover:bg-muted hover:border-border transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] uppercase tracking-[0.2em] rounded-none";

    const vpBtnClass = (key: ViewportKey) =>
        `p-2 transition-all duration-500 rounded-none border ${viewport === key
            ? "bg-transparent border-charcoal text-charcoal shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
            : "text-muted-foreground bg-transparent hover:text-charcoal border-transparent hover:border-border"
        }`;

    const renderLoadingOverlay = () => {
        if (!isLoading && !isFixing) return null;

        const status = loadingStatus || (isFixing ? "AUTO-FIXING IN PROGRESS" : "GENERATING COMPONENT...");
        const iconColor = "text-charcoal";
        const barColor = "bg-charcoal";

        return (
            <div className="absolute inset-0 z-30 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                {isFixing ? (
                    <Wrench size={24} className={`${iconColor} animate-bounce stroke-[1]`} />
                ) : (
                    <Loader2 size={24} className={`animate-spin ${iconColor} stroke-[1]`} />
                )}
                <div className="text-center space-y-2 uppercase font-sans tracking-[0.25em]">
                    <span className="text-sm text-foreground block">{status}</span>
                    {isFixing && fixAttempt > 0 && (
                        <span className="text-[10px] text-muted-foreground block">
                            ATTEMPT {fixAttempt}/3
                        </span>
                    )}
                </div>
                <div className="w-64 h-[1px] bg-border relative">
                    <div
                        className={`absolute top-0 left-0 h-full transition-all duration-[1500ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${barColor}`}
                        style={{ width: isFixing ? `${30 + fixAttempt * 20}%` : "60%" }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full min-h-0 bg-background overflow-hidden relative">
            {/* Toolbar */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-border flex items-center justify-between bg-transparent gap-4 min-w-0 relative z-20">
                <h2 className="text-sm font-sans text-charcoal flex items-center gap-3 tracking-[0.2em] uppercase whitespace-nowrap flex-shrink-0">
                    <span className="text-gold">/</span>
                    <span className="hidden sm:inline">LIVE PREVIEW</span>
                    {isFixing && (
                        <span className="inline-flex items-center gap-2 px-2 py-1 bg-transparent text-destructive text-[10px] uppercase tracking-widest border border-destructive">
                            <Wrench size={10} className="stroke-[1.5]" /> FIXING
                        </span>
                    )}
                </h2>
                
                <div className="flex items-center gap-2 flex-nowrap justify-end min-w-0 overflow-x-auto">
                    {/* Viewport Toggle */}
                    <div className="hidden md:flex items-center gap-1 bg-transparent">
                        {(Object.keys(VIEWPORTS) as ViewportKey[]).map((key) => {
                            const V = VIEWPORTS[key];
                            const Icon = V.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setViewport(key)}
                                    className={vpBtnClass(key)}
                                    title={V.label}
                                >
                                    <Icon size={14} className="stroke-[1.5]" />
                                </button>
                            );
                        })}
                        <div className="h-6 w-px bg-border mx-2"></div>
                    </div>

                    <button
                        onClick={() => setShowEditor((v) => !v)}
                        className={`${btnClass} ${showEditor ? "border-charcoal shadow-[0_2px_8px_rgba(0,0,0,0.02)]" : ""}`}
                        title={showEditor ? "HIDE CODE" : "SHOW CODE"}
                    >
                        {showEditor ? <EyeOff size={14} className="stroke-[1.5]" /> : <Eye size={14} className="stroke-[1.5]" />}
                        <span className="hidden sm:inline">{showEditor ? "HIDE" : "CODE"}</span>
                    </button>

                    <button onClick={handleOpenInCodeSandbox} className={btnClass} title="OPEN SANDBOX">
                        <ExternalLink size={14} className="stroke-[1.5]" />
                        <span className="hidden md:inline">SANDBOX</span>
                    </button>

                    <button onClick={handleFullscreen} className={btnClass} title="FULLSCREEN">
                        <Maximize2 size={14} className="stroke-[1.5]" />
                    </button>

                    <div className="relative">
                        <button
                            ref={downloadBtnRef}
                            onClick={() => {
                                if (!showDownloadMenu && downloadBtnRef.current) {
                                    const rect = downloadBtnRef.current.getBoundingClientRect();
                                    setMenuPos({
                                        top: rect.bottom + 8,
                                        right: window.innerWidth - rect.right,
                                    });
                                }
                                setShowDownloadMenu((v) => !v);
                            }}
                            className={btnClass}
                            title="DOWNLOAD"
                        >
                            <Download size={14} className="stroke-[1.5]" />
                            <ChevronDown size={12} className="stroke-[1.5] ml-1" />
                        </button>
                    </div>
                    {showDownloadMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-[9998]"
                                onClick={() => setShowDownloadMenu(false)}
                            />
                            <div
                                className="fixed z-[9999] w-48 bg-background border border-border shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
                                style={{ top: menuPos.top, right: menuPos.right }}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDownloadJSX(); }}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-[10px] tracking-[0.2em] font-medium uppercase text-charcoal hover:bg-muted transition-colors duration-500"
                                >
                                    <FileCode size={14} className="stroke-[1.5]" />
                                    JSX
                                </button>
                                <div className="h-px bg-border/50 mx-4"></div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDownloadProject(); }}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-[10px] tracking-[0.2em] font-medium uppercase text-charcoal hover:bg-muted transition-colors duration-500"
                                >
                                    <FolderArchive size={14} className="stroke-[1.5]" />
                                    ZIP (VITE)
                                </button>
                            </div>
                        </>
                    )}

                    <div className="h-6 w-px bg-border mx-1"></div>

                    <button
                        onClick={handleCopyWithToast}
                        className={`${btnClass} ${copied ? "border-charcoal text-gold" : ""}`}
                    >
                        {copied ? (
                            <><Check size={14} className="text-gold stroke-[1.5]" /><span className="hidden sm:inline">COPIED</span></>
                        ) : (
                            <><Copy size={14} className="stroke-[1.5]" /><span className="hidden sm:inline">COPY</span></>
                        )}
                    </button>
                </div>
            </div>

            {/* Sandpack Area */}
            <div className="flex-1 min-h-0 overflow-hidden relative sandpack-fill bg-muted/30">
                {renderLoadingOverlay()}

                <div
                    className="h-full mx-auto transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                    style={{
                        maxWidth: VIEWPORTS[viewport].width,
                        boxShadow: viewport !== "full" ? "0 4px 24px rgba(0,0,0,0.04)" : "none",
                        borderLeft: viewport !== "full" ? "1px solid rgba(0,0,0,0.05)" : "none",
                        borderRight: viewport !== "full" ? "1px solid rgba(0,0,0,0.05)" : "none",
                    }}
                >
                    <SandpackProvider
                        key={sandpackKey}
                        template="react"
                        theme="light"
                        files={sandpackFiles}
                        customSetup={{ dependencies: SANDPACK_DEPS }}
                        options={{ externalResources: SANDPACK_RESOURCES }}
                    >
                        {onSandpackError && !isLoading && (
                            <SandpackErrorListener
                                onError={onSandpackError}
                                isFixing={isFixing}
                            />
                        )}

                        <SandpackLayout
                            style={{
                                height: "100%",
                                width: "100%",
                                border: "none",
                                borderRadius: 0,
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <SandpackPreview
                                showOpenInCodeSandbox={false}
                                showRefreshButton
                                style={{
                                    flex: showEditor ? "1" : "1",
                                    minHeight: 0,
                                    width: "100%",
                                }}
                            />

                            {showEditor && (
                                <div
                                    className="border-t border-border overflow-hidden"
                                    style={{ flex: "1", minHeight: "100px" }}
                                >
                                    <SandpackCodeEditor
                                        showLineNumbers
                                        showTabs
                                        wrapContent
                                        style={{
                                            height: "100%",
                                            fontFamily: "'Courier New', Courier, monospace",
                                            fontSize: "13px",
                                            fontWeight: "normal"
                                        }}
                                    />
                                </div>
                            )}
                        </SandpackLayout>
                    </SandpackProvider>
                </div>
            </div>
        </div>
    );
}
