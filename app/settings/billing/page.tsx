'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Zap, Loader2, ExternalLink } from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';
import { usePlan, getNeuronLimit, getSharedUniversesLimit, type PlanId } from '@/src/hooks/usePlan';

const PLAN_LABELS: Record<PlanId, string> = {
  genesis: 'Genesis',
  constellation: 'Constellation',
  singularity: 'Singularity',
};

export default function BillingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { plan, isLoading: planLoading } = usePlan(supabase);
  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [neuronsUsed, setNeuronsUsed] = useState<number | null>(null);
  const [sharedCount, setSharedCount] = useState<number | null>(null);

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

  const handleManageSubscription = () => {
    // В ідеалі тут має бути запит на твій API, який генерує Customer Portal URL через LS API.
    // Але для початку можна просто дати лінк на загальний портал або твій магазин
    window.open(`https://app.lemonsqueezy.com/my-orders`, '_blank');
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
        className="w-full max-w-2xl bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl shadow-xl relative z-10"
      >
        <div className="p-5 md:p-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white text-center mb-1">Universe Telemetry & Billing</h1>
          <p className="text-neutral-500 text-sm text-center mb-8">Manage your knowledge graph limits and subscription.</p>

          {/* 1. Поточний план та ліміти */}
          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-5 mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Current Plan</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">{PLAN_LABELS[plan]}</span>
                  {isPaid && <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold">Active</span>}
                </div>
              </div>
              {isPaid && (
                <button onClick={handleManageSubscription} className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-4 py-2 rounded-xl transition-all">
                  Manage Plan <ExternalLink size={14} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-neutral-500">Neurons mapped</span>
                  <span className="font-mono">{neuronsUsed === null ? '…' : used} / {neuronsLimit === Infinity ? '∞' : neuronsLimit}</span>
                </div>
                {neuronsLimit !== Infinity && (
                  <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${progressBarColor}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                  </div>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Shared Universes</span>
                <span className="font-mono">{sharedCount === null ? '…' : sharedCount} / {sharedUniversesLimit === Infinity ? '∞' : sharedUniversesLimit}</span>
              </div>
            </div>
          </div>

          {/* 2. Доступні апгрейди */}
          {plan !== 'singularity' && (
            <div className="space-y-4 mb-8">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Zap size={16} className="text-amber-500" /> Expand your Universe
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Показуємо Constellation тільки якщо юзер на Genesis */}
                {plan === 'genesis' && (
                  <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-white text-lg">Constellation</p>
                      <p className="text-2xl font-bold mb-4">$3.99<span className="text-sm font-normal text-neutral-500">/mo</span></p>
                      <ul className="text-sm text-neutral-500 dark:text-neutral-400 space-y-2 mb-6 list-disc pl-4">
                        <li>Unlimited Neurons</li>
                        <li>Pathfinder & Zen Mode</li>
                        <li>Up to 5 shared clusters</li>
                      </ul>
                    </div>
                    <button onClick={() => handleUpgrade('constellation')} className="w-full py-2.5 rounded-xl bg-indigo-500/20 text-indigo-700 dark:text-purple-300 hover:bg-indigo-500/30 font-medium transition-all">
                      Upgrade
                    </button>
                  </div>
                )}

                {/* Singularity доступний для Genesis та Constellation */}
                <div className="bg-gradient-to-br from-amber-500/10 to-purple-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-bl-lg uppercase tracking-wider">Ultimate</div>
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-white text-lg">Singularity</p>
                    <p className="text-2xl font-bold mb-4">$7.99<span className="text-sm font-normal text-neutral-500">/mo</span></p>
                    <ul className="text-sm text-neutral-500 dark:text-neutral-400 space-y-2 mb-6 list-disc pl-4">
                      <li className="font-medium text-amber-600 dark:text-amber-400">Full 3D Universe Mode</li>
                      <li>AI Semantic Search & Chat</li>
                      <li>Unlimited shares</li>
                      <li>Everything in Constellation</li>
                    </ul>
                  </div>
                  <button onClick={() => handleUpgrade('singularity')} className="w-full py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 font-bold shadow-lg transition-all">
                    Unlock Singularity
                  </button>
                </div>
              </div>
            </div>
          )}

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