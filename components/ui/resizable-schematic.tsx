"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ResizableSchematicProps {
    leftPanel: React.ReactNode;
    rightPanel: React.ReactNode;
    initialLeftWidth?: number; // Check percentage (0-100)
    minLeftWidth?: number;
    maxLeftWidth?: number;
}

export function ResizableSchematic({
    leftPanel,
    rightPanel,
    initialLeftWidth = 35,
    minLeftWidth = 20,
    maxLeftWidth = 50,
}: ResizableSchematicProps) {
    const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load saved layout
    useEffect(() => {
        const saved = localStorage.getItem("promptui_layout_width");
        if (saved) {
            const width = parseFloat(saved);
            if (!isNaN(width) && width >= minLeftWidth && width <= maxLeftWidth) {
                setLeftWidth(width);
            }
        }
    }, [minLeftWidth, maxLeftWidth]);

    // Save layout
    useEffect(() => {
        localStorage.setItem("promptui_layout_width", leftWidth.toString());
    }, [leftWidth]);

    const startResize = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const newLeftWidth =
                ((e.clientX - containerRect.left) / containerRect.width) * 100;

            if (newLeftWidth >= minLeftWidth && newLeftWidth <= maxLeftWidth) {
                setLeftWidth(newLeftWidth);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none"; // User select none
        } else {
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [isDragging, minLeftWidth, maxLeftWidth]);

    return (
        <div
            ref={containerRef}
            className="flex-1 flex flex-row h-full overflow-hidden relative"
        >
            {/* Left Panel */}
            <div style={{ width: `${leftWidth}%` }} className="h-full flex flex-col relative">
                {leftPanel}

                {/* Cover iframe interaction during drag */}
                {isDragging && (
                    <div className="absolute inset-0 z-50 bg-transparent" />
                )}
            </div>

            {/* Handle */}
            <div
                onMouseDown={startResize}
                className={cn(
                    "w-1 h-full bg-black cursor-col-resize flex-shrink-0 relative z-40 group hover:bg-amber-500/50 transition-colors flex items-center justify-center",
                    isDragging && "bg-amber-500"
                )}
            >
                <div className={cn(
                    "w-px h-full bg-zinc-800 transition-colors",
                    isDragging ? "bg-amber-500" : "group-hover:bg-amber-500"
                )} />
            </div>

            {/* Right Panel */}
            <div style={{ width: `${100 - leftWidth}%` }} className="h-full flex flex-col relative">
                {rightPanel}

                {/* Cover iframe interaction during drag */}
                {isDragging && (
                    <div className="absolute inset-0 z-50 bg-transparent" />
                )}
            </div>
        </div>
    );
}
