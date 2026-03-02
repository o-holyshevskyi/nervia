import { useMemo } from 'react';
import type { PlanId } from './usePlan';
import { getNeuronLimit, getSharedUniversesLimit, isUnlimitedPlan } from './usePlan';

export interface FeatureAccess {
  plan: PlanId;
  neuronLimit: number;
  isUnlimited: boolean;
  sharedUniversesLimit: number;
  canAddNeuron: (currentCount: number) => boolean;
  canUsePathfinder: boolean;
  canUseZenMode: boolean;
  canUseFilters: boolean;
  canUseImportExport: boolean;
  /** Can create another share (universe or cluster — same limit). */
  canCreateShare: (currentShareCount: number) => boolean;
  /** Singularity only: Full AI Neural Core (Chat & Search) */
  canUseNeuralCore: boolean;
  /** Singularity only: AI Semantic Search */
  canUseAISearch: boolean;
  /** Singularity only: 3D Graph Visualization */
  canUse3DGraph: boolean;
  /** Singularity only: Time Machine & Evolution Journal */
  canUseTimeMachine: boolean;
  canUseEvolutionJournal: boolean;
  /** True only for Singularity (unlimited share links). Constellation/Genesis use sharedUniversesLimit. */
  canUseUnlimitedSharedUniverses: boolean;
}

export function useFeatureAccess(plan: PlanId): FeatureAccess {
  return useMemo(() => {
    const neuronLimit = getNeuronLimit(plan);
    const isUnlimited = isUnlimitedPlan(plan);
    const sharedUniversesLimit = getSharedUniversesLimit(plan);
    const isSingularity = plan === 'singularity';

    return {
      plan,
      neuronLimit,
      isUnlimited,
      sharedUniversesLimit,
      canAddNeuron: (currentCount: number) => currentCount < neuronLimit,
      canUsePathfinder: isUnlimited,
      canUseZenMode: isUnlimited,
      canUseFilters: isUnlimited,
      canUseImportExport: isUnlimited,
      canCreateShare: (currentShareCount: number) => currentShareCount < sharedUniversesLimit,
      canUseNeuralCore: isSingularity,
      canUseAISearch: isSingularity,
      canUse3DGraph: isSingularity,
      canUseTimeMachine: isSingularity,
      canUseEvolutionJournal: isSingularity,
      canUseUnlimitedSharedUniverses: isSingularity,
    };
  }, [plan]);
}
