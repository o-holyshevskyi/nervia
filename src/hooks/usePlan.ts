/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';

export type PlanId = 'explorer' | 'builder' | 'architect';

export const NEURONS_LIMIT_GENESIS = 60;
export const SHARED_CLUSTERS_LIMIT_GENESIS = 1;

const NEURONS_LIMIT_BY_PLAN: Record<PlanId, number> = {
  explorer: 60,
  builder: Infinity,
  architect: Infinity,
};

/** Returns current plan. Replace with API/profile lookup later. */
export function usePlan(supabase: any): { plan: PlanId; isLoading: boolean } {
  const [plan, setPlan] = useState<PlanId>('explorer');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        // TODO: read plan from user.user_metadata.plan or profiles table
        const planFromMeta = user?.user_metadata?.plan as PlanId | undefined;
        if (planFromMeta && ['explorer', 'builder', 'architect'].includes(planFromMeta)) {
          setPlan(planFromMeta);
        }
      } catch {
        // keep default explorer
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [supabase]);

  return { plan, isLoading };
}

export function getNeuronLimit(plan: PlanId): number {
  return NEURONS_LIMIT_BY_PLAN[plan];
}

export function isUnlimitedPlan(plan: PlanId): boolean {
  return plan === 'builder' || plan === 'architect';
}

/** Singularity = unlimited share links; Constellation = 5; Genesis = 1. */
export const SHARED_UNIVERSES_LIMIT_BY_PLAN: Record<PlanId, number> = {
  explorer: 1,
  builder: 5,
  architect: Infinity,
};

export function getSharedUniversesLimit(plan: PlanId): number {
  return SHARED_UNIVERSES_LIMIT_BY_PLAN[plan];
}
