/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Filter, LogOut, Search, UserIcon, ImportIcon, Layers, Compass, Route, Clock, Globe, Tag, Puzzle, Plus, Sun, Trash2, MessageCircle, Share2, Bell, History, CreditCard, ChevronLeft, ChevronRight, Activity, Sliders, Settings2 } from "lucide-react";
import FilterPanel from "./FilterPanel";
import CloseButton from "./ui/CloseButton";
import CreateGroupModal from "./CreateGroupModal";
import ShareModal from "./ShareModal";
import type { Group } from "../hooks/useGroups";
import { useSharing } from "../hooks/useSharing";
import type { ShareScope } from "../hooks/useSharing";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import ImportExport from "./ImportExport";
import Image from "next/image";
import Link from "next/link";
import { useExtensionDetected } from "../hooks/useExtensionDetected";
import { useUniverseStats } from "../hooks/useUniverseStats";
import ThemeToggle from "./ThemeToggle";

interface LeftSidebarProps {
  isOpen: boolean;
  tags: string[];
  activeTag: string | null;
  nodes: any[];
  onClose: () => void;
  onSelect: (node: any) => void;
  onTagSelect: (tag: string | null) => void;
  onImport: (bookmarks: any[]) => Promise<void>;
  onExport: () => void;
  onOpenSearch?: () => void;
  onOpenPathfinder?: () => void;
  onOpenTimeline?: () => void;
  onOpenHistory?: () => void;
  onOpenChat?: () => void;
  clusterMode: 'group' | 'tag';
  onClusterModeChange: (mode: 'group' | 'tag') => void;
  groups: Group[];
  onAddGroup: (name: string, color: string) => void;
  onDeleteGroup: (id: string) => void;
  notifications?: { id: string; title: string; message: string; type: string; metadata: Record<string, unknown>; read_at: string | null; created_at: string }[];
  unreadCount?: number;
  markAsRead?: (id: string) => void;
  markAllAsRead?: () => void;
  onNavigateToGroup?: (groupId: string) => void;
}

function SubViewHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="hover:cursor-pointer flex items-center gap-1.5 px-2 py-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
      >
        <ChevronLeft size={18} />
        <span className="text-xs font-semibold tracking-widest uppercase">Back</span>
      </button>
      <span className="text-neutral-400 dark:text-neutral-500">/</span>
      <span className="text-xs font-semibold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">
        {title}
      </span>
    </div>
  );
}

