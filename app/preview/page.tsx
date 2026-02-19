"use client";

import React, { useEffect, useState } from "react";
import {
    SandpackProvider,
    SandpackLayout,
    SandpackPreview,
} from "@codesandbox/sandpack-react";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { decompressFromEncodedURIComponent } from "lz-string";
import { SANDPACK_DEPS, SANDPACK_RESOURCES } from "@/lib/sandpack-config";

export default function PreviewPage() {
    const [code, setCode] = useState<string | null>(null);
    const [previewKey, setPreviewKey] = useState(0);

    useEffect(() => {
        // Priority 1: Read code from URL query parameter
        const params = new URLSearchParams(window.location.search);
        const compressedCode = params.get("code");

        if (compressedCode) {
            try {
                const decoded = decompressFromEncodedURIComponent(compressedCode);
                if (decoded) {
                    setCode(decoded);
                    // Clean URL without reloading
                    window.history.replaceState({}, "", "/preview");
                    return;
                }
            } catch {
                // Fall through to localStorage
            }
        }

        // Priority 2: Fall back to localStorage
        const savedCode = localStorage.getItem("promptui_code");
        if (savedCode) {
            setCode(savedCode);
        }
    }, []);

    // Listen for storage changes (live sync from editor tab)
    useEffect(() => {
        const handler = () => {
            const updated = localStorage.getItem("promptui_code");
            if (updated && updated !== code) {
                setCode(updated);
                setPreviewKey((k) => k + 1);
            }
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, [code]);

    if (!code) {
        return (
            <div className="h-[100dvh] w-full flex items-center justify-center bg-zinc-950 text-zinc-500 gap-2">
                <Loader2 className="animate-spin" size={20} />
                Loading preview...
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full bg-zinc-950 relative fullscreen-preview overflow-hidden">
            <SandpackProvider
                key={previewKey}
                template="react"
                theme="dark"
                files={{
                    "/App.js": code,
                }}
                customSetup={{
                    dependencies: SANDPACK_DEPS,
                }}
                options={{
                    externalResources: SANDPACK_RESOURCES,
                }}
            >
                <SandpackLayout
                    style={{
                        height: "100%",
                        width: "100%",
                        border: "none",
                        borderRadius: 0,
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#09090b",
                    }}
                >
                    <SandpackPreview
                        showOpenInCodeSandbox={false}
                        showRefreshButton={false}
                        style={{
                            flex: 1,
                            minHeight: 0,
                            width: "100%",
                        }}
                    />
                </SandpackLayout>
            </SandpackProvider>

            {/* Floating Controls */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 z-50 flex items-center gap-2 sm:gap-3"
            >
                <Link
                    href="/"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all shadow-2xl text-xs sm:text-sm"
                >
                    <ArrowLeft size={14} />
                    <span className="font-medium">Back</span>
                </Link>
                <button
                    onClick={() => setPreviewKey((k) => k + 1)}
                    className="flex items-center gap-2 px-3 py-2 sm:py-2.5 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all shadow-2xl"
                    title="Refresh Preview"
                >
                    <RefreshCw size={14} />
                </button>
            </motion.div>
        </div>
    );
}
