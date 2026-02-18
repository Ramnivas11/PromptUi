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
    Code2,
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
    Share2,
    ChevronDown,
    FolderArchive,
    FileCode,
    Wrench,
} from "lucide-react";
import Link from "next/link";
import { compressToEncodedURIComponent, compressToBase64 } from "lz-string";
import { SANDPACK_DEPS, SANDPACK_RESOURCES } from "@/lib/sandpack-config";
import { exportAsViteProject } from "@/lib/export-project";

/* ===== Viewport presets ===== */
const VIEWPORTS = {
    full: { width: "100%", label: "Full", icon: Maximize2 },
    desktop: { width: "1280px", label: "Desktop", icon: Monitor },
    tablet: { width: "768px", label: "Tablet", icon: Tablet },
    mobile: { width: "375px", label: "Mobile", icon: Smartphone },
} as const;

type ViewportKey = keyof typeof VIEWPORTS;

/* ===== Error Listener (child of SandpackProvider) ===== */
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
        if (isFixing) return; // Don't report errors while a fix is in flight

        // Check for bundler errors from Sandpack status
        const errors: string[] = [];

        if (sandpack.status === "idle" || sandpack.status === "running") {
            // Check for error state in sandpack
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
                // Allow Sandpack to stabilize before reporting
                const timer = setTimeout(() => onError(errors), 2000);
                return () => clearTimeout(timer);
            }
        } else {
            lastReportedRef.current = "";
        }
    }, [sandpack.status, sandpack.error, onError, isFixing]);

    return null;
}

