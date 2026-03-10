/**
 * @jest-environment jsdom
 *
 * Tests for the useFeatureAccess hook logic.
 *
 * useFeatureAccess is a pure memoized computation, so we test the returned
 * FeatureAccess object directly without needing to render a React component.
 * We call the hook inside renderHook (from @testing-library/react) to stay
 * true to React's rules-of-hooks contract.
 */
import { renderHook } from '@testing-library/react';
import { useFeatureAccess } from '../src/hooks/useFeatureAccess';
import type { PlanId } from '../src/hooks/usePlan';

function accessFor(plan: PlanId) {
  const { result } = renderHook(() => useFeatureAccess(plan));
  return result.current;
}

// ──────────────────────────────────────────────
// Genesis (free tier)
// ──────────────────────────────────────────────
describe('useFeatureAccess – genesis', () => {
  const access = accessFor('genesis');

  test('plan field equals "genesis"', () => {
    expect(access.plan).toBe('genesis');
  });

  test('neuronLimit is 60', () => {
    expect(access.neuronLimit).toBe(60);
  });

  test('isUnlimited is false', () => {
    expect(access.isUnlimited).toBe(false);
  });

  test('canAddNeuron returns true below limit', () => {
    expect(access.canAddNeuron(0)).toBe(true);
    expect(access.canAddNeuron(59)).toBe(true);
  });

  test('canAddNeuron returns false at or above limit', () => {
    expect(access.canAddNeuron(60)).toBe(false);
    expect(access.canAddNeuron(100)).toBe(false);
  });

  test('premium features are disabled', () => {
    expect(access.canUsePathfinder).toBe(false);
    expect(access.canUseZenMode).toBe(false);
    expect(access.canUseFilters).toBe(false);
    expect(access.canUseImportExport).toBe(false);
  });

  test('singularity-only features are disabled', () => {
    expect(access.canUseNeuralCore).toBe(false);
    expect(access.canUseAISearch).toBe(false);
    expect(access.canUse3DGraph).toBe(false);
    expect(access.canUseTimeMachine).toBe(false);
    expect(access.canUseEvolutionJournal).toBe(false);
    expect(access.canUseUnlimitedSharedUniverses).toBe(false);
  });

  test('sharedUniversesLimit is 1', () => {
    expect(access.sharedUniversesLimit).toBe(1);
  });

  test('canCreateShare respects the 1-share limit', () => {
    expect(access.canCreateShare(0)).toBe(true);
    expect(access.canCreateShare(1)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// Constellation (mid tier)
// ──────────────────────────────────────────────
describe('useFeatureAccess – constellation', () => {
  const access = accessFor('constellation');

  test('plan field equals "constellation"', () => {
    expect(access.plan).toBe('constellation');
  });

  test('isUnlimited is true', () => {
    expect(access.isUnlimited).toBe(true);
  });

  test('canAddNeuron is always true (unlimited neurons)', () => {
    expect(access.canAddNeuron(0)).toBe(true);
    expect(access.canAddNeuron(10_000)).toBe(true);
  });

  test('premium features are enabled', () => {
    expect(access.canUsePathfinder).toBe(true);
    expect(access.canUseZenMode).toBe(true);
    expect(access.canUseFilters).toBe(true);
    expect(access.canUseImportExport).toBe(true);
  });

  test('singularity-only features remain disabled', () => {
    expect(access.canUseNeuralCore).toBe(false);
    expect(access.canUseAISearch).toBe(false);
    expect(access.canUse3DGraph).toBe(false);
    expect(access.canUseTimeMachine).toBe(false);
    expect(access.canUseEvolutionJournal).toBe(false);
    expect(access.canUseUnlimitedSharedUniverses).toBe(false);
  });

  test('sharedUniversesLimit is 5', () => {
    expect(access.sharedUniversesLimit).toBe(5);
  });

  test('canCreateShare respects the 5-share limit', () => {
    expect(access.canCreateShare(4)).toBe(true);
    expect(access.canCreateShare(5)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// Singularity (top tier)
// ──────────────────────────────────────────────
describe('useFeatureAccess – singularity', () => {
  const access = accessFor('singularity');

  test('plan field equals "singularity"', () => {
    expect(access.plan).toBe('singularity');
  });

  test('isUnlimited is true', () => {
    expect(access.isUnlimited).toBe(true);
  });

  test('all singularity-only features are enabled', () => {
    expect(access.canUseNeuralCore).toBe(true);
    expect(access.canUseAISearch).toBe(true);
    expect(access.canUse3DGraph).toBe(true);
    expect(access.canUseTimeMachine).toBe(true);
    expect(access.canUseEvolutionJournal).toBe(true);
    expect(access.canUseUnlimitedSharedUniverses).toBe(true);
  });

  test('canCreateShare is always true (unlimited shares)', () => {
    expect(access.canCreateShare(0)).toBe(true);
    expect(access.canCreateShare(10_000)).toBe(true);
  });
});
