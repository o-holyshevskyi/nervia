import {
  getNeuronLimit,
  isUnlimitedPlan,
  getSharedUniversesLimit,
  NEURONS_LIMIT_GENESIS,
  SHARED_CLUSTERS_LIMIT_GENESIS,
  SHARED_UNIVERSES_LIMIT_BY_PLAN,
  type PlanId,
} from '../src/hooks/usePlan';

describe('getNeuronLimit', () => {
  test('genesis plan has the defined genesis neuron limit', () => {
    expect(getNeuronLimit('genesis')).toBe(NEURONS_LIMIT_GENESIS);
    expect(getNeuronLimit('genesis')).toBe(60);
  });

  test('constellation plan has unlimited neurons (Infinity)', () => {
    expect(getNeuronLimit('constellation')).toBe(Infinity);
  });

  test('singularity plan has unlimited neurons (Infinity)', () => {
    expect(getNeuronLimit('singularity')).toBe(Infinity);
  });
});

describe('isUnlimitedPlan', () => {
  test('genesis is NOT unlimited', () => {
    expect(isUnlimitedPlan('genesis')).toBe(false);
  });

  test('constellation IS unlimited', () => {
    expect(isUnlimitedPlan('constellation')).toBe(true);
  });

  test('singularity IS unlimited', () => {
    expect(isUnlimitedPlan('singularity')).toBe(true);
  });
});

describe('getSharedUniversesLimit', () => {
  test('genesis gets 1 shared universe', () => {
    expect(getSharedUniversesLimit('genesis')).toBe(1);
    expect(getSharedUniversesLimit('genesis')).toBe(SHARED_CLUSTERS_LIMIT_GENESIS);
  });

  test('constellation gets 5 shared universes', () => {
    expect(getSharedUniversesLimit('constellation')).toBe(5);
  });

  test('singularity gets unlimited shared universes (Infinity)', () => {
    expect(getSharedUniversesLimit('singularity')).toBe(Infinity);
  });

  test('SHARED_UNIVERSES_LIMIT_BY_PLAN constant matches getSharedUniversesLimit for all plans', () => {
    const plans: PlanId[] = ['genesis', 'constellation', 'singularity'];
    for (const plan of plans) {
      expect(getSharedUniversesLimit(plan)).toBe(SHARED_UNIVERSES_LIMIT_BY_PLAN[plan]);
    }
  });
});

describe('Plan tier ordering', () => {
  test('singularity >= constellation >= genesis in neuron limits', () => {
    expect(getNeuronLimit('singularity')).toBeGreaterThanOrEqual(getNeuronLimit('constellation'));
    expect(getNeuronLimit('constellation')).toBeGreaterThanOrEqual(getNeuronLimit('genesis'));
  });

  test('singularity >= constellation >= genesis in shared universe limits', () => {
    expect(getSharedUniversesLimit('singularity')).toBeGreaterThanOrEqual(getSharedUniversesLimit('constellation'));
    expect(getSharedUniversesLimit('constellation')).toBeGreaterThanOrEqual(getSharedUniversesLimit('genesis'));
  });
});