/* ===== Props ===== */
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

    // Determine sandpack files
    const sandpackFiles = files && Object.keys(files).length > 1
        ? files
        : { "/App.js": code };

    /* -------- Handlers -------- */

    const handleDownloadJSX = useCallback(() => {
        const blob = new Blob([code], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Component.jsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onToast?.("JSX file downloaded!", "success");
        setShowDownloadMenu(false);
    }, [code, onToast]);

    const handleDownloadProject = useCallback(async () => {
        try {
            onToast?.("Building project zip...", "info");
            const blob = await exportAsViteProject(code, files);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "promptui-project.zip";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            onToast?.("Vite project downloaded!", "success");
        } catch {
            onToast?.("Failed to export project", "error");
        }
        setShowDownloadMenu(false);
    }, [code, files, onToast]);

    const handleCopyWithToast = useCallback(() => {
        onCopy();
        onToast?.("Code copied to clipboard!", "success");
    }, [onCopy, onToast]);

    const handleShare = useCallback(() => {
        try {
            const compressed = compressToEncodedURIComponent(code);
            const url = `${window.location.origin}?code=${compressed}`;
            navigator.clipboard.writeText(url).then(() => {
                onToast?.("Share link copied to clipboard!", "success");
            }).catch(() => {
                const textarea = document.createElement("textarea");
                textarea.value = url;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
                onToast?.("Share link copied!", "success");
            });
        } catch {
            onToast?.("Failed to create share link", "error");
        }
    }, [code, onToast]);

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
                                "lucide-react": "latest",
                                clsx: "latest",
                                "tailwind-merge": "latest",
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

            const compressed = compressToBase64(JSON.stringify({ files: csFiles }))
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "");

            window.open(
                `https://codesandbox.io/api/v1/sandboxes/define?parameters=${compressed}&query=file=/src/App.js`,
                "_blank"
            );
            onToast?.("Opening in CodeSandbox...", "info");
        } catch {
            onToast?.("Failed to open CodeSandbox", "error");
        }
    }, [code, onToast]);

    /* -------- Styles -------- */

    const btnClass =
        "flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-white/20 transition-all duration-200";

    const vpBtnClass = (key: ViewportKey) =>
        `p-1.5 rounded-md transition-all duration-200 ${viewport === key
            ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
            : "text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-white/10"
        }`;

    /* -------- Loading overlay content -------- */
    const renderLoadingOverlay = () => {
        if (!isLoading && !isFixing) return null;

        const status = loadingStatus || (isFixing ? "Auto-fixing errors..." : "Generating component...");
        const iconColor = isFixing ? "text-orange-400" : "text-amber-500";
        const barColor = isFixing ? "bg-orange-400/60" : "bg-amber-500/60";

        return (
            <div className="absolute inset-0 z-30 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                {isFixing ? (
                    <div className="relative">
                        <Wrench size={28} className={`${iconColor} animate-bounce`} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping" />
                    </div>
                ) : (
                    <Loader2 size={28} className={`animate-spin ${iconColor}`} />
                )}
                <div className="text-center space-y-1">
                    <span className="text-sm text-zinc-300 font-medium block">{status}</span>
                    {isFixing && fixAttempt > 0 && (
                        <span className="text-[11px] text-zinc-500 block">
                            Attempt {fixAttempt} of 3
                        </span>
                    )}
                </div>
                <div className="w-56 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full skeleton-pulse transition-all duration-500 ${barColor}`}
                        style={{ width: isFixing ? `${30 + fixAttempt * 20}%` : "60%" }}
                    />
                </div>
                {isFixing && (
                    <p className="text-[10px] text-zinc-600 max-w-60 text-center">
                        AI is analyzing and fixing runtime errors automatically
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full min-h-0 bg-zinc-950 overflow-hidden">
            {/* ------- Toolbar ------- */}
            <div className="flex-shrink-0 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-white/5 flex items-center justify-between bg-zinc-950 gap-2">
                <h2 className="text-xs sm:text-sm font-semibold text-zinc-100 flex items-center gap-2 tracking-wide uppercase whitespace-nowrap">
                    <Code2 size={14} className="text-amber-500" />
                    <span className="hidden xs:inline">Live</span> Preview
                    {isFixing && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                            <Wrench size={9} /> Fixing
                        </span>
                    )}
                </h2>
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
                    {/* Viewport Toggle */}
                    <div className="hidden md:flex items-center gap-0.5 bg-zinc-900 rounded-lg p-0.5 border border-white/5">
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
                                    <Icon size={13} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Code Toggle */}
                    <button
                        onClick={() => setShowEditor((v) => !v)}
                        className={`${btnClass} ${showEditor ? "text-amber-400 border-amber-500/30 bg-amber-500/10" : ""}`}
                        title={showEditor ? "Hide Editor" : "Show Editor"}
                    >
                        {showEditor ? <EyeOff size={12} /> : <Eye size={12} />}
                        <span className="hidden sm:inline">{showEditor ? "Hide" : "Code"}</span>
                    </button>

                    {/* Share */}
                    <button onClick={handleShare} className={btnClass} title="Share with Link">
                        <Share2 size={12} />
                        <span className="hidden md:inline">Share</span>
                    </button>

                    {/* CodeSandbox */}
                    <button onClick={handleOpenInCodeSandbox} className={btnClass} title="Open in CodeSandbox">
                        <ExternalLink size={12} />
                        <span className="hidden md:inline">Sandbox</span>
                    </button>

                    {/* Fullscreen */}
                    <Link href="/preview" target="_blank" className={btnClass} title="Open Fullscreen">
                        <Maximize2 size={12} />
                    </Link>

                    {/* Download Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDownloadMenu((v) => !v)}
                            className={btnClass}
                            title="Download"
                        >
                            <Download size={12} />
                            <ChevronDown size={10} />
                        </button>
                        {showDownloadMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowDownloadMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                                    <button
                                        onClick={handleDownloadJSX}
                                        className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                                    >
                                        <FileCode size={14} />
                                        Download JSX
                                    </button>
                                    <button
                                        onClick={handleDownloadProject}
                                        className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-t border-white/5"
                                    >
                                        <FolderArchive size={14} />
                                        Download Vite Project
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Copy */}
                    <button
                        onClick={handleCopyWithToast}
                        className={`${btnClass} ${copied ? "text-amber-400 border-amber-500/30" : "hover:text-amber-400 hover:border-amber-500/30"}`}
                    >
                        {copied ? (
                            <><Check size={12} className="text-amber-500" /><span className="hidden sm:inline">Copied!</span></>
                        ) : (
                            <><Copy size={12} /><span className="hidden sm:inline">Copy</span></>
                        )}
                    </button>
                </div>
            </div>

            {/* ------- Sandpack Area ------- */}
            <div className="flex-1 min-h-0 overflow-hidden sandpack-fill relative">
                {renderLoadingOverlay()}

                {/* Responsive container */}
                <div
                    className="h-full mx-auto transition-all duration-300 ease-in-out"
                    style={{
                        maxWidth: VIEWPORTS[viewport].width,
                        boxShadow: viewport !== "full" ? "0 0 0 1px rgba(255,255,255,0.05)" : "none",
                    }}
                >
                    <SandpackProvider
                        key={sandpackKey}
                        template="react"
                        theme="dark"
                        files={sandpackFiles}
                        customSetup={{ dependencies: SANDPACK_DEPS }}
                        options={{ externalResources: SANDPACK_RESOURCES }}
                    >
                        {/* Error listener for auto-fix */}
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
                            {/* Preview */}
                            <SandpackPreview
                                showOpenInCodeSandbox={false}
                                showRefreshButton
                                style={{
                                    flex: showEditor ? "6" : "1",
                                    minHeight: 0,
                                    width: "100%",
                                }}
                            />

                            {/* Editor */}
                            {showEditor && (
                                <div
                                    className="border-t border-white/10 overflow-hidden"
                                    style={{ flex: "4", minHeight: "100px" }}
                                >
                                    <SandpackCodeEditor
                                        showLineNumbers
                                        showTabs
                                        wrapContent
                                        style={{
                                            height: "100%",
                                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                            fontSize: "13px",
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
