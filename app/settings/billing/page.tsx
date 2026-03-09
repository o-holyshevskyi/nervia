'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Loader2, ExternalLink, Check, Brain, LayoutGrid, Bookmark, Search, Infinity as InfinityIcon, Route, Filter, Download, Share2, Box, MessageCircle, Sparkles, Clock, Import } from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';
import { usePlan, getNeuronLimit, getSharedUniversesLimit, type PlanId } from '@/src/hooks/usePlan';

const PLAN_LABELS: Record<PlanId, string> = {
  genesis: 'Genesis',
  constellation: 'Constellation',
  singularity: 'Singularity',
};

type TierId = PlanId;

function getTierButton(plan: PlanId, tier: TierId): { label: string; disabled: boolean; variant: 'current' | 'upgrade' | 'downgrade' } {
  if (plan === tier) return { label: 'Current Orbit', disabled: true, variant: 'current' };
  if (tier === 'genesis') return { label: 'Downgrade', disabled: false, variant: 'downgrade' };
  if (tier === 'constellation') return { label: 'Upgrade', disabled: false, variant: 'upgrade' };
  return { label: plan === 'constellation' ? 'Upgrade to Ultimate' : 'Upgrade', disabled: false, variant: 'upgrade' };
}

const TIER_GLOW = {
  genesis: '',
  constellation: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.2) 0%, transparent 65%)',
  singularity: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.3) 0%, transparent 65%)',
} as const;

const TIER_TEXT_SHADOW = {
  genesis: '0 0 20px rgba(115,115,115,0.15), 0 1px 2px rgba(0,0,0,0.05)',
  constellation: '0 0 24px rgba(99,102,241,0.2), 0 1px 2px rgba(0,0,0,0.05)',
  singularity: '0 0 28px rgba(245,158,11,0.25), 0 1px 2px rgba(0,0,0,0.05)',
} as const;

export const GENESIS_FEATURES = [
  { icon: Brain, text: 'Up to 60 Neurons' },
  { icon: LayoutGrid, text: '2D Knowledge Graph' },
  { icon: Bookmark, text: 'Browser Web Clipper' },
  { icon: Search, text: 'Standard Search' },
  { icon: Share2, text: 'Share 1 Cluster' },
];

export const CONSTELLATION_FEATURES = [
  { icon: InfinityIcon, text: 'Unlimited Neurons' },
  { icon: Route, text: 'Pathfinder & Zen Mode' },
  { icon: Filter, text: 'Tags & Advanced Filters' },
  { icon: Download, text: 'Data Import/Export' },
  { icon: Share2, text: 'Up to 5 shares' },
  { icon: InfinityIcon, text: 'All Gnesis features' },
];

export const SINGULARITY_FEATURES = [
  { icon: MessageCircle, text: 'Full AI Neural Core (Chat & Search)' },
  { icon: Sparkles, text: 'AI Semantic Search' },
  { icon: Import, text: 'Obsidian/Notion Import' },
  { icon: Box, text: '3D Graph Visualization' },
  { icon: Clock, text: 'Time Machine & Evolution Journal' },
  { icon: Share2, text: 'Unlimited shares' },
  { icon: InfinityIcon, text: 'All Constellation features' },
];

