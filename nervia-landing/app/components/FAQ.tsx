"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FadeIn } from "./FadeIn";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const INITIAL_VISIBLE = 4;

const faqs = [
  {
    q: "What is a Neuron?",
    a: "A Neuron is a single unit of knowledge - a note, a bookmark, a source, or an idea - that lives in your graph. You connect neurons to each other; clusters form automatically as related ideas group together.",
  },
  {
    q: "What is the difference between 2D and 3D graph?",
    a: "Genesis includes a 2D knowledge graph to build and explore your connections. Singularity unlocks the full 3D graph: fly through your knowledge in 3D, zoom into clusters, and navigate your universe spatially.",
  },
  {
    q: "How do I sign in?",
    a: "You can sign in with Google, GitHub, or Magic Link (email). No password required for Magic Link - we send you a one-time link to access your account.",
  },
  {
    q: "What is the Neural Core?",
    a: "The Neural Core is Nervia's AI layer (Singularity tier). It uses RAG over your graph so you can chat with your knowledge: ask questions, get summaries, and surface connections across your neurons in real time.",
  },
  {
    q: "What are clusters?",
    a: "Clusters are groups of connected neurons that form automatically as you add and link content. You can focus on one cluster, share it (e.g. as a 3D world on higher tiers), and use it to organize your thinking.",
  },
  {
    q: "What is the Browser Web Clipper?",
    a: "Our browser extension lets you save pages, highlights, and ideas from the web straight into your graph. One click creates a new neuron and keeps your browsing connected to your knowledge base.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. Data import and export are available on Constellation and Singularity. You can export your graph and content to use or back up outside Nervia.",
  },
  {
    q: "What are Pathfinder and Zen Mode?",
    a: "Pathfinder helps you navigate between neurons and clusters in your graph. Zen Mode is a focused view so you can work without distraction. Both are included in Constellation and above.",
  },
  {
    q: "What is Time Machine and the Evolution Journal?",
    a: "Time Machine and the Evolution Journal (Singularity) let you see how your knowledge graph changed over time. Revisit past states and track the growth of your universe.",
  },
  {
    q: "What are Shared Universes?",
    a: "On Singularity you can publish clusters as interactive 3D worlds - Shared Universes - that others can explore. Great for sharing research, portfolios, or curated knowledge.",
  },
  {
    q: "What happens if I hit the 60-neuron limit on Genesis?",
    a: "Genesis is free and includes up to 60 neurons. When you need more, upgrade to Constellation for unlimited neurons and more features. You can also try Singularity with a free trial.",
  },
  {
    q: "Can I try Singularity for free?",
    a: "Yes. Singularity comes with a free trial. No credit card required to start. You can explore the Neural Core, 3D graph, and other Singularity features before subscribing.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your graph lives in your workspace. We never train on your content. For full details, see our Privacy Policy.",
  },
];

export function FAQ() {
  const [expanded, setExpanded] = useState(false);
  const visibleFaqs = expanded ? faqs : faqs.slice(0, INITIAL_VISIBLE);
  const hasMore = faqs.length > INITIAL_VISIBLE;

  return (
    <div className="relative w-full">
      <div className="mx-auto max-w-3xl">
        <FadeIn className="text-center">
          <SectionHeader kicker="Sys.Req // faq" title="Frequently asked questions" />
        </FadeIn>
        <ul className="mt-16 space-y-6">
          {visibleFaqs.map((faq, i) => (
            <motion.li
              key={faq.q}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * i, ease: "easeOut" }}
              className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm transition hover:border-indigo-500/25 hover:bg-black/40"
            >
              <h3 className="font-semibold text-white">{faq.q}</h3>
              <p className="mt-2 text-neutral-400">{faq.a}</p>
            </motion.li>
          ))}
        </ul>
        {hasMore && (
          <FadeIn delay={0.5} className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-neutral-200 backdrop-blur-sm transition hover:bg-white/[0.06] hover:border-indigo-500/25 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 focus:ring-offset-black"
              aria-expanded={expanded}
            >
              {expanded ? (
                <>
                  Show less
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Show {faqs.length - INITIAL_VISIBLE} more questions
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
