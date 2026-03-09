/* eslint-disable @typescript-eslint/no-explicit-any */
import { Upload, Download, Loader2, Lock, FileText, Database } from "lucide-react";
import { parseBookmarksHtml } from "../lib/bookmarkParser";
import { parseObsidianMd } from "../lib/obsidianParser";
import ConfirmModal from "./ui/ConfirmModal";
import { useState } from "react";
import type { PlanId } from "../hooks/usePlan";
import { parseNotionFile, ParsedNotionNote } from "@/src/lib/notionParser";

// 🔥 ДОДАНО: Імпорти для JSZip та Toast
import JSZip from "jszip";
import { toast } from "sonner";

interface ImportExportProps {
    onImport: (items: any[], source: 'html' | 'notion' | 'obsidian') => Promise<void>;
    onExport: () => void;
    plan: PlanId; // 🔥 Перевіряємо тариф
    onRequestUpgrade: () => void; // 🔥 Викликаємо модалку апгрейду
}

export default function ImportExport({ onImport, onExport, plan, onRequestUpgrade }: ImportExportProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [pendingData, setPendingData] = useState<any[]>([]);
    const [importSource, setImportSource] = useState<'html' | 'notion' | 'obsidian'>('html');

    const hasSingularity = plan === 'singularity';

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
            if (parsed.length > 0) {
                setPendingData(parsed);
                setImportSource('html');
                setIsConfirmOpen(true);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // Обробник для Notion (Тільки Singularity)
    const handleNotionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
    
        try {
            // 1. Ініціалізуємо JSZip та читаємо файл
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(file);
    
            const parsedNotes: any[] = []; // Тут будуть наші ParsedNotionNote
            const filePromises: Promise<void>[] = [];
    
            // 2. Проходимося по всіх файлах всередині архіву
            loadedZip.forEach((relativePath, zipEntry) => {
                // Нас цікавлять тільки файли з розширенням .md (ігноруємо папки, .csv, зображення)
                if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.md')) {
                    
                    // Створюємо асинхронну задачу для кожного файлу
                    const processFile = async () => {
                        // Дістаємо текст з файлу
                        const content = await zipEntry.async("string");
                        
                        // Витягуємо чисте ім'я файлу (якщо він лежить у вкладеній папці ZIP-у)
                        const filename = relativePath.split('/').pop() || relativePath;
    
                        // 🔥 Викликаємо ТВІЙ парсер!
                        const parsedNote = await parseNotionFile(filename, content);
                        
                        if (parsedNote.title) {
                            parsedNotes.push(parsedNote);
                        }
                    };
    
                    filePromises.push(processFile());
                }
            });
    
            // 3. Чекаємо, поки розпарсяться всі файли
            await Promise.all(filePromises);
    
            // Якщо нічого не знайшли
            if (parsedNotes.length === 0) {
                toast.error("No valid markdown files found in the archive.");
                e.target.value = ''; // Очищаємо інпут
                return;
            }
    
            console.log("Successfully parsed Notion notes:", parsedNotes);
    
            // 4. Передаємо дані далі в твій флоу
            setPendingData(parsedNotes);
            setImportSource('notion');
            setIsConfirmOpen(true);
    
        } catch (error) {
            console.error("Error unzipping Notion export:", error);
            toast.error("Failed to read ZIP file. Make sure it's a valid archive.");
        } finally {
            // Завжди очищаємо інпут, щоб можна було вибрати цей самий файл ще раз, якщо треба
            e.target.value = '';
        }
    };

    // Обробник для Obsidian (Тільки Singularity)
    const handleObsidianUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const fileList = Array.from(files);
        const contents = await Promise.all(fileList.map((f) => readFileAsText(f)));
        const parsed = contents.map((content, i) => parseObsidianMd(content, fileList[i].name));
        setPendingData(parsed);
        setImportSource('obsidian');
        setIsConfirmOpen(true);
        e.target.value = '';
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

            {/* БЕЗКОШТОВНИЙ ІМПОРТ: HTML Bookmarks */}
            <label className={`hover:cursor-pointer w-full flex items-center justify-between px-3 py-2 bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-md text-sm transition-colors group ${isImporting ? 'opacity-50 pointer-events-none' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}>
                <div className="flex items-center gap-2.5">
                    {isImporting && importSource === 'html' ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Upload size={16} className="shrink-0 text-neutral-500" />}
                    <span>HTML Bookmarks</span>
                </div>
                <input type="file" accept=".html" className="hidden" onChange={handleHtmlUpload} disabled={isImporting} />
            </label>

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
                <button type="button" onClick={onRequestUpgrade} className="hover:cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-neutral-500 dark:text-neutral-500 opacity-60 hover:opacity-100 hover:bg-indigo-500/10 dark:hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
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
                    {/* multiple дозволяє вибрати відразу багато файлів */}
                    <input type="file" accept=".md" multiple className="hidden" onChange={handleObsidianUpload} disabled={isImporting} />
                </label>
            ) : (
                <button type="button" onClick={onRequestUpgrade} className="hover:cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-neutral-500 dark:text-neutral-500 opacity-60 hover:opacity-100 hover:bg-indigo-500/10 dark:hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
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
                    className="hover:cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <Download size={16} className="shrink-0 text-neutral-500" />
                    <span>Export Universe (JSON)</span>
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