export default function BillingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { plan, isLoading: planLoading } = usePlan(supabase);
  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [neuronsUsed, setNeuronsUsed] = useState<number | null>(null);
  const [sharedCount, setSharedCount] = useState<number | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const neuronsLimit = getNeuronLimit(plan);
  const sharedUniversesLimit = getSharedUniversesLimit(plan);
  const isPaid = plan === 'constellation' || plan === 'singularity';

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserId(user.id);
      setAuthChecking(false);

      const { count: nodesCount } = await supabase.from('nodes').select('*', { count: 'exact', head: true });
      setNeuronsUsed(nodesCount ?? 0);

      const { count: sharesCount } = await supabase.from('shares').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setSharedCount(sharesCount ?? 0);
    };
    checkAuth();
  }, [supabase, router]);

  // Генерація посилання на оплату
  const handleUpgrade = (tier: 'constellation' | 'singularity') => {
    if (!userId) return;
    
    const storeUrl = process.env.NEXT_PUBLIC_LS_STORE_URL;
    
    // ВИКОРИСТОВУЄМО CHECKOUT_ID ЗАМІСТЬ VARIANT_ID
    const checkoutId = tier === 'constellation' 
      ? process.env.NEXT_PUBLIC_CONSTELLATION_CHECKOUT_ID 
      : process.env.NEXT_PUBLIC_SINGULARITY_CHECKOUT_ID;

    // Збираємо посилання
    const checkoutUrl = `${storeUrl}/checkout/buy/${checkoutId}?checkout[custom][user_id]=${userId}`;
    window.location.href = checkoutUrl;
  };

  const handleManageSubscription = async () => {
    try {
      setIsPortalLoading(true);
      
      // Викликаємо наш новий API
      const response = await fetch('/api/billing/portal');
      const data = await response.json();
  
      if (data.url) {
        // Відкриваємо портал у новій вкладці або в тій самій
        window.location.href = data.url;
      } else {
        // Фоллбек на випадок помилки
        window.open('https://app.lemonsqueezy.com/my-orders', '_blank');
      }
    } catch (error) {
      console.error('Failed to redirect to portal', error);
      window.open('https://app.lemonsqueezy.com/my-orders', '_blank');
    } finally {
      setIsPortalLoading(false);
    }
  };

  const used = neuronsUsed ?? 0;
  const ratio = neuronsLimit > 0 && neuronsLimit !== Infinity ? used / neuronsLimit : 0;
  const progressBarColor = ratio >= 0.9 ? 'bg-red-500' : ratio >= 0.75 ? 'bg-amber-500' : 'bg-indigo-500 dark:bg-purple-500';

  if (authChecking || planLoading) {
    return (
      <main className="h-screen bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 dark:text-purple-400" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl shadow-xl relative z-10"
      >
        <div className="p-5 md:p-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white text-center mb-1">Universe Telemetry & Billing</h1>
          <p className="text-neutral-500 text-sm text-center mb-8">Manage your knowledge graph limits and subscription.</p>

          {/* Current Plan & Usage */}
          <div className="bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/50 rounded-2xl p-5 mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1 font-medium">Current Plan</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">{PLAN_LABELS[plan]}</span>
                  {isPaid && <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-semibold uppercase tracking-wider">Active</span>}
                </div>
              </div>
              {isPaid && (
                <button
                  onClick={handleManageSubscription}
                  disabled={isPortalLoading}
                  className="cursor-pointer flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white bg-neutral-200/80 dark:bg-neutral-700/50 hover:bg-neutral-300/80 dark:hover:bg-neutral-600/50 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                >
                  {isPortalLoading ? <Loader2 size={14} className="animate-spin" /> : <>Manage Subscription <ExternalLink size={14} /></>}
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium">Neurons mapped</span>
                  <span className="font-mono text-neutral-700 dark:text-neutral-300 tabular-nums">{neuronsUsed === null ? '—' : used} / {neuronsLimit === Infinity ? '∞' : neuronsLimit}</span>
                </div>
                {neuronsLimit !== Infinity && (
                  <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium">Shared Universes</span>
                <span className="font-mono text-neutral-700 dark:text-neutral-300 tabular-nums">{sharedCount === null ? '—' : sharedCount} / {sharedUniversesLimit === Infinity ? '∞' : sharedUniversesLimit}</span>
              </div>
            </div>
          </div>

          {/* Subscription tiers */}
          <div className="space-y-4 mb-8">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Zap size={16} className="text-amber-500" /> Expand your Universe
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch w-full max-w-5xl mx-auto">
              {/* Genesis — neutral, no glow */}
              <motion.div
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative flex flex-col h-full min-w-0"
              >
                <div
                  className={`rounded-2xl p-5 flex flex-col h-full min-h-0 border relative z-10 ${plan === 'genesis' ? 'bg-neutral-200/80 dark:bg-neutral-800/80 border-neutral-500/10 shadow-[0_0_0_1px_rgba(115,115,115,0.08),inset_0_1px_0_0_rgba(255,255,255,0.03)] dark:shadow-[0_0_0_1px_rgba(115,115,115,0.15),inset_0_0_30px_-10px_rgba(0,0,0,0.2)]' : 'bg-neutral-100 dark:bg-neutral-900/80 border-neutral-500/10'}`}
                >
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-neutral-900 dark:text-white text-lg shrink-0" style={plan === 'genesis' ? { textShadow: TIER_TEXT_SHADOW.genesis } : undefined}>Genesis</p>
                      {plan === 'genesis' && <span className="shrink-0 px-2 py-0.5 rounded-full bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] font-semibold uppercase tracking-wider">Active</span>}
                    </div>
                    <p className="text-2xl font-bold mb-3 tabular-nums">$0<span className="text-sm font-normal text-neutral-500">/Forever</span></p>
                    <ul className="space-y-2 mb-4 flex-1 min-h-0">
                      {GENESIS_FEATURES.map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400">
                          <Icon size={16} className="text-neutral-500 dark:text-neutral-400 shrink-0" />
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {(() => {
                    const btn = getTierButton(plan, 'genesis');
                    const onClick = btn.variant === 'downgrade' ? handleManageSubscription : () => {};
                    const isCurrent = btn.variant === 'current';
                    return (
                      <button onClick={onClick} disabled={btn.disabled} className="cursor-pointer flex items-center justify-center gap-2 w-full min-h-[44px] py-2.5 rounded-xl font-medium text-sm transition-all shrink-0 disabled:cursor-default bg-neutral-300/80 dark:bg-neutral-600/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-400/80 dark:hover:bg-neutral-500/50 disabled:hover:bg-neutral-300/80 dark:disabled:hover:bg-neutral-600/50 disabled:opacity-80 disabled:saturate-75">
                        {isCurrent ? <><Check size={16} className="shrink-0" /> Current Orbit</> : btn.label}
                      </button>
                    );
                  })()}
                </div>
              </motion.div>

              {/* Constellation — matches UpgradeModal styling */}
              <motion.div transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="relative flex flex-col h-full min-w-0">
                <div className="rounded-2xl border border-white/20 dark:border-purple-500/20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl shadow-[0_0_60px_rgba(99,102,241,0.15)] dark:shadow-[0_0_60px_rgba(168,85,247,0.2)] p-5 flex flex-col h-full min-h-0 relative z-10 overflow-hidden">
                  {plan === 'genesis' && <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600 dark:bg-purple-500 text-white text-[10px] font-bold rounded-bl-lg uppercase tracking-wider">Popular</div>}
                  <div className="flex-1 min-h-0 flex flex-col pt-5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-neutral-900 dark:text-white text-lg shrink-0">Constellation</p>
                      {plan === 'constellation' && <span className="shrink-0 px-2 py-0.5 rounded-full bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] font-semibold uppercase tracking-wider">Active</span>}
                    </div>
                    <p className="text-2xl font-bold mb-3 tabular-nums">$3.99<span className="text-sm font-normal text-neutral-500">/mo</span></p>
                    <ul className="space-y-2 mb-4 flex-1 min-h-0">
                      {CONSTELLATION_FEATURES.map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-center gap-2.5 text-sm text-neutral-700 dark:text-neutral-300">
                          <Icon size={16} className="text-indigo-500 dark:text-purple-400 shrink-0" />
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {(() => {
                    const btn = getTierButton(plan, 'constellation');
                    const onClick = btn.variant === 'upgrade' ? () => handleUpgrade('constellation') : () => {};
                    const isCurrent = btn.variant === 'current';
                    return (
                      <button onClick={onClick} disabled={btn.disabled} className="cursor-pointer flex items-center justify-center gap-2 w-full min-h-[44px] py-2.5 rounded-xl font-medium text-sm transition-all shrink-0 disabled:cursor-default text-white bg-indigo-600 dark:bg-purple-500 hover:bg-indigo-700 dark:hover:bg-purple-600 shadow-[0_0_24px_rgba(99,102,241,0.35)] dark:shadow-[0_0_24px_rgba(168,85,247,0.4)] hover:shadow-[0_0_32px_rgba(99,102,241,0.45)] dark:hover:shadow-[0_0_32px_rgba(168,85,247,0.5)] disabled:opacity-80 disabled:saturate-75 disabled:bg-indigo-600/70 dark:disabled:bg-purple-500/70 disabled:shadow-none">
                        {isCurrent ? <><Check size={16} className="shrink-0" /> Current Orbit</> : btn.label}
                      </button>
                    );
                  })()}
                </div>
              </motion.div>

              {/* Singularity — matches UpgradeModal styling */}
              <motion.div transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="relative flex flex-col h-full min-w-0">
                <div className="rounded-2xl border border-amber-500/30 dark:border-amber-400/20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl shadow-[0_0_60px_rgba(99,102,241,0.22)] dark:shadow-[0_0_80px_rgba(168,85,247,0.3),0_0_40px_rgba(251,191,36,0.15)] p-5 flex flex-col h-full min-h-0 relative z-10 overflow-hidden">
                  <div className="absolute top-0 right-0 z-10">
                    <span className="inline-flex px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 text-white text-[10px] font-bold rounded-bl-lg uppercase tracking-widest shadow-[0_0_24px_rgba(99,102,241,0.22)] dark:shadow-[0_0_24px_rgba(168,85,247,0.3),0_0_16px_rgba(251,191,36,0.15)]">Ultimate AI Fusion</span>
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col pt-7">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-neutral-900 dark:text-white text-lg shrink-0">Singularity</p>
                      {plan === 'singularity' && <span className="shrink-0 px-2 py-0.5 rounded-full bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] font-semibold uppercase tracking-wider">Active</span>}
                    </div>
                    <p className="text-2xl font-bold mb-3 tabular-nums">$7.99<span className="text-sm font-normal text-neutral-500">/mo</span></p>
                    <ul className="space-y-2 mb-4 flex-1 min-h-0">
                      {SINGULARITY_FEATURES.map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-center gap-2.5 text-sm text-neutral-700 dark:text-neutral-300">
                          <Icon size={16} className="text-amber-500 dark:text-amber-400 shrink-0" />
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {(() => {
                    const btn = getTierButton(plan, 'singularity');
                    const onClick = btn.variant === 'upgrade' ? () => handleUpgrade('singularity') : () => {};
                    const isCurrent = btn.variant === 'current';
                    return (
                      <button onClick={onClick} disabled={btn.disabled} className="cursor-pointer flex items-center justify-center gap-2 w-full min-h-[44px] py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 disabled:cursor-default text-white bg-gradient-to-r from-indigo-600 dark:from-purple-600 to-amber-600 hover:from-indigo-500 dark:hover:from-purple-500 hover:to-amber-500 shadow-[0_0_28px_rgba(99,102,241,0.35),0_0_16px_rgba(251,191,36,0.2)] dark:shadow-[0_0_28px_rgba(168,85,247,0.45),0_0_16px_rgba(251,191,36,0.2)] hover:shadow-[0_0_36px_rgba(99,102,241,0.45),0_0_20px_rgba(251,191,36,0.25)] dark:hover:shadow-[0_0_36px_rgba(168,85,247,0.5),0_0_20px_rgba(251,191,36,0.25)] disabled:opacity-80 disabled:saturate-75 disabled:from-indigo-600 dark:disabled:from-purple-600 disabled:to-amber-600">
                        {isCurrent ? <><Check size={16} className="shrink-0" /> Current Orbit</> : btn.label}
                      </button>
                    );
                  })()}
                </div>
              </motion.div>
            </div>
          </div>

          <div className="flex justify-center">
            <Link href="/" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
              <ArrowLeft size={16} /> Back to dashboard
            </Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
}