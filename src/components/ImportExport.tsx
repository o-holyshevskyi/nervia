/* eslint-disable @typescript-eslint/no-explicit-any */
import { Upload, Download, Loader2 } from "lucide-react";
import { parseBookmarksHtml, ParsedBookmark } from "../lib/bookmarkParser";
import ConfirmModal from "./ui/ConfirmModal";
import { useState } from "react";

interface ImportExportProps {
    onImport: (bookmarks: any[]) => Promise<number | undefined>;
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
        <div className="space-y-3 p-2">
            <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">
                Data Management
            </div>
            
            <label className={`hover:cursor-pointer flex items-center gap-3 px-4 py-3 bg-white/5 border border-dashed border-white/10 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-all group ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                {isImporting ? <Loader2 size={18} className="animate-spin text-neutral-400" /> : <Upload size={18} className="text-neutral-400 group-hover:text-neutral-400" />}
                <span className="text-sm font-medium">{isImporting ? 'Processing...' : 'Import HTML Bookmarks'}</span>
                <input type="file" accept=".html" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
            </label>

            <button 
                onClick={onExport}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
                <Download size={18} />
                <span className="text-sm font-medium">Export to JSON</span>
            </button>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmImport}
                title="Ready to Synapse?"
                description={`We found ${pendingData.length} bookmarks. They will be added to your graph and automatically tagged based on your browser folders.`}
                confirmText="Import Now"
            />
        </div>
    );
}