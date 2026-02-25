/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Filter, Search } from "lucide-react";
import FilterPanel from "./FilterPanel";
import CloseButton from "./ui/CloseButton";
import SearchInput from "./ui/SearchInput";

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  tags: string[];
  activeTag: string | null;
  nodes: any[];
  onSelect: (node: any) => void;
  onTagSelect: (tag: string | null) => void;
}

export default function LeftSidebar({ isOpen, onClose, tags, activeTag, onTagSelect, nodes, onSelect }: LeftSidebarProps) {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const accordionItems = [
    {
      id: 'filters',
      title: 'Filters',
      icon: <Filter size={20} />,
      content: (
        <FilterPanel
          activeTag={activeTag}
          tags={tags}
          onClose={onClose}
          onTagSelect={onTagSelect}
        />
      )
    },
    {
      id: 'search',
      title: 'Search',
      icon: <Search size={20} />,
      content: (
        <SearchInput nodes={nodes} onSelect={onSelect} handleClose={() => {}} bordered={false} />
      )
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
            animate={{ 
                x: 0, 
                opacity: 1,
            }}
            exit={{ x: '-1000%', opacity: 0 }}
            transition={{ 
                type: 'spring', 
                duration: 0.8,
                delay: 0.1,
                ease: [0, 0.71, 0.2, 1.01]
            }}
            className="fixed top-0 left-0 h-full w-80 bg-neutral-900/60 backdrop-blur-xl border-r border-white/10 p-6 shadow-2xl z-40 flex flex-col"
        >
            <div className="self-end">
              <CloseButton onClose={onClose} />
            </div>
            
            <div className="flex flex-col gap-4 py-4 px-2 overflow-y-auto mt-6 border border-white/10 rounded-xl">
              {accordionItems.map((item) => (
                <div key={item.id} className="overflow-hidden">
                  <button
                    onClick={() => toggleAccordion(item.id)}
                    className="hover:cursor-pointer w-full flex items-center justify-between px-4 py-3 text-white hover:bg-white/5 hover:rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <motion.div
                      animate={{ rotate: openAccordion === item.id ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neutral-400">
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
                        transition={{ 
                          height: { duration: 0.3, ease: "easeInOut" },
                          opacity: { duration: 0.2 }
                        }}
                        className="px-4 pb-4"
                      >
                        {item.content}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
