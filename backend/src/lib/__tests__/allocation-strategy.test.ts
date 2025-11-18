import { describe, it, expect } from 'vitest';
import {
  CompositeStrategy,
  RevenueFocusedStrategy,
  EfficiencyFocusedStrategy,
  AllocationStrategyRegistry,
} from '../adapters/allocation-strategy';
import { ExperimentKPIs } from '../../types';

const mockKPIs: ExperimentKPIs[] = [
  {
    experimentId: '1',
    experimentName: 'High Revenue',
    channel: 'Google Ads',
    status: 'active',
    totalSpend: 10000,
    totalImpressions: 500000,
    totalClicks: 25000,
    totalConversions: 1000,
    totalRevenue: 50000,
    ctr: 5.0,
    cac: 10.0,
    conversionRate: 4.0,
    roas: 5.0,
    revenuePerSpend: 5.0,
  },
  {
    experimentId: '2',
    experimentName: 'Low CAC',
    channel: 'Email',
    status: 'active',
    totalSpend: 2000,
    totalImpressions: 50000,
    totalClicks: 5000,
    totalConversions: 500,
    totalRevenue: 8000,
    ctr: 10.0,
    cac: 4.0,
    conversionRate: 10.0,
    roas: 4.0,
    revenuePerSpend: 4.0,
  },
];

describe('Allocation Strategies', () => {
  describe('CompositeStrategy', () => {
    it('should calculate allocations based on composite score', () => {
      const strategy = new CompositeStrategy();
      const suggestions = strategy.calculate(mockKPIs, {});

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].suggestedPercentage + suggestions[1].suggestedPercentage).toBeCloseTo(
        100,
        1
      );
    });
  });

  describe('RevenueFocusedStrategy', () => {
    it('should prioritize higher revenue experiments', () => {
      const strategy = new RevenueFocusedStrategy();
      const suggestions = strategy.calculate(mockKPIs, {});

      expect(suggestions).toHaveLength(2);

      const highRevenue = suggestions.find((s) => s.experimentId === '1');
      const lowRevenue = suggestions.find((s) => s.experimentId === '2');

      expect(highRevenue!.suggestedPercentage).toBeGreaterThan(
        lowRevenue!.suggestedPercentage
      );
    });

    it('should respect min/max constraints', () => {
      const strategy = new RevenueFocusedStrategy();
      const suggestions = strategy.calculate(mockKPIs, {
        minAllocationPercent: 20,
        maxAllocationPercent: 60,
      });

      suggestions.forEach((sug) => {
        expect(sug.suggestedPercentage).toBeGreaterThanOrEqual(20);
        expect(sug.suggestedPercentage).toBeLessThanOrEqual(60);
      });
    });
  });

  describe('EfficiencyFocusedStrategy', () => {
    it('should prioritize low CAC experiments', () => {
      const strategy = new EfficiencyFocusedStrategy();
      const suggestions = strategy.calculate(mockKPIs, {});

      expect(suggestions).toHaveLength(2);

      const lowCAC = suggestions.find((s) => s.experimentId === '2'); // CAC: 4
      const highCAC = suggestions.find((s) => s.experimentId === '1'); // CAC: 10

      expect(lowCAC!.suggestedPercentage).toBeGreaterThan(highCAC!.suggestedPercentage);
    });
  });

  describe('AllocationStrategyRegistry', () => {
    it('should register default strategies', () => {
      const registry = new AllocationStrategyRegistry();

      expect(registry.has('composite')).toBe(true);
      expect(registry.has('revenue-focused')).toBe(true);
      expect(registry.has('efficiency-focused')).toBe(true);
    });

    it('should retrieve registered strategies', () => {
      const registry = new AllocationStrategyRegistry();

      const composite = registry.get('composite');
      expect(composite).toBeDefined();
      expect(composite!.name).toBe('composite');
    });

    it('should allow registering custom strategies', () => {
      const registry = new AllocationStrategyRegistry();

      const customStrategy = {
        name: 'custom',
        calculate: () => [],
      };

      registry.register(customStrategy);

      expect(registry.has('custom')).toBe(true);
      expect(registry.get('custom')).toBe(customStrategy);
    });

    it('should list all strategies', () => {
      const registry = new AllocationStrategyRegistry();
      const all = registry.getAll();

      expect(all.length).toBeGreaterThanOrEqual(3);
      expect(all.map((s) => s.name)).toContain('composite');
    });
  });
});
