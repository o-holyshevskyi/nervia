/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Filter, LogOut, Search, UserIcon, ImportIcon, Layers, Compass, Settings2, Route, Clock } from "lucide-react";
import FilterPanel from "./FilterPanel";
import CloseButton from "./ui/CloseButton";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import ImportExport from "./ImportExport";
import Image from "next/image";

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
  onOpenTimeline
}: LeftSidebarProps) {
  const [openAccordion, setOpenAccordion] = useState<string | null>('');
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

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

  // Логічне групування елементів
  const sections = [
    {
      label: "Discovery",
      icon: <Compass size={14} className="text-neutral-500" />,
      items: [
        {
          id: 'search',
          title: 'Search',
          icon: <Search size={18} />,
          content: (
            <div className="py-2 space-y-2">
              <p className="text-xs text-neutral-400">
                Search by name or meaning. Press Enter for semantic (AI) search.
              </p>
              <button
                type="button"
                onClick={() => onOpenSearch?.()}
                className="hover:cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 hover:text-white transition-colors text-sm font-medium"
              >
                <Search size={16} />
                Open Search (Ctrl+K)
              </button>
            </div>
          )
        },
        {
          id: 'pathfinder',
          title: 'Pathfinder',
          icon: <Route size={18} />,
          content: (
            <div className="py-2 space-y-2">
              <p className="text-xs text-neutral-400">
                Find and visualize the shortest path between two nodes (Thought Chains).
              </p>
              <button
                type="button"
                onClick={() => onOpenPathfinder?.()}
                className="hover:cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 hover:text-white transition-colors text-sm font-medium"
              >
                <Route size={16} />
                Open Pathfinder (Ctrl+Alt+P)
              </button>
            </div>
          )
        },
        {
          id: 'timeline',
          title: 'Time Machine',
          icon: <Clock size={18} />,
          content: (
            <div className="py-2 space-y-2">
              <p className="text-xs text-neutral-400">
                Replay how your knowledge graph grew over time.
              </p>
              <button
                type="button"
                onClick={() => onOpenTimeline?.()}
                className="hover:cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 hover:text-white transition-colors text-sm font-medium"
              >
                <Clock size={16} />
                Open Time Machine (Ctrl+Alt+T)
              </button>
            </div>
          )
        }
      ]
    },
    {
      label: "Collections",
      icon: <Layers size={14} className="text-neutral-500" />,
      items: [
        {
          id: 'filters',
          title: 'Filters',
          icon: <Filter size={18} />,
          content: tags.length === 0 ? (
            <div className="py-4 px-2 text-center bg-white/5 rounded-xl border border-white/5">
              <p className="text-xs text-neutral-500 italic">No tags available yet</p>
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
          icon: <ImportIcon size={18} />,
          content: <ImportExport onImport={onImport} onExport={onExport} />
        }
      ]
    }
  ];

  const toggleAccordion = (itemId: string) => {
    setOpenAccordion(openAccordion === itemId ? null : itemId);
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
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                    {section.label}
                  </span>
                </div>

                {/* Items in Section */}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div key={item.id} className="overflow-hidden">
                      <button
                        onClick={() => toggleAccordion(item.id)}
                        className={`hover:cursor-pointer w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                          openAccordion === item.id ? 'bg-white/5 shadow-inner' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`${openAccordion === item.id ? 'text-purple-400' : 'text-neutral-500 group-hover:text-white'} transition-colors`}>
                            {item.icon}
                          </span>
                          <span className={`text-sm font-medium ${openAccordion === item.id ? 'text-white' : 'text-neutral-400 group-hover:text-white'}`}>
                            {item.title}
                          </span>
                        </div>
                        <motion.div
                          animate={{ rotate: openAccordion === item.id ? 180 : 0 }}
                          className="text-neutral-600"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
                            <div className="px-4 py-3">
                              {item.content}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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