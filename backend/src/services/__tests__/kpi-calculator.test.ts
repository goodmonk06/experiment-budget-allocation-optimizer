import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { calculateAllExperimentKPIs, calculateExperimentKPIs } from '../kpi-calculator';
import { prisma } from '../../db';

describe('KPI Calculator', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.experimentMetricSnapshot.deleteMany();
    await prisma.experiment.deleteMany();
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.experimentMetricSnapshot.deleteMany();
    await prisma.experiment.deleteMany();
  });

  describe('calculateExperimentKPIs', () => {
    it('should calculate correct KPIs for an experiment', async () => {
      // Create test experiment
      const experiment = await prisma.experiment.create({
        data: {
          name: 'Test Campaign',
          channel: 'Email',
          status: 'active',
        },
      });

      // Create metrics
      await prisma.experimentMetricSnapshot.createMany({
        data: [
          {
            experimentId: experiment.id,
            date: new Date('2024-01-01'),
            spend: 1000,
            impressions: 50000,
            clicks: 2500,
            conversions: 250,
            revenue: 5000,
          },
          {
            experimentId: experiment.id,
            date: new Date('2024-01-02'),
            spend: 1000,
            impressions: 50000,
            clicks: 2500,
            conversions: 250,
            revenue: 5000,
          },
        ],
      });

      const kpis = await calculateExperimentKPIs(experiment.id);

      expect(kpis).toBeDefined();
      expect(kpis!.experimentId).toBe(experiment.id);
      expect(kpis!.experimentName).toBe('Test Campaign');
      expect(kpis!.channel).toBe('Email');
      expect(kpis!.status).toBe('active');

      // Check aggregated metrics
      expect(kpis!.totalSpend).toBe(2000);
      expect(kpis!.totalImpressions).toBe(100000);
      expect(kpis!.totalClicks).toBe(5000);
      expect(kpis!.totalConversions).toBe(500);
      expect(kpis!.totalRevenue).toBe(10000);

      // Check calculated KPIs
      expect(kpis!.ctr).toBe(5.0); // (5000 / 100000) * 100
      expect(kpis!.cac).toBe(4.0); // 2000 / 500
      expect(kpis!.conversionRate).toBe(10.0); // (500 / 5000) * 100
      expect(kpis!.roas).toBe(5.0); // 10000 / 2000
    });

    it('should return null for non-existent experiment', async () => {
      const kpis = await calculateExperimentKPIs('non-existent-id');
      expect(kpis).toBeNull();
    });

    it('should handle zero values correctly', async () => {
      const experiment = await prisma.experiment.create({
        data: {
          name: 'No Metrics',
          channel: 'Test',
          status: 'active',
        },
      });

      const kpis = await calculateExperimentKPIs(experiment.id);

      expect(kpis).toBeDefined();
      expect(kpis!.totalSpend).toBe(0);
      expect(kpis!.ctr).toBe(0);
      expect(kpis!.cac).toBe(0);
      expect(kpis!.conversionRate).toBe(0);
      expect(kpis!.roas).toBe(0);
    });

    it('should handle experiments with impressions but no clicks', async () => {
      const experiment = await prisma.experiment.create({
        data: {
          name: 'No Clicks',
          channel: 'Test',
          status: 'active',
        },
      });

      await prisma.experimentMetricSnapshot.create({
        data: {
          experimentId: experiment.id,
          date: new Date('2024-01-01'),
          spend: 100,
          impressions: 10000,
          clicks: 0,
          conversions: 0,
          revenue: 0,
        },
      });

      const kpis = await calculateExperimentKPIs(experiment.id);

      expect(kpis!.ctr).toBe(0);
      expect(kpis!.conversionRate).toBe(0);
    });
  });

  describe('calculateAllExperimentKPIs', () => {
    it('should calculate KPIs for all experiments', async () => {
      // Create multiple experiments
      const exp1 = await prisma.experiment.create({
        data: { name: 'Exp 1', channel: 'Email', status: 'active' },
      });

      const exp2 = await prisma.experiment.create({
        data: { name: 'Exp 2', channel: 'Ads', status: 'active' },
      });

      // Add metrics to first experiment
      await prisma.experimentMetricSnapshot.create({
        data: {
          experimentId: exp1.id,
          date: new Date('2024-01-01'),
          spend: 1000,
          impressions: 50000,
          clicks: 2500,
          conversions: 250,
          revenue: 5000,
        },
      });

      // Add metrics to second experiment
      await prisma.experimentMetricSnapshot.create({
        data: {
          experimentId: exp2.id,
          date: new Date('2024-01-01'),
          spend: 2000,
          impressions: 100000,
          clicks: 1000,
          conversions: 50,
          revenue: 3000,
        },
      });

      const allKPIs = await calculateAllExperimentKPIs();

      expect(allKPIs).toHaveLength(2);
      expect(allKPIs.find((k) => k.experimentId === exp1.id)).toBeDefined();
      expect(allKPIs.find((k) => k.experimentId === exp2.id)).toBeDefined();
    });

    it('should return empty array when no experiments exist', async () => {
      const allKPIs = await calculateAllExperimentKPIs();
      expect(allKPIs).toHaveLength(0);
    });
  });
});
