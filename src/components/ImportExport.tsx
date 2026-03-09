/* eslint-disable @typescript-eslint/no-explicit-any */
import { Upload, Download, Loader2, Lock, FileText, Database, ArchiveRestore } from "lucide-react";
import { parseBookmarksHtml } from "../lib/bookmarkParser";
import { parseObsidianMd } from "../lib/obsidianParser";
import ConfirmModal from "./ui/ConfirmModal";
import { useState } from "react";
import type { PlanId } from "../hooks/usePlan";
import { parseNotionFile, ParsedNotionNote } from "@/src/lib/notionParser";

// 🔥 ДОДАНО: Імпорти для JSZip та Toast
import JSZip from "jszip";
import { toast } from "sonner";
import { UpgradeTargetPlan } from "./UpgradeModal";

interface ImportExportProps {
    onImport: (items: any[], source: 'html' | 'notion' | 'obsidian' | 'json') => Promise<void>;
    onExport: () => void;
    plan: PlanId; // 🔥 Перевіряємо тариф
    onRequestUpgrade: (plan: UpgradeTargetPlan) => void; // 🔥 Викликаємо модалку апгрейду
    nodes: any[];
}

export default function ImportExport({ onImport, onExport, plan, onRequestUpgrade, nodes }: ImportExportProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [pendingData, setPendingData] = useState<any[]>([]);
    const [importSource, setImportSource] = useState<'html' | 'notion' | 'obsidian' | 'json'>('html');

    const hasSingularity = plan === 'singularity';
    const hasConstellation = plan === 'constellation';

    function readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result));
            r.onerror = () => reject(r.error);
            r.readAsText(file);
        });
    }

    // Обробник для HTML закладок (Доступно всім)
    const handleHtmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const html = event.target?.result as string;
            const parsed = parseBookmarksHtml(html);
            
            // 🕵️ РАННЯ ПЕРЕВІРКА НА ДУБЛІКАТИ
            // Збираємо існуючі URL з графа
            const existingUrls = new Set(
                nodes.map((n: any) => n.url?.toLowerCase().trim()).filter(Boolean)
            );

            // Фільтруємо закладки: залишаємо тільки ті, URL яких ще немає у Всесвіті
            const newBookmarks = parsed.filter(b => {
                const itemUrl = (b.url || '').toLowerCase().trim();
                return !existingUrls.has(itemUrl);
            });

            if (newBookmarks.length > 0) {
                setPendingData(newBookmarks);
                setImportSource('html');
                setIsConfirmOpen(true);
                
                // Якщо частина відсіялась, приємно повідомити про це юзера
                if (newBookmarks.length < parsed.length) {
                    toast.success(`Skipped ${parsed.length - newBookmarks.length} existing bookmarks.`);
                }
            } else {
                // Якщо всі закладки вже є в графі, навіть не відкриваємо модалку
                toast.info("All these bookmarks already exist in your Universe.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // Обробник для Notion (Тільки Singularity)
    // Обробник для Notion (Тільки Singularity)
    const handleNotionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
    
        try {
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(file);
    
            const parsedNotes: any[] = [];
            const filePromises: Promise<void>[] = [];
    
            loadedZip.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.md')) {
                    const processFile = async () => {
                        const content = await zipEntry.async("string");
                        const filename = relativePath.split('/').pop() || relativePath;
                        const parsedNote = await parseNotionFile(filename, content);
                        
                        if (parsedNote.title) {
                            parsedNotes.push(parsedNote);
                        }
                    };
                    filePromises.push(processFile());
                }
            });
    
            await Promise.all(filePromises);

            if (parsedNotes.length === 0) {
                toast.error("No valid markdown files found in the archive.");
                e.target.value = '';
                return;
            }

            // 🕵️ РАННЯ ПЕРЕВІРКА НА ДУБЛІКАТИ (За назвою)
            const existingTitles = new Set(
                nodes.map((n: any) => (n.title ?? n.content ?? n.id)?.toString().toLowerCase().trim()).filter(Boolean)
            );

            const newItems = parsedNotes.filter(item => {
                const itemTitle = (item.title || '').toLowerCase().trim();
                return !existingTitles.has(itemTitle);
            });

            if (newItems.length === 0) {
                toast.info("All these Notion pages already exist in your Universe.");
                e.target.value = '';
                return;
            }

            if (newItems.length < parsedNotes.length) {
                toast.success(`Skipped ${parsedNotes.length - newItems.length} existing Notion pages.`);
            }
    
            console.log("Successfully parsed Notion notes:", newItems);
    
            setPendingData(newItems);
            setImportSource('notion');
            setIsConfirmOpen(true);
    
        } catch (error) {
            console.error("Error unzipping Notion export:", error);
            toast.error("Failed to read ZIP file. Make sure it's a valid archive.");
        } finally {
            e.target.value = '';
        }
    };

    // Обробник для Obsidian (Тільки Singularity)
    // Обробник для Obsidian (Тільки Singularity)
    const handleObsidianUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        const fileList = Array.from(files);
        const contents = await Promise.all(fileList.map((f) => readFileAsText(f)));
        const parsed = contents.map((content, i) => parseObsidianMd(content, fileList[i].name));
        
        // 🕵️ РАННЯ ПЕРЕВІРКА НА ДУБЛІКАТИ (За назвою для Obsidian)
        const existingTitles = new Set(
            nodes.map((n: any) => (n.title ?? n.content ?? n.id)?.toString().toLowerCase().trim()).filter(Boolean)
        );

        const newItems = parsed.filter(item => {
            const itemTitle = (item.title || '').toLowerCase().trim();
            return !existingTitles.has(itemTitle);
        });

        if (newItems.length === 0) {
            toast.info("All these Obsidian notes already exist in your Universe.");
            e.target.value = ''; // Очищаємо інпут
            return;
        }

        // Повідомляємо, якщо відкинули дублікати
        if (newItems.length < parsed.length) {
            toast.success(`Skipped ${parsed.length - newItems.length} existing Obsidian notes.`);
        }

        setPendingData(newItems);
        setImportSource('obsidian');
        setIsConfirmOpen(true);
        e.target.value = '';
    };

    // Обробник для нашого власного JSON-бекапу
    // Обробник для нашого власного JSON-бекапу
    const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await readFileAsText(file);
            const data = JSON.parse(text);

            if (!data.nodes || !Array.isArray(data.nodes)) {
                toast.error("Invalid backup format.");
                e.target.value = '';
                return;
            }

            // 1. Спочатку форматуємо дані з файлу
            const parsedNotes = data.nodes.map((n: any) => ({
                title: n.title,
                content: n.content,
                tags: n.tags || [],
                url: n.url || "",
                group_id: n.group_id || null,
                type: n.type || 'note', 
                group: n.group || 1,    
                _originalId: n.id // Зберігаємо старий ID для перевірки
            }));

            // 🕵️ 2. РАННЯ ПЕРЕВІРКА НА ДУБЛІКАТИ (За ID)
            const existingIds = new Set(
                nodes.map((n: any) => typeof n.id === 'string' ? n.id : n.id?.id)
            );

            const newItems = parsedNotes.filter((item: any) => {
                return !existingIds.has(item._originalId);
            });
            
            if (newItems.length === 0) {
                toast.info("All data from this backup is already in your Universe.");
                e.target.value = '';
                return;
            }

            if (newItems.length < parsedNotes.length) {
                toast.success(`Skipped ${parsedNotes.length - newItems.length} items that already exist.`);
            }

            setPendingData(newItems);
            setImportSource('json' as any);
            setIsConfirmOpen(true);
            
        } catch (error) {
            console.error("Failed to parse JSON backup:", error);
            toast.error("Failed to read JSON file.");
        } finally {
            e.target.value = '';
        }
    };

    const confirmImport = async () => {
        setIsImporting(true);
        try {
            await onImport(pendingData, importSource);
        } catch (err) {
            console.error(err);
        } finally {
            setIsImporting(false);
            setPendingData([]);
        }
    };

    // Динамічний текст для модалки залежно від джерела
    const getModalDescription = () => {
        if (importSource === 'notion') return `We extracted ${pendingData.length} pages from your Notion workspace. The Neural Core will map your databases into clusters and preserve relations as neural links.`;
        if (importSource === 'obsidian') return `We found ${pendingData.length} markdown files from your Obsidian vault. Wikilinks [[ ]] will be automatically converted into neural connections.`;
        return `We found ${pendingData.length} bookmarks. They will be added to your graph and Neural Core will assign tags and clusters.`;
    };

    return (
        <div className="space-y-2">
            <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 px-0">
                Data Management
            </div>

            {hasConstellation || hasSingularity ? (
                <label className={`hover:cursor-pointer w-full flex items-center justify-between px-3 py-2 bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-md text-sm transition-colors group ${isImporting ? 'opacity-50 pointer-events-none' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    <div className="flex items-center gap-2.5">
                        {isImporting && importSource === 'html' ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Upload size={16} className="shrink-0 text-neutral-500" />}
                        <span>HTML Bookmarks</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">.HTML</span>
                    <input type="file" accept=".html" className="hidden" onChange={handleHtmlUpload} disabled={isImporting} />
                </label>
            ) : (
                <button type="button" onClick={() => onRequestUpgrade('constellation')} className="hover:cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-neutral-500 dark:text-neutral-500 opacity-60 hover:opacity-100 hover:bg-indigo-500/10 dark:hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                        <Upload size={16} className="shrink-0" />
                        <span>HTML Bookmarks</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">.HTML</span>
                    <Lock size={14} className="text-indigo-500 dark:text-purple-400 shrink-0" />
                </button>
            )}

            {hasConstellation || hasSingularity ? (
                <label className={`hover:cursor-pointer w-full flex items-center justify-between px-3 py-2 bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-md text-sm transition-colors group ${isImporting ? 'opacity-50 pointer-events-none' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    <div className="flex items-center gap-2.5">
                        {isImporting && importSource === 'json' ? <Loader2 size={16} className="animate-spin shrink-0" /> : <ArchiveRestore size={16} className="shrink-0 text-neutral-500" />}
                        <span>Restore Backup</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">.JSON</span>
                    <input type="file" accept=".json" className="hidden" onChange={handleJsonUpload} disabled={isImporting} />
                </label>
            ) : (
                <button type="button" onClick={() => onRequestUpgrade('constellation')} className="hover:cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-neutral-500 dark:text-neutral-500 opacity-60 hover:opacity-100 hover:bg-indigo-500/10 dark:hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                        <Upload size={16} className="shrink-0" />
                        <span>Restore Backup</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">.JSON</span>
                    <Lock size={14} className="text-indigo-500 dark:text-purple-400 shrink-0" />
                </button>
            )}

            {/* ПРЕМІУМ ІМПОРТ: NOTION */}
            {hasSingularity ? (
                <label className={`hover:cursor-pointer w-full flex items-center justify-between px-3 py-2 bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-md text-sm transition-colors group ${isImporting ? 'opacity-50 pointer-events-none' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    <div className="flex items-center gap-2.5">
                        {isImporting && importSource === 'notion' ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Database size={16} className="shrink-0 text-neutral-500" />}
                        <span>Notion Workspace</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">.ZIP</span>
                    <input type="file" accept=".zip" className="hidden" onChange={handleNotionUpload} disabled={isImporting} />
                </label>
            ) : (
                <button type="button" onClick={() => onRequestUpgrade('singularity')} className="hover:cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-neutral-500 dark:text-neutral-500 opacity-60 hover:opacity-100 hover:bg-indigo-500/10 dark:hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                        <Database size={16} className="shrink-0" />
                        <span>Notion Workspace</span>
                    </div>
                    <Lock size={14} className="text-indigo-500 dark:text-purple-400 shrink-0" />
                </button>
            )}

            {/* ПРЕМІУМ ІМПОРТ: OBSIDIAN */}
            {hasSingularity ? (
                <label className={`hover:cursor-pointer w-full flex items-center justify-between px-3 py-2 bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-md text-sm transition-colors group ${isImporting ? 'opacity-50 pointer-events-none' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    <div className="flex items-center gap-2.5">
                        {isImporting && importSource === 'obsidian' ? <Loader2 size={16} className="animate-spin shrink-0" /> : <FileText size={16} className="shrink-0 text-neutral-500" />}
                        <span>Obsidian Vault</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">.MD</span>
                    <input type="file" accept=".md" multiple className="hidden" onChange={handleObsidianUpload} disabled={isImporting} />
                </label>
            ) : (
                <button type="button" onClick={() => onRequestUpgrade('singularity')} className="hover:cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-neutral-500 dark:text-neutral-500 opacity-60 hover:opacity-100 hover:bg-indigo-500/10 dark:hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                        <FileText size={16} className="shrink-0" />
                        <span>Obsidian Vault</span>
                    </div>
                    <Lock size={14} className="text-indigo-500 dark:text-purple-400 shrink-0" />
                </button>
            )}

            <div className="pt-2">
                <button
                    onClick={onExport}
                    className="hover:cursor-pointer w-full flex items-center justify-between gap-2.5 px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <Download size={16} className="shrink-0 text-neutral-500" />
                        <span>Export Universe</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">.JSON</span>
                </button>
            </div>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmImport}
                title="Ready for Nervia?"
                description={getModalDescription()}
                confirmText="Import Now"
            />
        </div>
    );
}