export default function LeftSidebar({ 
  isOpen, 
  nodes, 
  tags, 
  activeTag, 
  onClose, 
  onTagSelect, 
  onSelect,
  onImport, 
  onExport,
  onOpenSearch,
  onOpenPathfinder,
  onOpenTimeline,
  onOpenHistory,
  onOpenChat,
  clusterMode,
  onClusterModeChange,
  groups,
  onAddGroup,
  onDeleteGroup,
  notifications = [],
  unreadCount = 0,
  markAsRead,
  markAllAsRead,
  onNavigateToGroup,
}: LeftSidebarProps) {
  const [activeView, setActiveView] = useState<'main' | 'discovery' | 'collections' | 'viewOptions' | 'telemetry' | 'management'>('main');
  const [openAccordion, setOpenAccordion] = useState<string | null>('');
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareInitial, setShareInitial] = useState<{ scope: ShareScope; groupIds: string[] }>({ scope: 'ALL', groupIds: [] });
  const [user, setUser] = useState<any>(null);
  const supabase = useMemo(() => createClient(), []);
  const { createShare } = useSharing(supabase);
  const [scrollShadows, setScrollShadows] = useState({ top: false, bottom: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateScrollShadows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const showTop = scrollTop > 8;
    const showBottom = scrollHeight - scrollTop - clientHeight > 8;
    setScrollShadows((prev) =>
      prev.top !== showTop || prev.bottom !== showBottom ? { top: showTop, bottom: showBottom } : prev
    );
  }, []);

  useEffect(() => {
    updateScrollShadows();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollShadows);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScrollShadows, openAccordion, activeView]);
  const extensionDetected = useExtensionDetected();
  const router = useRouter();
  const { nodesCount, linksCount, topTag, isLoading: isStatsLoading } = useUniverseStats(nodes);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    if (!isOpen) setActiveView('main');
  }, [isOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const kbdClass = "text-xs font-mono text-neutral-500 dark:text-neutral-400 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded";

  function relativeTime(createdAt: string): string {
    const d = new Date(createdAt).getTime();
    const now = Date.now();
    const s = Math.floor((now - d) / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hr${h === 1 ? "" : "s"} ago`;
    const day = Math.floor(h / 24);
    return `${day} day${day === 1 ? "" : "s"} ago`;
  }

  const toggleAccordion = (itemId: string) => {
    setOpenAccordion(openAccordion === itemId ? null : itemId);
  };

  const AnimatedNumber = ({ value, active }: { value: number; active: boolean }) => {
    const spring = useSpring(0, {
      stiffness: 120,
      damping: 20,
      mass: 0.8,
    });

    const display = useTransform(spring, (val) => Math.round(val).toLocaleString());

    useEffect(() => {
      if (active) {
        spring.set(0);
        spring.set(value);
      }
    }, [active, value, spring]);

    return (
      <motion.span className="font-mono text-neutral-700 dark:text-white/70">
        {display}
      </motion.span>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="left-sidebar"
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="fixed top-0 left-0 h-full w-80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-2xl border-r border-black/10 dark:border-white/10 p-8 shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400 uppercase tracking-[0.2em]">Dashboard</span>
            </div>
            <CloseButton onClose={onClose} />
          </div>

          {/* Grouped Content */}
          <div className="flex-1 min-h-0 flex flex-col relative">
            <div
              ref={scrollRef}
              onScroll={updateScrollShadows}
              className="flex-1 overflow-y-auto scroll-hint space-y-8 pr-2"
            >
            <AnimatePresence mode="wait">
              {activeView === 'main' && (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="space-y-2"
                >
                  <button
                    type="button"
                    onClick={() => onOpenSearch?.()}
                    className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Search size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                      <span>Search</span>
                    </div>
                    <kbd className={kbdClass}>Ctrl+K</kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('discovery')}
                    className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Compass size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                      <span>Discovery Tools</span>
                    </div>
                    <ChevronRight size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('collections')}
                    className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                      <span>Collections</span>
                    </div>
                    <ChevronRight size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('viewOptions')}
                    className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sliders size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                      <span>View Options</span>
                    </div>
                    <ChevronRight size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('telemetry')}
                    className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Activity size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                      <span>System Telemetry</span>
                    </div>
                    <ChevronRight size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('management')}
                    className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings2 size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                      <span>Management</span>
                    </div>
                    <ChevronRight size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                  </button>
                </motion.div>
              )}

              {activeView === 'discovery' && (
                <motion.div
                  key="discovery"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  <SubViewHeader title="Discovery" onBack={() => setActiveView('main')} />
                  <div className="space-y-1 pt-2">
                    <button
                      type="button"
                      onClick={() => onOpenPathfinder?.()}
                      className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Route size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                        <span>Pathfinder</span>
                      </div>
                      <kbd className={kbdClass}>Ctrl+Alt+P</kbd>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenTimeline?.()}
                      className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                        <span>Time Machine</span>
                      </div>
                      <kbd className={kbdClass}>Ctrl+Alt+T</kbd>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenHistory?.()}
                      className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <History size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                        <span>Evolution Journal</span>
                      </div>
                      <kbd className={kbdClass}>Ctrl+Alt+H</kbd>
                    </button>
                    <button
                      type="button"
                      data-tour-id="tour-neural-chat"
                      onClick={() => onOpenChat?.()}
                      className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <MessageCircle size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                        <span>Neural Core</span>
                      </div>
                      <kbd className={kbdClass}>Ctrl+Alt+C</kbd>
                    </button>
                  </div>
                </motion.div>
              )}

              {activeView === 'collections' && (
                <motion.div
                  key="collections"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="space-y-6"
                >
                  <SubViewHeader title="Collections" onBack={() => setActiveView('main')} />
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">Clusters</span>
                        <button
                          type="button"
                          onClick={() => setIsCreateGroupOpen(true)}
                          className="hover:cursor-pointer p-1.5 rounded-md text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-purple-400 hover:bg-indigo-500/10 dark:hover:bg-purple-500/10 transition-colors"
                          title="Create cluster"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      {groups.length === 0 ? (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 italic py-2">No clusters yet</p>
                      ) : (
                        <ul className="space-y-1">
                          {groups.map((g) => (
                            <li
                              key={g.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 group/list"
                            >
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                              <span className="flex-1 min-w-0 text-sm text-neutral-700 dark:text-neutral-300 truncate">{g.name}</span>
                              <button type="button" onClick={() => { setShareInitial({ scope: 'GROUPS', groupIds: [g.id] }); setIsShareModalOpen(true); }} className="hover:cursor-pointer p-1 opacity-0 group-hover/list:opacity-100 text-neutral-400 hover:text-indigo-600 dark:hover:text-purple-400 transition-all" title="Share this cluster"><Share2 size={12} /></button>
                              <button type="button" onClick={() => onDeleteGroup(g.id)} className="hover:cursor-pointer p-1 opacity-0 group-hover/list:opacity-100 text-neutral-400 hover:text-red-500 transition-all" title="Delete cluster"><Trash2 size={12} /></button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-semibold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">Filters</span>
                      {tags.length === 0 ? (
                        <div className="py-3 px-2 text-center bg-black/5 dark:bg-white/5 rounded-md border border-black/10 dark:border-white/10">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">No tags yet</p>
                        </div>
                      ) : (
                        <FilterPanel activeTag={activeTag} tags={tags} onClose={onClose} onTagSelect={onTagSelect} />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'viewOptions' && (
                <motion.div
                  key="viewOptions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="space-y-6"
                >
                  <SubViewHeader title="View Options" onBack={() => setActiveView('main')} />
                  <div className="space-y-4 pt-2">
                    <div className="w-full h-10 flex items-center justify-between px-3 rounded-md">
                      <div className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                        <Sun size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                        <span>Theme</span>
                      </div>
                      <ThemeToggle />
                    </div>
                    <div className="w-full h-10 flex items-center justify-between px-3 rounded-md">
                      <div className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                        <Globe size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                        <span>Gravity Shift</span>
                      </div>
                      <div role="group" aria-label="By cluster or tag" className="flex h-8 w-16 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-0.5 shrink-0">
                        <button type="button" title="By Cluster" onClick={() => onClusterModeChange('group')} className={`hover:cursor-pointer flex-1 flex items-center justify-center rounded-full transition-all duration-200 ${clusterMode === 'group' ? 'bg-indigo-500/20 dark:bg-purple-500/20 text-indigo-600 dark:text-purple-400 border border-indigo-500/30 dark:border-purple-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] dark:shadow-[0_0_12px_rgba(168,85,247,0.15)]' : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'}`}><Globe size={14} /></button>
                        <button type="button" title="By Tag" onClick={() => onClusterModeChange('tag')} className={`hover:cursor-pointer flex-1 flex items-center justify-center rounded-full transition-all duration-200 ${clusterMode === 'tag' ? 'bg-indigo-500/20 dark:bg-purple-500/20 text-indigo-600 dark:text-purple-400 border border-indigo-500/30 dark:border-purple-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] dark:shadow-[0_0_12px_rgba(168,85,247,0.15)]' : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'}`}><Tag size={14} /></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'management' && (
                <motion.div
                  key="management"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  <SubViewHeader title="Management" onBack={() => setActiveView('main')} />
                  <div className="space-y-1 pt-2">
                    <button type="button" onClick={() => setIsNotificationPanelOpen(true)} className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="relative text-neutral-500 dark:text-neutral-500 shrink-0"><Bell size={16} />{unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}</span>
                        <span>Notifications</span>
                      </div>
                      {unreadCount > 0 && <kbd className={kbdClass}>{unreadCount}</kbd>}
                    </button>
                    <button type="button" onClick={() => { setShareInitial({ scope: 'ALL', groupIds: [] }); setIsShareModalOpen(true); }} className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2.5"><Share2 size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" /><span>Share Universe</span></div>
                      <kbd className={kbdClass}>Share</kbd>
                    </button>
                    <div className="overflow-hidden">
                      <button type="button" onClick={() => toggleAccordion('import-export')} className={`hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors group ${openAccordion === 'import-export' ? 'bg-black/5 dark:bg-white/5 text-neutral-900 dark:text-white' : ''}`}>
                        <div className="flex items-center gap-2.5"><ImportIcon size={16} className="shrink-0 text-neutral-500 dark:text-neutral-500" /><span>Data Transfer</span></div>
                        <motion.div animate={{ rotate: openAccordion === 'import-export' ? 180 : 0 }} className="text-neutral-500 dark:text-neutral-500 shrink-0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></motion.div>
                      </button>
                      <AnimatePresence initial={false}>
                        {openAccordion === 'import-export' && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
                            <div className="px-0 pt-1.5 pb-2"><ImportExport onImport={onImport} onExport={onExport} /></div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button type="button" onClick={() => { router.push('/settings/billing'); onClose(); }} className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2.5"><CreditCard size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" /><span>Billing</span></div>
                      <kbd className={kbdClass}>Billing</kbd>
                    </button>
                  </div>
                </motion.div>
              )}

              {activeView === 'telemetry' && (
                <motion.div
                  key="telemetry"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  <SubViewHeader title="System Telemetry" onBack={() => setActiveView('main')} />
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Puzzle size={14} className="text-neutral-500 dark:text-neutral-500" />
                        <span className="text-xs font-semibold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">Companion</span>
                      </div>
                      {extensionDetected ? (
                        <div className="h-10 flex items-center justify-between px-3 rounded-md text-neutral-600 dark:text-neutral-400">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <motion.div className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-400" animate={{ boxShadow: ['0 0 6px rgba(34,197,94,0.4)', '0 0 10px rgba(34,197,94,0.5)', '0 0 6px rgba(34,197,94,0.4)'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 dark:text-white/40 font-mono truncate">SYNC: ONLINE</span>
                          </div>
                        </div>
                      ) : (
                        <Link href="/extension" className="hover:cursor-pointer h-10 flex items-center justify-between px-3 rounded-md text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 dark:text-white/30 font-mono truncate">CLIPPER: OFFLINE</span>
                          <Plus size={14} className="shrink-0 text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-white/60 transition-colors" />
                        </Link>
                      )}
                    </div>
                    <div className="pt-3 border-t border-black/10 dark:border-white/5 space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-500 dark:text-white/30">
                          <span>NEURONS:</span>
                          {isStatsLoading ? <span className="font-mono text-neutral-400 dark:text-white/30">…</span> : <AnimatedNumber value={nodesCount} active={isOpen} />}
                          <span className="text-neutral-400 dark:text-white/20">//</span>
                          <span>NEURAL LINKS:</span>
                          {isStatsLoading ? <span className="font-mono text-neutral-400 dark:text-white/30">…</span> : <AnimatedNumber value={linksCount} active={isOpen} />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-500 dark:text-white/30">
                        <span>FOCUS:</span>
                        <div className="h-3 w-px bg-black/10 dark:bg-white/5" />
                        <span className="font-mono text-neutral-700 dark:text-white/70">{topTag ? `#${topTag}` : '-'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
            {/* Scroll hints: fade when content is scrollable */}
            {scrollShadows.top && (
              <div
                className="absolute left-0 right-2 top-0 h-6 bg-gradient-to-b from-white/90 to-transparent dark:from-neutral-950/90 pointer-events-none z-10"
                aria-hidden
              />
            )}
            {scrollShadows.bottom && (
              <div
                className="absolute left-0 right-2 bottom-0 h-6 bg-gradient-to-t from-white/90 to-transparent dark:from-neutral-950/90 pointer-events-none z-10"
                aria-hidden
              />
            )}
          </div>

          {/* User Profile Card – persistent */}
          <div className="mt-6 pt-6 border-t border-black/10 dark:border-white/5">
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 flex items-center justify-between group border border-black/10 dark:border-white/5 hover:border-black/20 dark:hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 dark:bg-purple-500/20 border border-indigo-500/30 dark:border-purple-500/30 overflow-hidden flex items-center justify-center">
                    {user?.user_metadata?.avatar_url ? (
                      <Image src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" width={50} height={50} />
                    ) : (
                      <UserIcon size={20} className="text-indigo-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full" />
                </div>
                <div className="flex flex-col max-w-[120px]">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                    {user?.email}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleSignOut}
                className="hover:cursor-pointer p-2 text-neutral-500 dark:text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
      {/* Notification center panel */}
      <AnimatePresence>
        {isOpen && isNotificationPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
              aria-hidden
              onClick={() => setIsNotificationPanelOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-80 top-0 bottom-0 w-96 z-50 flex flex-col bg-white/10 dark:bg-black/40 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  Notifications
                </span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && markAllAsRead && (
                    <button
                      type="button"
                      onClick={() => markAllAsRead()}
                      className="hover:cursor-pointer text-xs text-indigo-600 dark:text-purple-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  <CloseButton onClose={() => setIsNotificationPanelOpen(false)} size={18} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 italic py-8 text-center">
                    No new activity in your Universe.
                  </p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        const groupId = n.metadata?.group_id as string | undefined;
                        if (groupId && onNavigateToGroup) {
                          onNavigateToGroup(groupId);
                          setIsNotificationPanelOpen(false);
                          onClose();
                        }
                        markAsRead?.(n.id);
                      }}
                      className={`hover:cursor-pointer w-full text-left rounded-lg p-3 border transition-colors ${
                        n.read_at
                          ? "bg-transparent border-white/5 dark:border-white/5 hover:bg-white/5 dark:hover:bg-white/5"
                          : "bg-indigo-500/5 dark:bg-purple-500/5 border-indigo-500/20 dark:border-purple-500/20"
                      }`}
                    >
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 mt-1">
                        {relativeTime(n.created_at)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <CreateGroupModal
        key="create-group-modal"
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreate={onAddGroup}
      />
      <ShareModal
        key="share-modal"
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        groups={groups}
        initialScope={shareInitial.scope}
        initialGroupIds={shareInitial.groupIds}
        onCreateShare={async (scope, groupIds) => {
          const result = await createShare(scope, groupIds);
          return result ? { slug: result.slug, url: result.url } : null;
        }}
      />
    </AnimatePresence>
  );
}