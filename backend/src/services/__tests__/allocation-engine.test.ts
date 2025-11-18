import { describe, it, expect } from 'vitest';
import { calculateAllocationSuggestions } from '../allocation-engine';
import { ExperimentKPIs } from '../../types';

describe('Allocation Engine', () => {
  const mockKPIs: ExperimentKPIs[] = [
    {
      experimentId: '1',
      experimentName: 'High Performer',
      channel: 'Email',
      status: 'active',
      totalSpend: 1000,
      totalImpressions: 50000,
      totalClicks: 2500,
      totalConversions: 250,
      totalRevenue: 5000,
      ctr: 5.0,
      cac: 4.0,
      conversionRate: 10.0,
      roas: 5.0,
      revenuePerSpend: 5.0,
    },
    {
      experimentId: '2',
      experimentName: 'Medium Performer',
      channel: 'Google Ads',
      status: 'active',
      totalSpend: 2000,
      totalImpressions: 100000,
      totalClicks: 2000,
      totalConversions: 100,
      totalRevenue: 4000,
      ctr: 2.0,
      cac: 20.0,
      conversionRate: 5.0,
      roas: 2.0,
      revenuePerSpend: 2.0,
    },
    {
      experimentId: '3',
      experimentName: 'Low Performer',
      channel: 'Facebook',
      status: 'active',
      totalSpend: 1500,
      totalImpressions: 80000,
      totalClicks: 800,
      totalConversions: 16,
      totalRevenue: 800,
      ctr: 1.0,
      cac: 93.75,
      conversionRate: 2.0,
      roas: 0.53,
      revenuePerSpend: 0.53,
    },
  ];

  describe('calculateAllocationSuggestions', () => {
    it('should allocate more budget to higher performing experiments', () => {
      const suggestions = calculateAllocationSuggestions(mockKPIs);

      expect(suggestions).toHaveLength(3);

      // High performer should get highest percentage
      const highPerformer = suggestions.find((s) => s.experimentId === '1');
      const mediumPerformer = suggestions.find((s) => s.experimentId === '2');
      const lowPerformer = suggestions.find((s) => s.experimentId === '3');

      expect(highPerformer!.suggestedPercentage).toBeGreaterThan(
        mediumPerformer!.suggestedPercentage
      );
      expect(mediumPerformer!.suggestedPercentage).toBeGreaterThan(
        lowPerformer!.suggestedPercentage
      );
    });

    it('should ensure all percentages sum to 100', () => {
      const suggestions = calculateAllocationSuggestions(mockKPIs);

      const total = suggestions.reduce((sum, s) => sum + s.suggestedPercentage, 0);

      expect(total).toBeCloseTo(100, 1); // Within 0.1% due to rounding
    });

    it('should respect minimum allocation constraint', () => {
      const suggestions = calculateAllocationSuggestions(mockKPIs, {
        minAllocationPercent: 10,
      });

      suggestions.forEach((suggestion) => {
        expect(suggestion.suggestedPercentage).toBeGreaterThanOrEqual(10);
      });
    });

    it('should respect maximum allocation constraint', () => {
      const suggestions = calculateAllocationSuggestions(mockKPIs, {
        maxAllocationPercent: 40,
      });

      suggestions.forEach((suggestion) => {
        expect(suggestion.suggestedPercentage).toBeLessThanOrEqual(40);
      });
    });

    it('should calculate suggested budget when total budget is provided', () => {
      const totalBudget = 10000;
      const suggestions = calculateAllocationSuggestions(mockKPIs, { totalBudget });

      suggestions.forEach((suggestion) => {
        expect(suggestion.suggestedBudget).toBeDefined();
        expect(suggestion.suggestedBudget).toBeGreaterThan(0);
      });

      const totalSuggested = suggestions.reduce(
        (sum, s) => sum + (s.suggestedBudget || 0),
        0
      );

      expect(totalSuggested).toBeCloseTo(totalBudget, 1);
    });

    it('should handle experiments with zero conversions', () => {
      const kpisWithZeroConversions: ExperimentKPIs[] = [
        ...mockKPIs,
        {
          experimentId: '4',
          experimentName: 'No Conversions',
          channel: 'LinkedIn',
          status: 'active',
          totalSpend: 1000,
          totalImpressions: 10000,
          totalClicks: 500,
          totalConversions: 0,
          totalRevenue: 0,
          ctr: 5.0,
          cac: 0,
          conversionRate: 0,
          roas: 0,
          revenuePerSpend: 0,
        },
      ];

      const suggestions = calculateAllocationSuggestions(kpisWithZeroConversions);

      expect(suggestions).toHaveLength(4);
      expect(suggestions.find((s) => s.experimentId === '4')).toBeDefined();
    });

    it('should only include active experiments with spend', () => {
      const kpisWithPaused: ExperimentKPIs[] = [
        ...mockKPIs,
        {
          experimentId: '4',
          experimentName: 'Paused',
          channel: 'LinkedIn',
          status: 'paused',
          totalSpend: 1000,
          totalImpressions: 10000,
          totalClicks: 500,
          totalConversions: 50,
          totalRevenue: 1000,
          ctr: 5.0,
          cac: 20.0,
          conversionRate: 10.0,
          roas: 1.0,
          revenuePerSpend: 1.0,
        },
      ];

      const suggestions = calculateAllocationSuggestions(kpisWithPaused);

      expect(suggestions).toHaveLength(3);
      expect(suggestions.find((s) => s.experimentId === '4')).toBeUndefined();
    });

    it('should distribute evenly when all scores are zero', () => {
      const zeroScoreKPIs: ExperimentKPIs[] = [
        {
          experimentId: '1',
          experimentName: 'Zero 1',
          channel: 'Test',
          status: 'active',
          totalSpend: 100,
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          ctr: 0,
          cac: 0,
          conversionRate: 0,
          roas: 0,
          revenuePerSpend: 0,
        },
        {
          experimentId: '2',
          experimentName: 'Zero 2',
          channel: 'Test',
          status: 'active',
          totalSpend: 100,
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          ctr: 0,
          cac: 0,
          conversionRate: 0,
          roas: 0,
          revenuePerSpend: 0,
        },
      ];

      const suggestions = calculateAllocationSuggestions(zeroScoreKPIs);

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].suggestedPercentage).toBeCloseTo(50, 1);
      expect(suggestions[1].suggestedPercentage).toBeCloseTo(50, 1);
    });

    it('should return empty array when no active experiments with spend', () => {
      const noActiveKPIs: ExperimentKPIs[] = [
        {
          experimentId: '1',
          experimentName: 'Paused',
          channel: 'Test',
          status: 'paused',
          totalSpend: 100,
          totalImpressions: 1000,
          totalClicks: 50,
          totalConversions: 5,
          totalRevenue: 200,
          ctr: 5.0,
          cac: 20.0,
          conversionRate: 10.0,
          roas: 2.0,
          revenuePerSpend: 2.0,
        },
      ];

      const suggestions = calculateAllocationSuggestions(noActiveKPIs);

      expect(suggestions).toHaveLength(0);
    });
  });
});
