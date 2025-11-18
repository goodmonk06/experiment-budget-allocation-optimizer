import { prisma } from '../db';
import { ExperimentKPIs } from '../types';

/**
 * Calculate aggregated KPIs for all experiments
 */
export async function calculateAllExperimentKPIs(): Promise<ExperimentKPIs[]> {
  const experiments = await prisma.experiment.findMany({
    include: {
      metrics: true,
    },
  });

  return experiments.map((experiment) => {
    const totalSpend = experiment.metrics.reduce((sum, m) => sum + m.spend, 0);
    const totalImpressions = experiment.metrics.reduce((sum, m) => sum + m.impressions, 0);
    const totalClicks = experiment.metrics.reduce((sum, m) => sum + m.clicks, 0);
    const totalConversions = experiment.metrics.reduce((sum, m) => sum + m.conversions, 0);
    const totalRevenue = experiment.metrics.reduce((sum, m) => sum + m.revenue, 0);

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cac = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return {
      experimentId: experiment.id,
      experimentName: experiment.name,
      channel: experiment.channel,
      status: experiment.status,
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      totalRevenue,
      ctr: parseFloat(ctr.toFixed(2)),
      cac: parseFloat(cac.toFixed(2)),
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      roas: parseFloat(roas.toFixed(2)),
      revenuePerSpend: parseFloat(roas.toFixed(2)), // Same as ROAS
    };
  });
}

/**
 * Calculate KPIs for a specific experiment
 */
export async function calculateExperimentKPIs(experimentId: string): Promise<ExperimentKPIs | null> {
  const experiment = await prisma.experiment.findUnique({
    where: { id: experimentId },
    include: {
      metrics: true,
    },
  });

  if (!experiment) {
    return null;
  }

  const totalSpend = experiment.metrics.reduce((sum, m) => sum + m.spend, 0);
  const totalImpressions = experiment.metrics.reduce((sum, m) => sum + m.impressions, 0);
  const totalClicks = experiment.metrics.reduce((sum, m) => sum + m.clicks, 0);
  const totalConversions = experiment.metrics.reduce((sum, m) => sum + m.conversions, 0);
  const totalRevenue = experiment.metrics.reduce((sum, m) => sum + m.revenue, 0);

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cac = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  return {
    experimentId: experiment.id,
    experimentName: experiment.name,
    channel: experiment.channel,
    status: experiment.status,
    totalSpend,
    totalImpressions,
    totalClicks,
    totalConversions,
    totalRevenue,
    ctr: parseFloat(ctr.toFixed(2)),
    cac: parseFloat(cac.toFixed(2)),
    conversionRate: parseFloat(conversionRate.toFixed(2)),
    roas: parseFloat(roas.toFixed(2)),
    revenuePerSpend: parseFloat(roas.toFixed(2)),
  };
}
