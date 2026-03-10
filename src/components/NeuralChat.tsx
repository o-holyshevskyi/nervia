/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import CloseButton from "./ui/CloseButton";
import posthog from "posthog-js";
import { TELEMETRY_EVENTS } from "@/src/lib/telemetry/events";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface NeuralChatProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: any[];
  setContextNodeIds?: (ids: string[]) => void;
}

function getNodeId(node: any): string {
  return typeof node.id === "string" ? node.id : node?.id ?? "";
}

/** Renders text with **bold** as <strong> for assistant messages. */
function renderFormattedContent(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

const CONTEXT_HIGHLIGHT_DURATION_MS = 4000;

export default function NeuralChat({
  isOpen,
  onClose,
  nodes,
  setContextNodeIds,
}: NeuralChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDarkTheme = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const accentBorder = isDarkTheme ? "rgba(168, 85, 247, 0.4)" : "rgba(99, 102, 241, 0.4)";
  const accentGlow = isDarkTheme ? "0 0 20px rgba(168, 85, 247, 0.2)" : "0 0 20px rgba(99, 102, 241, 0.2)";

  const nodeById = useMemo(
    () =>
      new Map(
        nodes.map((n: any) => {
          const id = getNodeId(n);
          return [id, n];
        })
      ),
    [nodes]
  );

  const displayedMessages = messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setError(null);
    setContextNodeIds?.([]);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const contextNodesForSearch = nodes.map((n: any) => ({
        id: getNodeId(n),
        summary: (n.content ?? getNodeId(n)) as string,
        tags: Array.isArray(n.tags) ? n.tags : [],
      }));

      let searchResults: { id: string }[] = [];
      if (nodes.length > 0 && contextNodesForSearch.length > 0) {
        const searchRes = await fetch("/api/ai/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: text, contextNodes: contextNodesForSearch }),
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          searchResults = Array.isArray(searchData.results) ? searchData.results.slice(0, 7) : [];
        }
      }
      setContextNodeIds?.(searchResults.map((r) => r.id));

      const contextNodesForChat = searchResults
        .map((r) => nodeById.get(r.id))
        .filter(Boolean)
        .map((n: any) => ({
          title: (n.title ?? n.content ?? getNodeId(n)) as string,
          summary: (n.content ?? "") as string,
          tags: Array.isArray(n.tags) ? n.tags : [],
        }));

      const chatStartMs = Date.now();
      posthog.capture(TELEMETRY_EVENTS.AI_REQUEST_SENT, { endpoint: "chat", batch_size: 1 });

      const chatRes = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userQuestion: text,
          contextNodes: contextNodesForChat,
        }),
      });

      const chatLatencyMs = Date.now() - chatStartMs;
      const chatSuccess = chatRes.ok;
      posthog.capture(TELEMETRY_EVENTS.AI_RESPONSE_RECEIVED, {
        endpoint: "chat",
        batch_size: 1,
        latency_ms: chatLatencyMs,
        success: chatSuccess,
      });

      if (!chatRes.ok) {
        const errData = await chatRes.json().catch(() => ({}));
        throw new Error(errData.error || `Chat failed: ${chatRes.status}`);
      }

      const chatData = await chatRes.json();
      const reply = typeof chatData.reply === "string" ? chatData.reply : "No reply.";
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(() => setContextNodeIds?.([]), CONTEXT_HIGHLIGHT_DURATION_MS);
    } catch (err) {
      console.error("Neural chat error:", err);
      const errMessage = err instanceof Error ? err.message : "Something went wrong.";
      setError(errMessage);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          role: "assistant",
          content: `Sorry, I couldn't answer: ${errMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[90] bg-black/20 dark:bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            key="neural-chat"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-96 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-2xl border-l border-black/10 dark:border-white/10 shadow-2xl z-[95] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <MessageCircle size={20} className="text-indigo-600 dark:text-purple-400 shrink-0" />
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  Neural Core
                </span>
              </div>
              <CloseButton onClose={onClose} size={18} />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto simple-scrollbar p-4 space-y-4">
              {displayedMessages.length === 0 && !isLoading && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-8">
                  Ask anything about your knowledge base. I&apos;ll use semantic search to find relevant nodes, then answer from that context.
                </p>
              )}
              {displayedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-indigo-500/20 dark:bg-purple-500/20 text-neutral-900 dark:text-white border border-indigo-500/30 dark:border-purple-500/30"
                        : "bg-black/5 dark:bg-white/5 text-neutral-800 dark:text-neutral-200 border border-black/10 dark:border-white/10"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {msg.role === "assistant"
                        ? renderFormattedContent(msg.content)
                        : msg.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      filter: "blur(0px)",
                      borderColor: [
                        "rgba(6, 182, 212, 0.4)",
                        accentBorder,
                        "rgba(6, 182, 212, 0.4)",
                      ],
                      boxShadow: [
                        "0 0 20px rgba(6, 182, 212, 0.2)",
                        accentGlow,
                        "0 0 20px rgba(6, 182, 212, 0.2)",
                      ],
                    }}
                    transition={{
                      opacity: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
                      scale: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
                      filter: { duration: 0.45 },
                      borderColor: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                      boxShadow: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                    }}
                    className="relative flex items-center gap-2 rounded-2xl px-4 py-2.5 overflow-hidden bg-black/5 dark:bg-white/5 border text-neutral-500 dark:text-neutral-400 text-sm"
                  >
                    {/* Data scan: subtle white/20 light beam sweeping left → right every 2s */}
                    <motion.div
                      className="absolute top-0 bottom-0 w-[50%] pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 45%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.2) 55%, transparent 100%)",
                      }}
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    {/* Processing icon: full rotation over 3s + slight jitter */}
                    <motion.span
                      className="relative z-10 flex shrink-0"
                      animate={{
                        rotate: [0, 360],
                        x: [0, 1, -1, 0.5, 0],
                        y: [0, -0.5, 1, 0, 0],
                      }}
                      transition={{
                        rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                        x: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
                        y: { duration: 0.6, repeat: Infinity, ease: "easeInOut" },
                      }}
                    >
                      <Sparkles size={14} className="text-cyan-500 dark:text-cyan-400" />
                    </motion.span>
                    {/* Staggered "Thinking..." dots */}
                    <span className="relative z-10 flex items-baseline">
                      Thinking
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 1, 0] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.25,
                            ease: "easeInOut",
                          }}
                        >
                          .
                        </motion.span>
                      ))}
                    </span>
                  </motion.div>
                </div>
              )}
              {error && (
                <p className="text-xs text-amber-600 dark:text-amber-400/90 px-1">{error}</p>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-black/10 dark:border-white/10 shrink-0 space-y-2">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your knowledge base…"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 text-sm focus:outline-none focus:border-indigo-500/50 dark:focus:border-purple-500/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!canSend}
                  className="hover:cursor-pointer p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:bg-purple-600 dark:hover:bg-purple-500 disabled:opacity-50 disabled:hover:cursor-not-allowed text-white transition-colors"
                  aria-label="Send"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
