/* eslint-disable @typescript-eslint/no-explicit-any */
import { Upload, Download, Loader2 } from "lucide-react";
import { parseBookmarksHtml, ParsedBookmark } from "../lib/bookmarkParser";
import ConfirmModal from "./ui/ConfirmModal";
import { useState } from "react";

interface ImportExportProps {
    onImport: (bookmarks: any[]) => Promise<void>;
    onExport: () => void;
}

export default function ImportExport({ onImport, onExport }: ImportExportProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [pendingData, setPendingData] = useState<ParsedBookmark[]>([]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const html = event.target?.result as string;
            const parsed = parseBookmarksHtml(html);
            if (parsed.length > 0) {
                setPendingData(parsed);
                setIsConfirmOpen(true); // 🔥 Відкриваємо наш модал
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // скидаємо інпут
    };

    const confirmImport = async () => {
        setIsImporting(true);
        try {
            await onImport(pendingData);
        } catch (err) {
            console.error(err);
        } finally {
            setIsImporting(false);
            setPendingData([]);
        }
    };

    return (
        <div className="space-y-2">
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1 px-0">
                Data Management
            </div>

            <label className={`hover:cursor-pointer flex items-center gap-2.5 px-3 py-2 bg-white/5 border border-dashed border-white/10 rounded-md text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition-colors group ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                {isImporting ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Upload size={16} className="shrink-0" />}
                <span>{isImporting ? 'Processing...' : 'Import HTML Bookmarks'}</span>
                <input type="file" accept=".html" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
            </label>

            <button
                onClick={onExport}
                className="hover:cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            >
                <Download size={16} className="shrink-0" />
                <span>Export to JSON</span>
            </button>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmImport}
                title="Ready to Synapse?"
                description={`We found ${pendingData.length} bookmarks. They will be added to your graph and AI will assign tags, connections, and semantic groups (e.g. Development, AI, Finance).`}
                confirmText="Import Now"
            />
        </div>
    );
}