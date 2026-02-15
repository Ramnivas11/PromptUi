"use client";

import React from "react";
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
    SandpackPreview,
} from "@codesandbox/sandpack-react";
import { Code2, Check, Copy, Download, Maximize2 } from "lucide-react";
import Link from "next/link";

interface PreviewPanelProps {
    code: string;
    sandpackKey: number;
    copied: boolean;
    onCopy: () => void;
}

export function PreviewPanel({
    code,
    sandpackKey,
    copied,
    onCopy,
}: PreviewPanelProps) {
    const handleDownload = () => {
        const blob = new Blob([code], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "App.tsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full min-h-0 bg-zinc-950">
            {/* Header */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-950">
                <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 tracking-wide uppercase">
                    <Code2 size={14} className="text-amber-500" />
                    Live Preview
                </h2>
                <div className="flex items-center gap-2">
                    <Link
                        href="/preview"
                        target="_blank"
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-white/20 transition-all duration-200"
                        title="Open Fullscreen"
                    >
                        <Maximize2 size={12} />
                    </Link>

                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-white/20 transition-all duration-200"
                        title="Download App.tsx"
                    >
                        <Download size={12} />
                    </button>

                    <button
                        onClick={onCopy}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-zinc-900 border border-white/5 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all duration-200"
                    >
                        {copied ? (
                            <>
                                <Check size={12} className="text-amber-500" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy size={12} />
                                Copy
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Sandpack */}
            <div className="flex-1 min-h-0 p-2 sm:p-4 bg-black">
                <SandpackProvider
                    key={sandpackKey}
                    template="react"
                    theme="dark"
                    files={{
                        "/App.js": code,
                    }}
                    customSetup={{
                        dependencies: {
                            "lucide-react": "latest",
                            "clsx": "latest",
                            "tailwind-merge": "latest",
                        },
                    }}
                    options={{
                        externalResources: ["https://cdn.tailwindcss.com"],
                        classes: {
                            "sp-wrapper": "h-full w-full custom-wrapper",
                            "sp-layout": "h-full w-full flex flex-col lg:flex-row",
                            "sp-stack": "h-full w-full",
                        },
                    }}
                >
                    <SandpackLayout
                        style={{
                            height: "100%",
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "#09090b",
                        }}
                    >
                        <SandpackPreview
                            showOpenInCodeSandbox={false}
                            showRefreshButton
                            style={{ height: "100%", flex: 1, minHeight: "300px" }}
                        />
                        <div
                            className="hidden lg:block h-full border-l border-white/5"
                            style={{ width: "50%", height: "100%" }}
                        >
                            <SandpackCodeEditor
                                showLineNumbers
                                showTabs
                                wrapContent
                                style={{
                                    height: "100%",
                                    fontFamily: "JetBrains Mono, monospace",
                                }}
                            />
                        </div>
                    </SandpackLayout>
                </SandpackProvider>
            </div>
        </div>
    );
}
