"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { NeuralBackground } from "@/src/components/NeuralBackground";

type BadgeCategory = "Integration" | "AI" | "Core" | "Launch" | "Performance" | "Architecture" | "Collaboration";

interface RoadmapItemProps {
  title: string;
  description: string;
  badge?: BadgeCategory;
  isRightAligned: boolean;
}

// Замість важкої "картки" — легкий голографічний рядок
function HolographicItem({ title, description, badge, isRightAligned }: RoadmapItemProps) {
  return (
    <div className={`group relative flex flex-col gap-2 transition-all duration-300 ${isRightAligned ? "md:items-end md:text-right" : "md:items-start md:text-left"}`}>
      <div className={`flex items-center gap-3 ${isRightAligned ? "md:flex-row-reverse" : "md:flex-row"}`}>
        {/* Неонова крапка / Вузол */}
        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] dark:bg-indigo-400 group-hover:scale-150 transition-transform" />
        <h3 className="text-sm md:text-base font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
          {title}
        </h3>
        {badge && (
          <span className="shrink-0 rounded bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
            {badge}
          </span>
        )}
      </div>
      <p className={`text-xs md:text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 max-w-sm ${isRightAligned ? "md:mr-4.5" : "md:ml-4.5"}`}>
        {description}
      </p>
    </div>
  );
}

type PhaseId = "now" | "next" | "later" | "singularity";

interface RoadmapPhaseData {
  id: PhaseId;
  label: string;
  subtitle: string;
  items: { title: string; description: string; badge?: BadgeCategory }[];
}

