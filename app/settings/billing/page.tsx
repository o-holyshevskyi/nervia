'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Zap, Loader2 } from 'lucide-react';
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
      setAuthChecking(false);

      // Fetch real usage from DB (nodes count + shares count)
      const { count: nodesCount, error: nodesError } = await supabase
        .from('nodes')
        .select('*', { count: 'exact', head: true });

      if (nodesError) {
        console.error('Billing: nodes count error', nodesError);
      } else {
        setNeuronsUsed(nodesCount ?? 0);
      }

      const { count: sharesCount, error: sharesError } = await supabase
        .from('shares')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (sharesError) {
        console.error('Billing: shares count error', sharesError);
      } else {
        setSharedCount(sharesCount ?? 0);
      }
    };
    checkAuth();
  }, [supabase, router]);

  // Stub: wire Stripe/LemonSqueezy later
  const handleUpgrade = (_tier: 'constellation' | 'singularity') => {};

  // Stub: link to Stripe/LemonSqueezy customer portal later
  const handleManageSubscription = () => {};

  const used = neuronsUsed ?? 0;
  const ratio = neuronsLimit > 0 && neuronsLimit !== Infinity ? used / neuronsLimit : 0;
  const progressBarColor =
    ratio >= 0.9
      ? 'bg-red-500'
      : ratio >= 0.75
        ? 'bg-amber-500'
        : 'bg-indigo-500 dark:bg-purple-500';

  if (authChecking || planLoading) {
    return (
      <main className="h-screen bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 dark:text-purple-400" />
      </main>
    );
  }

  return (
    <main className="h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-2xl max-h-full bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="p-4 md:p-5">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-indigo-500/20 dark:bg-purple-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30 dark:border-purple-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)] dark:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <CreditCard className="text-indigo-600 dark:text-purple-400" size={24} />
            </div>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white text-center mb-1 tracking-tight">
            Universe Telemetry & Billing
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm text-center mb-5">
            Your plan, usage, and upgrade options.
          </p>

          {/* Current usage */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 dark:bg-purple-500/20 border border-indigo-500/30 dark:border-purple-500/30 text-indigo-600 dark:text-purple-400 text-sm font-bold">
                1
              </span>
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">Current usage</span>
            </div>
            <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 space-y-3">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-0.5">Current Plan</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">{PLAN_LABELS[plan]}</p>
                {plan === 'genesis' && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Up to 60 Neurons · 2D Graph · Standard Search · Share 1 Universe</p>
                )}
              </div>
              <div className="h-px bg-black/10 dark:bg-white/10" />
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-neutral-500 dark:text-neutral-500">Neurons mapped</span>
                  <span className="font-mono text-neutral-900 dark:text-white/90">
                    {neuronsUsed === null ? '…' : used} / {neuronsLimit === Infinity ? '∞' : neuronsLimit}
                  </span>
                </div>
                {neuronsLimit !== Infinity && (
                  <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${progressBarColor}`}
                      style={{ width: `${Math.min(100, ratio * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="h-px bg-black/10 dark:bg-white/10" />
              <div className="flex justify-between text-sm mb-2">
                <span className="text-neutral-500 dark:text-neutral-500">Shares</span>
                <span className="font-mono text-neutral-900 dark:text-white/90">
                  {sharedCount === null ? '…' : sharedCount} / {sharedUniversesLimit === Infinity ? '∞' : sharedUniversesLimit}
                </span>
              </div>
            </div>
          </div>

          {/* Paid: Manage Subscription */}
          {isPaid && (
            <div className="space-y-2 mb-5">
                <button
                    type="button"
                    onClick={handleManageSubscription}
                    className="hover:cursor-pointer flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 text-neutral-800 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 font-medium transition-all"
              >
                <CreditCard size={20} />
                Manage Subscription
              </button>
            </div>
          )}

          {/* Upgrade options (hidden when already paid) */}
          {!isPaid && (
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 dark:bg-purple-500/20 border border-indigo-500/30 dark:border-purple-500/30 text-indigo-600 dark:text-purple-400 text-sm font-bold">
                  2
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">Upgrade options</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Constellation — $3.99/mo */}
                <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 dark:bg-purple-500/20 border border-indigo-500/30 dark:border-purple-500/30 flex items-center justify-center shrink-0">
                      <Zap size={20} className="text-indigo-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">Constellation</p>
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">$3.99<span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">/month</span></p>
                    </div>
                  </div>
                  <ul className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                    <li>Unlimited Neurons</li>
                    <li>Pathfinder & Zen Mode</li>
                    <li>Tags & Advanced Filters</li>
                    <li>Data Import/Export</li>
                    <li>Up to 5 shares</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => handleUpgrade('constellation')}
                    className="hover:cursor-pointer flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-500/20 dark:bg-purple-500/20 border border-indigo-500/40 dark:border-purple-500/40 text-indigo-700 dark:text-purple-300 hover:bg-indigo-500/30 dark:hover:bg-purple-500/30 font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.15)] dark:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                  >
                    Join Constellation
                  </button>
                </div>

                {/* Singularity — $7.99/mo */}
                <div className="bg-black/5 dark:bg-white/5 border-2 border-amber-500/40 dark:border-amber-400/40 rounded-2xl p-4 space-y-3 shadow-[0_0_30px_rgba(245,158,11,0.15)] dark:shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Zap size={20} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">Singularity</p>
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">$7.99<span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">/month</span></p>
                    </div>
                  </div>
                  <ul className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                    <li>Ultimate AI Fusion</li>
                    <li>Full AI Neural Core (Chat & Search)</li>
                    <li>AI Semantic Search</li>
                    <li>3D Graph Visualization</li>
                    <li>Time Machine & Evolution Journal</li>
                    <li>Unlimited shares</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => handleUpgrade('singularity')}
                    className="hover:cursor-pointer flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500/20 dark:bg-amber-500/20 border border-amber-500/40 dark:border-amber-400/40 text-amber-800 dark:text-amber-200 hover:bg-amber-500/30 dark:hover:bg-amber-500/30 font-medium transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  >
                    Get Singularity
                  </button>
                </div>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="hover:cursor-pointer flex items-center justify-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
