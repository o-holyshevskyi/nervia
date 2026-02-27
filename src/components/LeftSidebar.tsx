/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { Filter, LogOut, Search, UserIcon, ImportIcon, Layers, Compass, Settings2, Route, Clock, LayoutGrid, Globe, Tag, Puzzle, Plus } from "lucide-react";
import FilterPanel from "./FilterPanel";
import CloseButton from "./ui/CloseButton";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import ImportExport from "./ImportExport";
import Image from "next/image";
import Link from "next/link";
import { useExtensionDetected } from "../hooks/useExtensionDetected";
import { useUniverseStats } from "../hooks/useUniverseStats";

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
  clusterMode: 'group' | 'tag';
  onClusterModeChange: (mode: 'group' | 'tag') => void;
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
  clusterMode,
  onClusterModeChange
}: LeftSidebarProps) {
  const [openAccordion, setOpenAccordion] = useState<string | null>('');
  const [user, setUser] = useState<any>(null);
  const extensionDetected = useExtensionDetected();
  const supabase = createClient();
  const router = useRouter();
  const { nodesCount, linksCount, topTag, isLoading: isStatsLoading } = useUniverseStats(nodes);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const kbdClass = "text-xs font-mono text-neutral-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded";

  const sections = [
    {
      label: "Discovery",
      icon: <Compass size={14} className="text-neutral-500" />,
      items: [
        { id: 'search', title: 'Search', icon: <Search size={16} />, shortcut: 'Ctrl+K', onClick: () => onOpenSearch?.() },
        { id: 'pathfinder', title: 'Pathfinder', icon: <Route size={16} />, shortcut: 'Ctrl+Alt+P', onClick: () => onOpenPathfinder?.() },
        { id: 'timeline', title: 'Time Machine', icon: <Clock size={16} />, shortcut: 'Ctrl+Alt+T', onClick: () => onOpenTimeline?.() },
      ]
    },
    {
      label: "View Options",
      icon: <LayoutGrid size={14} className="text-neutral-500" />,
      items: [
        { id: 'gravity-shift', title: 'Gravity Shift', icon: <Globe size={16} />, isToggle: true },
      ]
    },
    {
      label: "Collections",
      icon: <Layers size={14} className="text-neutral-500" />,
      items: [
        {
          id: 'filters',
          title: 'Filters',
          icon: <Filter size={16} />,
          content: tags.length === 0 ? (
            <div className="py-3 px-2 text-center bg-white/5 rounded-md border border-white/10">
              <p className="text-xs text-neutral-500 italic">No tags yet</p>
            </div>
          ) : (
            <FilterPanel activeTag={activeTag} tags={tags} onClose={onClose} onTagSelect={onTagSelect} />
          )
        }
      ]
    },
    {
      label: "Management",
      icon: <Settings2 size={14} className="text-neutral-500" />,
      items: [
        {
          id: 'import-export',
          title: 'Data Transfer',
          icon: <ImportIcon size={16} />,
          content: <ImportExport onImport={onImport} onExport={onExport} />
        }
      ]
    }
  ];

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
      <motion.span className="font-mono text-white/70">
        {display}
      </motion.span>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="fixed top-0 left-0 h-full w-80 bg-neutral-950/80 backdrop-blur-2xl border-r border-white/10 p-8 shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-[0.2em]">Dashboard</span>
            </div>
            <CloseButton onClose={onClose} />
          </div>

          {/* Grouped Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pr-2">
            {sections.map((section) => (
              <div key={section.label} className="space-y-3">
                {/* Section Header */}
                <div className="flex items-center gap-2">
                  {section.icon}
                  <span className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">
                    {section.label}
                  </span>
                </div>

                {/* Items in Section */}
                <div className="space-y-1">
                  {section.items.map((item: any) => {
                    const isAction = item.onClick != null && item.shortcut != null;
                    const isToggle = item.isToggle === true;

                    if (isAction) {
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={item.onClick}
                          className="hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-neutral-500 shrink-0">{item.icon}</span>
                            <span>{item.title}</span>
                          </div>
                          <kbd className={kbdClass}>{item.shortcut}</kbd>
                        </button>
                      );
                    }

                    if (isToggle && item.id === 'gravity-shift') {
                      return (
                        <div
                          key={item.id}
                          className="w-full h-10 flex items-center justify-between px-3 rounded-md"
                        >
                          <div className="flex items-center gap-2.5 text-sm text-neutral-400">
                            <span className="text-neutral-500 shrink-0">{item.icon}</span>
                            <span>{item.title}</span>
                          </div>
                          <div
                            role="group"
                            aria-label="Cluster by category or tag"
                            className="flex h-8 w-16 rounded-full bg-white/5 border border-white/10 p-0.5 shrink-0"
                          >
                            <button
                              type="button"
                              title="Cluster by Category"
                              onClick={() => onClusterModeChange('group')}
                              className={`hover:cursor-pointer flex-1 flex items-center justify-center rounded-full transition-all duration-200 ${
                                clusterMode === 'group'
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                              }`}
                            >
                              <Globe size={14} />
                            </button>
                            <button
                              type="button"
                              title="Cluster by Tag"
                              onClick={() => onClusterModeChange('tag')}
                              className={`hover:cursor-pointer flex-1 flex items-center justify-center rounded-full transition-all duration-200 ${
                                clusterMode === 'tag'
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                              }`}
                            >
                              <Tag size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="overflow-hidden">
                        <button
                          onClick={() => toggleAccordion(item.id)}
                          className={`hover:cursor-pointer w-full h-10 flex items-center justify-between px-3 rounded-md text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition-colors group ${
                            openAccordion === item.id ? 'bg-white/5 text-white' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`shrink-0 ${openAccordion === item.id ? 'text-purple-400' : 'text-neutral-500 group-hover:text-white'}`}>
                              {item.icon}
                            </span>
                            <span>{item.title}</span>
                          </div>
                          <motion.div
                            animate={{ rotate: openAccordion === item.id ? 180 : 0 }}
                            className="text-neutral-500 shrink-0"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </motion.div>
                        </button>
                        <AnimatePresence initial={false}>
                          {openAccordion === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                              <div className="px-0 pt-1.5 pb-2">
                                {item.content}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* System Telemetry – companion + universe stats */}
          <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
            {/* Companion – system status */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Puzzle size={14} className="text-neutral-500" />
                <span className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">
                  System Telemetry
                </span>
              </div>
              <div className="space-y-1">
                {extensionDetected ? (
                  <div className="h-10 flex items-center justify-between px-3 rounded-md text-neutral-400 hover:text-white hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <motion.div
                        className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-400"
                        animate={{
                          boxShadow: [
                            '0 0 6px rgba(34,197,94,0.4)',
                            '0 0 10px rgba(34,197,94,0.5)',
                            '0 0 6px rgba(34,197,94,0.4)',
                          ],
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono truncate">
                        SYNC: ONLINE
                      </span>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/extension"
                    className="hover:cursor-pointer h-10 flex items-center justify-between px-3 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-mono truncate">
                      CLIPPER: OFFLINE
                    </span>
                    <Plus size={14} className="shrink-0 text-neutral-500 group-hover:text-white/60 transition-colors" />
                  </Link>
                )}
              </div>
            </div>

            {/* Universe Statistics */}
            <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
                  <span>NODES:</span>
                  {isStatsLoading ? (
                    <span className="font-mono text-white/30">…</span>
                  ) : (
                    <AnimatedNumber value={nodesCount} active={isOpen} />
                  )}
                  <span className="text-white/20">//</span>
                  <span>LINKS:</span>
                  {isStatsLoading ? (
                    <span className="font-mono text-white/30">…</span>
                  ) : (
                    <AnimatedNumber value={linksCount} active={isOpen} />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
                <span>FOCUS:</span>
                <div className="h-3 w-px bg-white/5" />
                <span className="font-mono text-white/70">
                  {topTag ? `#${topTag}` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between group border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 overflow-hidden flex items-center justify-center">
                    {user?.user_metadata?.avatar_url ? (
                      <Image src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" width={50} height={50} />
                    ) : (
                      <UserIcon size={20} className="text-purple-400" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-neutral-900 rounded-full" />
                </div>
                <div className="flex flex-col max-w-[120px]">
                  <span className="text-sm font-semibold text-white truncate">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono truncate">
                    {user?.email}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleSignOut}
                className="hover:cursor-pointer p-2 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}