const roadmapData: RoadmapPhaseData[] = [
  {
    id: "now",
    label: "Phase I: Now",
    subtitle: "Currently forming in the core",
    items: [
      {
        title: "Companion Extension Rollout",
        description: "Awaiting final approval from the Chrome Web Store for our Web Clipper. Soon you'll be able to capture ideas from anywhere in the galaxy.",
        badge: "Launch",
      },
      {
        title: "Physics & Gravity Tuning",
        description: "Refining the 3D graph algorithms to ensure smoother clustering and visual organization as your universe expands to hundreds of nodes.",
        badge: "Performance",
      }
    ],
  },
  {
    id: "next",
    label: "Phase II: Next",
    subtitle: "Entering the inner orbit",
    items: [
      {
        title: "Data Migration (Import)",
        description: "Tools to beam your existing knowledge bases into the exocortex. Support for importing Markdown files (Obsidian) and Notion workspaces.",
        badge: "Integration",
      },
      {
        title: "Rich Text Neuron Editor",
        description: "An upgraded, block-based editor inside your neurons. Support for rich formatting, inline images, tables, and task lists.",
        badge: "Core",
      }
    ],
  },
  {
    id: "later",
    label: "Phase III: Later",
    subtitle: "Deep space vision",
    items: [
      {
        title: "Auto-Pilot (AI Tagging)",
        description: "Let our AI analyze your saved web pages and notes to automatically suggest relevant tags and discover hidden connections without manual work.",
        badge: "AI",
      },
      {
        title: "Local-First Architecture",
        description: "Your universe will live locally on your device for maximum speed and absolute privacy, syncing to the cloud in the background when online.",
        badge: "Architecture",
      },
      {
        title: "Multiplayer Knowledge (Co-op)",
        description: "Collaborative clusters. Invite other astronauts into your universe to co-create and edit spatial knowledge graphs in real-time.",
        badge: "Collaboration",
      }
    ],
  },
  {
    id: "singularity",
    label: "Phase IV: Singularity",
    subtitle: "Beyond the event horizon",
    items: [
      {
        title: "Neural Synthesis (AI Co-Pilot)",
        description: "Your universe starts talking back. Advanced LLM integration that can write summaries, answer questions, and generate new ideas based on your unique knowledge graph.",
        badge: "AI",
      },
      {
        title: "Autonomous Evolution",
        description: "The graph evolves while you sleep. AI agents periodically re-organize, link, and discover contradictions or gaps in your thinking.",
        badge: "Core",
      },
      {
        title: "The Open Galaxy (API)",
        description: "A full developer SDK to build your own tools on top of the Nervia exocortex. Feed your graph into other apps or build custom visualization engines.",
        badge: "Architecture",
      }
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-neutral-50 dark:bg-[#050505] relative text-neutral-900 dark:text-white transition-colors duration-500">
      
      {/* --- ГАЛАКТИЧНИЙ ФОН ТА ЯДРО (FIXED) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        
        {/* Пульсація навколо ядра */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-50 h-50 rounded-full bg-indigo-400 dark:bg-indigo-600 blur-[50px]"
        />
        
        {/* Центральне ядро Nervia (Твій компонент) */}
        <div className="relative z-10 flex items-center justify-center rounded-full p-2">
          <span className="relative h-30 w-30 shrink-0 overflow-hidden rounded-full flex items-center justify-center" aria-hidden>
            <NeuralBackground clipPathId="neural-brain-clip-app-roadmap" />
          </span>
        </div>

        {/* 8 Орбіт (Комети) */}
        {/* Орбіта 1: Core (Бірюзова) */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute w-[200px] h-[200px] rounded-full border border-black/5 dark:border-white/5 border-dashed flex items-center justify-start transition-colors duration-500">
          <div className="flex items-center gap-2 -translate-x-1">
            <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_10px_2px_rgba(45,212,191,0.5)]" />
            <p className="text-[9px] font-mono tracking-tighter text-neutral-400 dark:text-neutral-500 -rotate-12">CORE</p>
          </div>
        </motion.div>

        {/* Орбіта 2: Synapse (Помаранчева) */}
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute w-[350px] h-[350px] rounded-full border border-black/5 dark:border-white/5 flex items-start justify-center transition-colors duration-500">
          <div className="flex flex-col items-center gap-1 -translate-y-2.5">
            <p className="text-[9px] font-mono tracking-tighter text-neutral-400 dark:text-neutral-500 rotate-0">SYNAPSE</p>
            <div className="w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_15px_3px_rgba(249,115,22,0.5)]" />
          </div>
        </motion.div>

        {/* Орбіта 3: Neural Bridge (Рожева) */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 55, repeat: Infinity, ease: "linear" }} className="absolute w-[500px] h-[500px] rounded-full border border-black/5 dark:border-white/5 border-dashed flex items-center justify-end transition-colors duration-500">
          <div className="flex items-center gap-2 translate-x-1.5">
            <p className="text-[9px] font-mono tracking-tighter text-neutral-400 dark:text-neutral-500 -rotate-45">NEURAL_BRIDGE</p>
            <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_12px_2px_rgba(236,72,153,0.5)]" />
          </div>
        </motion.div>

        {/* Орбіта 4: Exocortex (Індиго) */}
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} className="absolute w-[650px] h-[650px] rounded-full border border-black/5 dark:border-white/5 flex items-end justify-center transition-colors duration-500">
          <div className="flex flex-col items-center gap-1 translate-y-1">
            <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_15px_3px_rgba(99,102,241,0.5)]" />
            <p className="text-[9px] font-mono tracking-tighter text-neutral-400 dark:text-neutral-500 rotate-180">EXOCORTEX</p>
          </div>
        </motion.div>

        {/* Орбіта 5: Proxy (Фіолетова) */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 90, repeat: Infinity, ease: "linear" }} className="absolute w-[800px] h-[800px] rounded-full border border-black/5 dark:border-white/5 border-dashed flex items-center justify-start transition-colors duration-500">
          <div className="flex items-center gap-2 -translate-x-2">
            <div className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-[0_0_20px_4px_rgba(168,85,247,0.5)]" />
            <p className="text-[9px] font-mono tracking-tighter text-neutral-400 dark:text-neutral-500 -rotate-90">PROXY_NODE</p>
          </div>
        </motion.div>

        {/* Орбіта 6: Uplink (Синя) */}
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 110, repeat: Infinity, ease: "linear" }} className="absolute w-[950px] h-[950px] rounded-full border border-black/5 dark:border-white/5 flex items-start justify-center transition-colors duration-500">
          <div className="flex flex-col items-center gap-1 -translate-y-1.5">
            <p className="text-[9px] font-mono tracking-tighter text-neutral-400 dark:text-neutral-500 rotate-12">DATA_UPLINK</p>
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_15px_3px_rgba(59,130,246,0.5)]" />
          </div>
        </motion.div>

        {/* Орбіта 7: Gravity (Rose) */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 130, repeat: Infinity, ease: "linear" }} className="absolute w-[1150px] h-[1150px] rounded-full border border-black/5 dark:border-white/5 border-dashed flex items-center justify-end transition-colors duration-500">
          <div className="flex items-center gap-2 translate-x-1">
            <p className="text-[9px] font-mono tracking-tighter text-neutral-400 dark:text-neutral-500 -rotate-180">GRAVITY_GEN</p>
            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_12px_2px_rgba(244,63,94,0.5)]" />
          </div>
        </motion.div>

        {/* Орбіта 8: Archive (Світло-фіолетова) */}
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 160, repeat: Infinity, ease: "linear" }} className="absolute w-[1400px] h-[1400px] rounded-full border border-black/5 dark:border-white/5 flex items-end justify-center transition-colors duration-500">
          <div className="flex flex-col items-center gap-1 translate-y-2.5">
            <div className="w-5 h-5 rounded-full bg-indigo-300 shadow-[0_0_20px_5px_rgba(129,140,248,0.4)]" />
            <p className="text-[9px] font-mono tracking-tighter text-neutral-400 dark:text-neutral-500 rotate-0">DEEP_ARCHIVE</p>
          </div>
        </motion.div>
        
        {/* Фоновий пил */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#fafafa_75%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,#050505_75%)] transition-colors duration-500" />
      </div>
      {/* ------------------------------------- */}

      <Link
        href="/"
        className="fixed top-6 left-6 z-20 inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors bg-white/50 dark:bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-black/10 dark:border-white/10"
      >
        <ArrowLeft size={16} />
        Back to Universe
      </Link>

      {/* МАГНІТНІ СЕКЦІЇ (HOLOGRAPHIC PANELS) */}
      {roadmapData.map((phase, index) => {
        const isRightSide = index % 2 === 0; // 0 і 2 справа, 1 зліва
        
        // На десктопі панелі зміщуються від центру. На мобайлі - по центру.
        const positionClass = isRightSide 
          ? "md:translate-x-[45%] lg:translate-x-[65%]" 
          : "md:-translate-x-[45%] lg:-translate-x-[65%]";
          
        // Лінія конекту до ядра (зліва для правих панелей, справа для лівих)
        const borderClass = isRightSide
          ? "md:border-l-2 md:pl-10 lg:pl-16 border-indigo-500/30 dark:border-indigo-500/40"
          : "md:border-r-2 md:pr-10 lg:pr-16 border-purple-500/30 dark:border-purple-500/40";

        // Вирівнювання тексту
        const alignClass = isRightSide
          ? "items-center text-center md:items-start md:text-left"
          : "items-center text-center md:items-end md:text-right";

        return (
          <section
            key={index}
            className="relative z-10 h-screen w-full snap-center snap-always flex flex-col items-center justify-center px-6"
          >
            <div className={`w-full max-w-md md:max-w-lg ${positionClass}`}>
              <motion.div
                // Ефект "включення голограми": плавно з'являється з блюром
                initial={{ opacity: 0, x: isRightSide ? -30 : 30, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: false, amount: 0.6 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className={`flex flex-col ${alignClass} ${borderClass}`}
              >
                
                {/* Метадані фази (Стиль HUD) */}
                <div className="mb-2 font-mono text-[10px] md:text-xs tracking-[0.2em] text-neutral-400 dark:text-neutral-500 uppercase">
                  Sys.Req // {phase.id}
                </div>
                
                <h2 className="mb-2 text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-500">
                  {phase.label}
                </h2>
                
                <p className="mb-10 font-mono text-xs text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                  {phase.subtitle}
                </p>
                
                {/* Список фіч */}
                <div className="flex flex-col gap-8 w-full">
                  {phase.items.map((item) => (
                    <HolographicItem
                      key={item.title}
                      title={item.title}
                      description={item.description}
                      badge={item.badge}
                      isRightAligned={!isRightSide} // Якщо панель зліва, текст вирівнюється вправо
                    />
                  ))}
                </div>

              </motion.div>
            </div>
          </section>
        );
      })}
    </div>
  );
}