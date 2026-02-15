"use client";

import React, { useEffect, useState } from "react";
import {
    SandpackProvider,
    SandpackLayout,
    SandpackPreview,
} from "@codesandbox/sandpack-react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PreviewPage() {
    const [code, setCode] = useState<string | null>(null);

    useEffect(() => {
        const savedCode = localStorage.getItem("promptui_code");
        if (savedCode) {
            setCode(savedCode);
        }
    }, []);

    if (!code) {
        return (
            <div className="h-[100dvh] flex items-center justify-center bg-zinc-950 text-zinc-500 gap-2">
                <Loader2 className="animate-spin" size={20} />
                Loading preview...
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full bg-zinc-950 relative">
            <SandpackProvider
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
                        "sp-wrapper": "h-full w-full",
                        "sp-layout": "h-full w-full",
                        "sp-preview": "h-full w-full",
                    },
                }}
            >
                <SandpackLayout style={{ height: "100%", border: "none" }}>
                    <SandpackPreview
                        showOpenInCodeSandbox={false}
                        showRefreshButton={false}
                        style={{ height: "100%" }}
                    />
                </SandpackLayout>
            </SandpackProvider>

            {/* Floating Back Button */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-6 left-6 z-50"
            >
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900/90 backdrop-blur border border-white/10 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors shadow-lg"
                >
                    <ArrowLeft size={16} />
                    Back to Editor
                </Link>
            </motion.div>
        </div>
    );
}
