/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import SearchInput from "./ui/SearchInput";

interface CommandPaletteProps {
    nodes: any[];
    onSelect: (node: any) => void;
}

export default function CommandPalette({ nodes, onSelect }: CommandPaletteProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm">
                        <div className="absolute inset-0" onClick={handleClose} />

                        <SearchInput nodes={nodes} onSelect={onSelect} handleClose={handleClose} />
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}