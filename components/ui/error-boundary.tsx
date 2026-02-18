"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center min-h-[200px] p-8 gap-4 bg-zinc-950 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <span className="text-red-400 text-xl">!</span>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-200">Something went wrong</h3>
                    <p className="text-xs text-zinc-500 max-w-md">
                        {this.state.error?.message || "An unexpected error occurred."}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="text-xs px-4 py-2 rounded-md bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
