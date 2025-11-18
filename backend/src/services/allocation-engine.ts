import { AllocationConfig, AllocationSuggestionOutput, ExperimentKPIs } from '../types';

/**
 * Budget Allocation Engine
 *
 * Algorithm:
 * 1. Calculate a composite score for each experiment based on:
 *    - ROAS (Return on Ad Spend): 40% weight
 *    - Conversion Rate: 30% weight
 *    - Revenue per Spend: 30% weight (same as ROAS, but kept for clarity)
 *
 * 2. Normalize scores to percentages
 * 3. Apply min/max constraints
 * 4. Redistribute any remaining budget proportionally
 *
 * Limitations:
 * - Simple heuristic, doesn't account for seasonality
 * - Doesn't consider diminishing returns at scale
 * - Assumes past performance indicates future results
 * - Doesn't factor in experiment lifecycle stage
 */
export function calculateAllocationSuggestions(
  kpis: ExperimentKPIs[],
  config: AllocationConfig = {}
): AllocationSuggestionOutput[] {
  const {
    minAllocationPercent = 5,
    maxAllocationPercent = 50,
    totalBudget,
  } = config;

  // Filter to only active experiments with spend
  const activeExperiments = kpis.filter(
    (kpi) => kpi.status === 'active' && kpi.totalSpend > 0
  );

  if (activeExperiments.length === 0) {
    return [];
  }

  // Calculate composite score for each experiment
  const scoredExperiments = activeExperiments.map((kpi) => {
    // Composite score calculation
    // Higher ROAS, conversion rate, and revenue per spend = better
    const roasScore = kpi.roas * 0.4;
    const conversionScore = (kpi.conversionRate / 100) * 0.3;
    const revenueScore = kpi.revenuePerSpend * 0.3;

    const score = roasScore + conversionScore + revenueScore;

    return {
      ...kpi,
      score: Math.max(score, 0), // Ensure non-negative
    };
  });

  // Calculate total score
  const totalScore = scoredExperiments.reduce((sum, exp) => sum + exp.score, 0);

  if (totalScore === 0) {
    // If no positive scores, distribute evenly
    const evenPercentage = 100 / activeExperiments.length;
    return activeExperiments.map((kpi) => ({
      experimentId: kpi.experimentId,
      experimentName: kpi.experimentName,
      currentSpend: kpi.totalSpend,
      suggestedPercentage: parseFloat(evenPercentage.toFixed(2)),
      suggestedBudget: totalBudget ? (totalBudget * evenPercentage) / 100 : null,
      score: 0,
      reason: 'Equal distribution (no positive performance scores)',
    }));
  }

  // Calculate raw percentage based on score
  let suggestions = scoredExperiments.map((exp) => {
    const rawPercentage = (exp.score / totalScore) * 100;
    return {
      experimentId: exp.experimentId,
      experimentName: exp.experimentName,
      currentSpend: exp.totalSpend,
      rawPercentage,
      score: exp.score,
    };
  });

  // Apply min/max constraints
  let constrainedSuggestions = suggestions.map((sug) => ({
    ...sug,
    suggestedPercentage: Math.min(
      Math.max(sug.rawPercentage, minAllocationPercent),
      maxAllocationPercent
    ),
  }));

  // Normalize to ensure percentages sum to 100%
  let totalPercentage = constrainedSuggestions.reduce(
    (sum, sug) => sum + sug.suggestedPercentage,
    0
  );

  // Adjust proportionally to reach exactly 100%
  if (totalPercentage !== 100) {
    const adjustmentFactor = 100 / totalPercentage;
    constrainedSuggestions = constrainedSuggestions.map((sug) => ({
      ...sug,
      suggestedPercentage: sug.suggestedPercentage * adjustmentFactor,
    }));
  }

  // Build final output
  return constrainedSuggestions
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .map((sug) => {
      const suggestedBudget = totalBudget
        ? (totalBudget * sug.suggestedPercentage) / 100
        : null;

      let reason = '';
      if (sug.suggestedPercentage === maxAllocationPercent) {
        reason = `Capped at maximum ${maxAllocationPercent}% (high performance)`;
      } else if (sug.suggestedPercentage === minAllocationPercent) {
        reason = `Set to minimum ${minAllocationPercent}% (low performance)`;
      } else {
        reason = `Allocated based on performance score ${sug.score.toFixed(2)}`;
      }

      return {
        experimentId: sug.experimentId,
        experimentName: sug.experimentName,
        currentSpend: sug.currentSpend,
        suggestedPercentage: parseFloat(sug.suggestedPercentage.toFixed(2)),
        suggestedBudget: suggestedBudget ? parseFloat(suggestedBudget.toFixed(2)) : null,
        score: parseFloat(sug.score.toFixed(4)),
        reason,
      };
    });
}
