/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { FileText, Lightbulb, LinkIcon, Search } from "lucide-react";
import CloseButton from "./CloseButton";
import { useState } from "react";

interface SearchinputProps {
    nodes: any[];
    bordered?: boolean;
    onSelect: (node: any) => void;
    handleClose: () => void;
}

const SearchInput = ({ nodes, bordered = true, onSelect, handleClose }: SearchinputProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    
    const filteredNodes = nodes.filter((node) => {
        const idStr = typeof node.id === 'string' ? node.id : node.id?.id || "";
        return idStr.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleSelect = (node: any) => {
        onSelect(node);
    };

    const getNodeIcon = (type: string) => {
        if (type === 'link') return <LinkIcon size={14} className="text-blue-400" />;
        if (type === 'note') return <FileText size={14} className="text-green-400" />;
        if (type === 'idea') return <Lightbulb size={14} className="text-purple-400" />;
        return <FileText size={14} className="text-neutral-400" />;
    };

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ 
                duration: 0.4, 
                type: "tween", 
                delay: 0.1,
                ease: [0, 0.71, 0.2, 1.01] 
            }}
            className={`relative w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col ${bordered && 'shadow-2xl border border-white/10 bg-neutral-900'}`}
        >
            <div className={`flex items-center py-4 border-b border-white/10 ${bordered && 'px-4'}`}>
                {bordered && <Search size={20} className="text-neutral-400 mr-3" /> }
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for an idea, note or link..."
                    className="w-full bg-transparent text-lg text-white placeholder-neutral-500 focus:outline-none"
                    autoFocus
                />
                {bordered && <CloseButton onClose={handleClose} />}
            </div>

            <div className={`max-h-[50vh] overflow-y-auto no-scrollbar ${bordered && 'p-2'}`}>
                {filteredNodes.length === 0 ? (
                    <div className="py-10 text-center text-neutral-500 text-sm">
                        Nothing found for &quot;{searchQuery}&quot;
                    </div>
                ) : (
                    filteredNodes.map((node) => {
                        const idStr = typeof node.id === 'string' ? node.id : node.id?.id;
                        return (
                            <button
                                key={idStr}
                                onClick={() => {
                                    handleSelect(node);
                                    handleClose();
                                }}
                                className="hover:cursor-pointer w-full flex items-center justify-between px-4 py-3 text-left rounded-xl hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                                        {getNodeIcon(node.type)}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{idStr}</p>
                                        {node.tags && node.tags.length > 0 && (
                                            <p className="text-xs text-neutral-500 mt-0.5">#{node.tags[0]}</p>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs text-neutral-600 group-hover:text-purple-400 transition-colors">
                                    Go →
                                </span>
                            </button>
                        );
                    })
                )}
            </div>
            <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-neutral-950 pointer-events-none z-10" />
        </motion.div>
    );
}

export default SearchInput;
