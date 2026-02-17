"use client";

import React, { useState, useCallback } from "react";
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
    SandpackPreview,
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
} from "lucide-react";
import Link from "next/link";
import { compressToBase64 } from "lz-string";

interface PreviewPanelProps {
    code: string;
    sandpackKey: number;
    copied: boolean;
    onCopy: () => void;
    onToast?: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

/* Shared Sandpack config — keeps things DRY */
const SANDPACK_DEPS = {
    "lucide-react": "latest",
    clsx: "latest",
    "tailwind-merge": "latest",
};
const SANDPACK_RESOURCES = ["https://cdn.tailwindcss.com"];

export function PreviewPanel({
    code,
    sandpackKey,
    copied,
    onCopy,
    onToast,
}: PreviewPanelProps) {
    const [showEditor, setShowEditor] = useState(false);

    /* -------- Handlers -------- */

    const handleDownload = useCallback(() => {
        const blob = new Blob([code], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Component.jsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onToast?.("File downloaded!", "success");
    }, [code, onToast]);

    const handleCopyWithToast = useCallback(() => {
        onCopy();
        onToast?.("Code copied to clipboard!", "success");
    }, [onCopy, onToast]);

    const handleOpenInCodeSandbox = useCallback(() => {
        try {
            const files = {
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

            const compressed = compressToBase64(JSON.stringify({ files }))
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

    return (
        <div className="flex flex-col h-full min-h-0 bg-zinc-950 overflow-hidden">
            {/* ------- Toolbar ------- */}
            <div className="flex-shrink-0 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-white/5 flex items-center justify-between bg-zinc-950 gap-2">
                <h2 className="text-xs sm:text-sm font-semibold text-zinc-100 flex items-center gap-2 tracking-wide uppercase whitespace-nowrap">
                    <Code2 size={14} className="text-amber-500" />
                    <span className="hidden xs:inline">Live</span> Preview
                </h2>
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
                    <button
                        onClick={() => setShowEditor((v) => !v)}
                        className={`${btnClass} ${showEditor ? "text-amber-400 border-amber-500/30 bg-amber-500/10" : ""}`}
                        title={showEditor ? "Hide Editor" : "Show Editor"}
                    >
                        {showEditor ? <EyeOff size={12} /> : <Eye size={12} />}
                        <span className="hidden sm:inline">{showEditor ? "Hide" : "Code"}</span>
                    </button>

                    <button onClick={handleOpenInCodeSandbox} className={btnClass} title="Open in CodeSandbox">
                        <ExternalLink size={12} />
                        <span className="hidden md:inline">Sandbox</span>
                    </button>

                    <Link href="/preview" target="_blank" className={btnClass} title="Open Fullscreen">
                        <Maximize2 size={12} />
                    </Link>

                    <button onClick={handleDownload} className={btnClass} title="Download">
                        <Download size={12} />
                    </button>

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
            <div className="flex-1 min-h-0 overflow-hidden sandpack-fill">
                <SandpackProvider
                    key={sandpackKey}
                    template="react"
                    theme="dark"
                    files={{ "/App.js": code }}
                    customSetup={{ dependencies: SANDPACK_DEPS }}
                    options={{ externalResources: SANDPACK_RESOURCES }}
                >
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
                        {/* Preview — takes all space when editor hidden */}
                        <SandpackPreview
                            showOpenInCodeSandbox={false}
                            showRefreshButton
                            style={{
                                flex: showEditor ? "6" : "1",
                                minHeight: 0,
                                width: "100%",
                            }}
                        />

                        {/* Editor — slide-up panel (40%) */}
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
    );
}
