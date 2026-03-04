/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Filter, LogOut, Search, UserIcon, ImportIcon, Layers, Compass, Route, Clock, Globe, Tag, Puzzle, Plus, Sun, Trash2, MessageCircle, Share2, Bell, History, CreditCard, ChevronLeft, ChevronRight, Activity, Sliders, Settings, Settings2, Lock, Eye, Box, SmilePlus, HelpCircle, LifeBuoy } from "lucide-react";
import FilterPanel from "./FilterPanel";
import CloseButton from "./ui/CloseButton";
import CreateGroupModal from "./CreateGroupModal";
import ShareModal from "./ShareModal";
import MissionFeedbackModal from "./MissionFeedbackModal";
import DeleteAccountModal from "./DeleteAccountModal";
import SettingsModal from "./SettingsModal";
import type { Group } from "../hooks/useGroups";
import { useSharing } from "../hooks/useSharing";
import type { ShareScope } from "../hooks/useSharing";
import type { PlanId } from "../hooks/usePlan";
import { useFeatureAccess } from "../hooks/useFeatureAccess";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import ImportExport from "./ImportExport";
import Image from "next/image";
import Link from "next/link";
import { useExtensionDetected } from "../hooks/useExtensionDetected";
import { useUniverseStats } from "../hooks/useUniverseStats";
import ThemeToggle from "./ThemeToggle";
import type { UpgradeTargetPlan } from "./UpgradeModal";

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
  /** When user has Zen Mode access and clicks Zen Mode: exit Zen if active, or close sidebar so they can right-click a node. */
  onZenModeClick?: () => void;
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
  onOpenAddModal?: () => void;
  plan?: PlanId;
  onRequestUpgrade?: (targetPlan: UpgradeTargetPlan) => void;
  viewMode?: '2D' | '3D';
  onViewModeChange?: (mode: '2D' | '3D') => void;
  canUse3DGraph?: boolean;
  onRequest3DUpgrade?: () => void;
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
  onZenModeClick,
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
  onOpenAddModal,
  plan = 'genesis',
  onRequestUpgrade,
  viewMode = '2D',
  onViewModeChange,
  canUse3DGraph = false,
  onRequest3DUpgrade,
}: LeftSidebarProps) {
  const access = useFeatureAccess(plan);
  const [activeView, setActiveView] = useState<'main' | 'discovery' | 'collections' | 'viewOptions' | 'telemetry' | 'management'>('main');
  const [lastOpenedView, setLastOpenedView] = useState<typeof activeView | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>('');
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareInitial, setShareInitial] = useState<{ scope: ShareScope; groupIds: string[] }>({ scope: 'ALL', groupIds: [] });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = useMemo(() => createClient(), []);
  const { createShare, shares } = useSharing(supabase);
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
    if (!isOpen) {
      setActiveView('main');
      setLastOpenedView(null);
    }
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
                    onClick={() => { setLastOpenedView('discovery'); setActiveView('discovery'); }}
                    className={`hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm transition-colors ${lastOpenedView === 'discovery' ? 'bg-white/5 dark:bg-purple-500/5 text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Compass size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                      <span>Discovery Tools</span>
                    </div>
                    <ChevronRight size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                  </button>
                  <div
                    className={`group/row w-full h-10 flex items-center justify-between px-3 rounded-md text-sm transition-colors cursor-pointer ${lastOpenedView === 'collections' ? 'bg-white/5 dark:bg-purple-500/5' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setLastOpenedView('collections'); setActiveView('collections'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLastOpenedView('collections'); setActiveView('collections'); } }}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <Layers size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                      <span className={lastOpenedView === 'collections' ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400 group-hover/row:text-neutral-900 dark:group-hover/row:text-white'}>Collections</span>
                      {onOpenAddModal && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onOpenAddModal(); }}
                          className="opacity-0 group-hover/row:opacity-100 hover:opacity-100 p-1 rounded-md text-neutral-400 hover:text-indigo-600 dark:hover:text-purple-400 hover:bg-indigo-500/10 dark:hover:bg-purple-500/10 transition-all shrink-0"
                          title="Add neuron"
                          aria-label="Add neuron"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {groups.length > 0 && (
                        <span className="text-[10px] font-medium tabular-nums text-neutral-400 dark:text-neutral-500 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                          {groups.length}
                        </span>
                      )}
                      <ChevronRight size={16} className="text-neutral-500 dark:text-neutral-500" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setLastOpenedView('viewOptions'); setActiveView('viewOptions'); }}
                    className={`hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm transition-colors ${lastOpenedView === 'viewOptions' ? 'bg-white/5 dark:bg-purple-500/5 text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sliders size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                      <span>View Options</span>
                    </div>
                    <ChevronRight size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLastOpenedView('telemetry'); setActiveView('telemetry'); }}
                    className={`hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm transition-colors ${lastOpenedView === 'telemetry' ? 'bg-white/5 dark:bg-purple-500/5 text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Activity size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                      <span>System Telemetry</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="relative flex h-2 w-2 shrink-0 rounded-full"
                        title={access.isUnlimited ? 'Unlimited' : nodesCount < access.neuronLimit * 0.85 ? 'Healthy' : nodesCount < access.neuronLimit ? 'Approaching limit' : 'Limit reached'}
                      >
                        {!access.isUnlimited && nodesCount < access.neuronLimit && (
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${nodesCount < access.neuronLimit * 0.85 ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                        )}
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 ${
                            access.isUnlimited ? 'bg-emerald-500' : nodesCount >= access.neuronLimit ? 'bg-red-500' : nodesCount >= access.neuronLimit * 0.85 ? 'bg-orange-500' : 'bg-emerald-500'
                          }`}
                        />
                      </span>
                      <ChevronRight size={16} className="text-neutral-500 dark:text-neutral-500" />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLastOpenedView('management'); setActiveView('management'); }}
                    className={`hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm transition-colors ${lastOpenedView === 'management' ? 'bg-white/5 dark:bg-purple-500/5 text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
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
                    {access.canUsePathfinder ? (
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
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRequestUpgrade?.("constellation")}
                        className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-500 dark:text-neutral-500 opacity-60 hover:opacity-100 hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <Route size={16} className="shrink-0" />
                          <span>Pathfinder</span>
                        </div>
                        <span className="flex items-center gap-2 shrink-0">
                          <kbd className={kbdClass}>Ctrl+Alt+P</kbd>
                          <span className="text-purple-500 dark:text-purple-400 shrink-0" aria-hidden><Lock size={14} /></span>
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => access.canUseZenMode ? onZenModeClick?.() : onRequestUpgrade?.("constellation")}
                      className={`w-full h-10 flex items-center justify-between px-3 rounded-md text-sm transition-colors ${access.canUseZenMode ? 'hover:cursor-pointer text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5' : 'opacity-60 hover:opacity-100 hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] text-neutral-500 dark:text-neutral-500 cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Eye size={16} className="shrink-0" />
                        <span>Zen Mode</span>
                      </div>
                      {access.canUseZenMode ? <kbd className={kbdClass}>—</kbd> : <span className="text-purple-500 dark:text-purple-400 shrink-0" aria-hidden><Lock size={14} /></span>}
                    </button>
                    {access.canUseTimeMachine ? (
                    <button type="button" onClick={() => onOpenTimeline?.()} className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2.5"><Clock size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" /><span>Time Machine</span></div>
                      <kbd className={kbdClass}>Ctrl+Alt+T</kbd>
                    </button>
                    ) : (
                    <button type="button" onClick={() => onRequestUpgrade?.("singularity")} className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-500 dark:text-neutral-500 opacity-60 hover:opacity-100 hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all">
                      <div className="flex items-center gap-2.5"><Clock size={16} className="shrink-0" /><span>Time Machine</span></div>
                      <span className="flex items-center gap-2 shrink-0">
                        <kbd className={kbdClass}>Ctrl+Alt+T</kbd>
                        <span className="text-purple-500 dark:text-purple-400 shrink-0" aria-hidden><Lock size={14} /></span>
                      </span>
                    </button>
                    )}
                    {access.canUseEvolutionJournal ? (
                    <button type="button" onClick={() => onOpenHistory?.()} className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2.5"><History size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" /><span>Evolution Journal</span></div>
                      <kbd className={kbdClass}>Ctrl+Alt+H</kbd>
                    </button>
                    ) : (
                    <button type="button" onClick={() => onRequestUpgrade?.("singularity")} className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-500 dark:text-neutral-500 opacity-60 hover:opacity-100 hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all">
                      <div className="flex items-center gap-2.5"><History size={16} className="shrink-0" /><span>Evolution Journal</span></div>
                      <span className="flex items-center gap-2 shrink-0">
                        <kbd className={kbdClass}>Ctrl+Alt+H</kbd>
                        <span className="text-purple-500 dark:text-purple-400 shrink-0" aria-hidden><Lock size={14} /></span>
                      </span>
                    </button>
                    )}
                    {access.canUseNeuralCore ? (
                    <button type="button" data-tour-id="tour-neural-chat" onClick={() => onOpenChat?.()} className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2.5"><MessageCircle size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" /><span>Neural Core</span></div>
                      <kbd className={kbdClass}>Ctrl+Alt+C</kbd>
                    </button>
                    ) : (
                    <button type="button" onClick={() => onRequestUpgrade?.("singularity")} className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-500 dark:text-neutral-500 opacity-60 hover:opacity-100 hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all">
                      <div className="flex items-center gap-2.5"><MessageCircle size={16} className="shrink-0" /><span>Neural Core</span></div>
                      <span className="flex items-center gap-2 shrink-0">
                        <kbd className={kbdClass}>Ctrl+Alt+C</kbd>
                        <span className="text-purple-500 dark:text-purple-400 shrink-0" aria-hidden><Lock size={14} /></span>
                      </span>
                    </button>
                    )}
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
                              <button type="button" onClick={() => { if (shares.length >= access.sharedUniversesLimit) { onRequestUpgrade?.(plan === 'constellation' ? 'singularity' : 'constellation'); return; } setShareInitial({ scope: 'GROUPS', groupIds: [g.id] }); setIsShareModalOpen(true); }} className="hover:cursor-pointer p-1 opacity-0 group-hover/list:opacity-100 text-neutral-400 hover:text-indigo-600 dark:hover:text-purple-400 transition-all" title="Share"><Share2 size={12} /></button>
                              <button type="button" onClick={() => onDeleteGroup(g.id)} className="hover:cursor-pointer p-1 opacity-0 group-hover/list:opacity-100 text-neutral-400 hover:text-red-500 transition-all" title="Delete cluster"><Trash2 size={12} /></button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-semibold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase flex items-center justify-between gap-1.5 w-full">
                        Filters
                        {!access.canUseFilters && <span className="text-purple-500 dark:text-purple-400 shrink-0" aria-hidden><Lock size={12} /></span>}
                      </span>
                      {!access.canUseFilters ? (
                        <button type="button" onClick={() => onRequestUpgrade?.("constellation")} className="w-full py-3 px-2 rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 opacity-60 hover:opacity-100 hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                          <span>Advanced Filters (Constellation)</span>
                          <span className="text-purple-500 dark:text-purple-400 shrink-0" aria-hidden><Lock size={14} /></span>
                        </button>
                      ) : tags.length === 0 ? (
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
                    <div className="w-full h-10 flex items-center justify-between px-3 rounded-md">
                      <div className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                        <Box size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" />
                        <span>Universe view</span>
                      </div>
                      <div role="group" aria-label="2D or 3D view" className="flex h-8 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-0.5 shrink-0 gap-0.5">
                        <button type="button" title="2D" onClick={() => onViewModeChange?.('2D')} className={`hover:cursor-pointer px-3 flex items-center justify-center rounded-full text-xs font-medium transition-all duration-200 ${viewMode === '2D' ? 'bg-indigo-500/20 dark:bg-purple-500/20 text-indigo-600 dark:text-purple-400 border border-indigo-500/30 dark:border-purple-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] dark:shadow-[0_0_12px_rgba(168,85,247,0.15)]' : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'}`}>2D</button>
                        {canUse3DGraph ? (
                          <button type="button" title="3D" onClick={() => onViewModeChange?.('3D')} className={`hover:cursor-pointer px-3 flex items-center justify-center rounded-full text-xs font-medium transition-all duration-200 ${viewMode === '3D' ? 'bg-indigo-500/20 dark:bg-purple-500/20 text-indigo-600 dark:text-purple-400 border border-indigo-500/30 dark:border-purple-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] dark:shadow-[0_0_12px_rgba(168,85,247,0.15)]' : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'}`}>3D</button>
                        ) : (
                          <button type="button" title="3D (Singularity only)" onClick={onRequest3DUpgrade} className="hover:cursor-pointer px-3 flex items-center justify-center rounded-full text-xs font-medium text-neutral-500 dark:text-neutral-500 opacity-70 hover:opacity-100 hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all gap-1">
                            <span>3D</span>
                            <Lock size={10} className="text-purple-500 dark:text-purple-400 shrink-0" />
                          </button>
                        )}
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
                    <button type="button" onClick={() => { if (shares.length >= access.sharedUniversesLimit) { onRequestUpgrade?.(plan === 'constellation' ? 'singularity' : 'constellation'); return; } setShareInitial({ scope: 'ALL', groupIds: [] }); setIsShareModalOpen(true); }} className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2.5"><Share2 size={16} className="text-neutral-500 dark:text-neutral-500 shrink-0" /><span>Share</span></div>
                      <kbd className={kbdClass}>Share</kbd>
                    </button>
                    {access.canUseImportExport ? (
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
                    ) : (
                    <button type="button" onClick={() => onRequestUpgrade?.("constellation")} className="w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-500 dark:text-neutral-500 opacity-60 hover:opacity-100 hover:bg-purple-500/10 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all">
                      <div className="flex items-center gap-2.5"><ImportIcon size={16} className="shrink-0" /><span>Data Transfer</span></div>
                      <span className="text-purple-500 dark:text-purple-400 shrink-0" aria-hidden><Lock size={14} /></span>
                    </button>
                    )}
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
                    <div className="pt-3 border-t border-black/10 dark:border-white/5 space-y-3">
                      {access.isUnlimited ? (
                        <>
                          <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 w-fit">
                            <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">Status: Unlimited</span>
                          </div>
                          <div className="space-y-1 text-[10px] text-neutral-500 dark:text-white/40">
                            <p className="font-medium">Neurons: {isStatsLoading ? '…' : nodesCount}</p>
                            <p className="font-medium">Links: {isStatsLoading ? '…' : linksCount}</p>
                          </div>
                          {access.sharedUniversesLimit === Infinity ? (
                            <div className="text-[10px] text-neutral-500 dark:text-white/40">
                              Shares: {shares.length} <span className="text-purple-500/80 dark:text-purple-400/80">(Unlimited)</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-neutral-500 dark:text-white/40">
                              Shares: {shares.length} / {access.sharedUniversesLimit}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-neutral-500 dark:text-white/40 font-medium">
                              Universe Capacity: {isStatsLoading ? '…' : `${nodesCount} / ${access.neuronLimit} Neurons`}
                            </p>
                            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-300"
                                style={{ width: `${Math.min(100, (nodesCount / access.neuronLimit) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-[10px] text-neutral-500 dark:text-white/40">
                            Shares: {shares.length} / {access.sharedUniversesLimit}
                          </div>
                        </>
                      )}
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

          {/* User Profile Card – dropdown trigger */}
          <div className="mt-6 pt-6 border-t border-black/10 dark:border-white/5 relative">
            <AnimatePresence>
              {profileMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-30"
                    aria-hidden
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="absolute bottom-full left-0 right-0 z-40 mb-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-xl backdrop-blur"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setFeedbackModalOpen(true);
                        setProfileMenuOpen(false);
                      }}
                      className="hover:cursor-pointer flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-t-xl transition-colors"
                    >
                      <SmilePlus size={16} className="text-neutral-600 dark:text-neutral-400 shrink-0" />
                      Mission Feedback
                    </button>
                    <a
                      href="https://nervia.space/support"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <LifeBuoy size={16} className="text-neutral-600 dark:text-neutral-400 shrink-0" />
                      Houston Support
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsModalOpen(true);
                        setProfileMenuOpen(false);
                      }}
                      className="hover:cursor-pointer flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <Settings size={16} className="text-neutral-600 dark:text-neutral-400 shrink-0" />
                      Account Settings
                    </button>
                    <div className="border-t border-neutral-200 dark:border-neutral-700" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="hover:cursor-pointer flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-neutral-600 dark:text-neutral-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <LogOut size={16} className="shrink-0" />
                      Sign Out
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteAccountModalOpen(true);
                        setProfileMenuOpen(false);
                      }}
                      className="hover:cursor-pointer flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-b-xl transition-colors"
                    >
                      <Trash2 size={16} className="shrink-0" />
                      Delete Account
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            {/* Rotating gradient border – running border strictly on perimeter */}
            <div className="relative w-full rounded-xl overflow-hidden p-[1px]">
              {/* Animated layer: large conic gradient, rotates so 1px edge is visible as border */}
              <motion.div
                className="absolute inset-[-100%] blur-sm pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, #6366f1, #a855f7, transparent, #6366f1)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                aria-hidden
              />
              {/* Content layer: solid mask so only the 1px perimeter shows the gradient */}
              <div className="relative z-10 rounded-[11px] bg-white dark:bg-[#050505] min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileMenuOpen((v) => !v);
                  }}
                  className="cursor-pointer w-full p-4 flex items-center dark:bg-neutral-900/50 gap-3 text-left group hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors min-w-0 rounded-[11px]"
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 dark:bg-purple-500/20 border border-indigo-500/30 dark:border-purple-500/30 overflow-hidden flex items-center justify-center">
                      {user?.user_metadata?.avatar_url ? (
                        <Image src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" width={50} height={50} />
                      ) : (
                        <UserIcon size={20} className="text-indigo-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full" />
                  </div>
                  <div className="flex flex-col max-w-[120px] min-w-0 flex-1">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                    </span>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      <MissionFeedbackModal key="mission-feedback-modal" isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} />
      <DeleteAccountModal key="delete-account-modal" isOpen={deleteAccountModalOpen} onClose={() => setDeleteAccountModalOpen(false)} />
      <SettingsModal
        key="settings-modal"
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        user={user}
        onSuccess={() => {
          supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
        }}
      />
      {/* Notification center panel */}
      <AnimatePresence key="notification-panel">
        {isOpen && isNotificationPanelOpen && (
          <>
            <motion.div
              key="notification-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
              aria-hidden
              onClick={() => setIsNotificationPanelOpen(false)}
            />
            <motion.div
              key="notification-drawer"
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
        allowShareClusters={access.canCreateShare(shares.length)}
        allowCreateShare={access.canCreateShare(shares.length)}
        onUpgradeRequest={() => onRequestUpgrade?.(plan === 'constellation' ? 'singularity' : 'constellation')}
      />
    </AnimatePresence>
  );
}