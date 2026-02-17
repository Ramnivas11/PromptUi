"use client";

import React, { useState, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
}

const ICON_MAP = {
    success: <Check size={14} className="text-emerald-400" />,
    error: <X size={14} className="text-red-400" />,
    info: <Info size={14} className="text-blue-400" />,
    warning: <AlertTriangle size={14} className="text-amber-400" />,
};

const BG_MAP = {
    success: "border-emerald-500/20 bg-emerald-500/10",
    error: "border-red-500/20 bg-red-500/10",
    info: "border-blue-500/20 bg-blue-500/10",
    warning: "border-amber-500/20 bg-amber-500/10",
};

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const toast = useCallback((message: string, type: ToastType = "success") => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 2500);
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast Container — positioned above mobile nav */}
            <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-[9999] flex flex-col gap-2 pointer-events-none max-w-[90vw] sm:max-w-sm">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-lg border backdrop-blur-xl shadow-2xl text-sm text-zinc-200 ${BG_MAP[t.type]}`}
                        >
                            <div className="flex-shrink-0">{ICON_MAP[t.type]}</div>
                            <span className="font-medium truncate">{t.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
