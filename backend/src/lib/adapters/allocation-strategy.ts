import { AllocationConfig, AllocationSuggestionOutput, ExperimentKPIs } from '../../types';
import { calculateAllocationSuggestions as compositeStrategy } from '../../services/allocation-engine';

export interface IAllocationStrategy {
  name: string;
  calculate(
    kpis: ExperimentKPIs[],
    config: AllocationConfig
  ): AllocationSuggestionOutput[];
}

// Default composite scoring strategy (existing algorithm)
export class CompositeStrategy implements IAllocationStrategy {
  name = 'composite';

  calculate(
    kpis: ExperimentKPIs[],
    config: AllocationConfig
  ): AllocationSuggestionOutput[] {
    return compositeStrategy(kpis, config);
  }
}

// Revenue-focused strategy (prioritizes revenue over conversion rate)
export class RevenueFocusedStrategy implements IAllocationStrategy {
  name = 'revenue-focused';

  calculate(
    kpis: ExperimentKPIs[],
    config: AllocationConfig
  ): AllocationSuggestionOutput[] {
    const {
      minAllocationPercent = 5,
      maxAllocationPercent = 50,
      totalBudget,
    } = config;

    const activeExperiments = kpis.filter(
      (kpi) => kpi.status === 'active' && kpi.totalSpend > 0
    );

    if (activeExperiments.length === 0) {
      return [];
    }

    // Score based heavily on revenue
    const scoredExperiments = activeExperiments.map((kpi) => {
      const revenueScore = kpi.totalRevenue * 0.6;
      const roasScore = kpi.roas * 0.3;
      const conversionScore = (kpi.conversionRate / 100) * 0.1;

      const score = revenueScore + roasScore + conversionScore;

      return {
        ...kpi,
        score: Math.max(score, 0),
      };
    });

    return this.normalizeAndAllocate(
      scoredExperiments,
      minAllocationPercent,
      maxAllocationPercent,
      totalBudget
    );
  }

  private normalizeAndAllocate(
    experiments: (ExperimentKPIs & { score: number })[],
    minPercent: number,
    maxPercent: number,
    totalBudget?: number
  ): AllocationSuggestionOutput[] {
    const totalScore = experiments.reduce((sum, exp) => sum + exp.score, 0);

    if (totalScore === 0) {
      const evenPercentage = 100 / experiments.length;
      return experiments.map((kpi) => ({
        experimentId: kpi.experimentId,
        experimentName: kpi.experimentName,
        currentSpend: kpi.totalSpend,
        suggestedPercentage: parseFloat(evenPercentage.toFixed(2)),
        suggestedBudget: totalBudget ? (totalBudget * evenPercentage) / 100 : null,
        score: 0,
        reason: 'Equal distribution (no positive scores)',
      }));
    }

    let suggestions = experiments.map((exp) => ({
      ...exp,
      rawPercentage: (exp.score / totalScore) * 100,
    }));

    suggestions = suggestions.map((sug) => ({
      ...sug,
      suggestedPercentage: Math.min(Math.max(sug.rawPercentage, minPercent), maxPercent),
    }));

    const totalPercentage = suggestions.reduce(
      (sum, sug) => sum + sug.suggestedPercentage,
      0
    );

    if (totalPercentage !== 100) {
      const adjustmentFactor = 100 / totalPercentage;
      suggestions = suggestions.map((sug) => ({
        ...sug,
        suggestedPercentage: sug.suggestedPercentage * adjustmentFactor,
      }));
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .map((sug) => ({
        experimentId: sug.experimentId,
        experimentName: sug.experimentName,
        currentSpend: sug.totalSpend,
        suggestedPercentage: parseFloat(sug.suggestedPercentage.toFixed(2)),
        suggestedBudget: totalBudget
          ? parseFloat(((totalBudget * sug.suggestedPercentage) / 100).toFixed(2))
          : null,
        score: parseFloat(sug.score.toFixed(4)),
        reason: `Revenue-focused allocation (score: ${sug.score.toFixed(2)})`,
      }));
  }
}

// Efficiency-focused strategy (prioritizes low CAC and high conversion rate)
export class EfficiencyFocusedStrategy implements IAllocationStrategy {
  name = 'efficiency-focused';

  calculate(
    kpis: ExperimentKPIs[],
    config: AllocationConfig
  ): AllocationSuggestionOutput[] {
    const {
      minAllocationPercent = 5,
      maxAllocationPercent = 50,
      totalBudget,
    } = config;

    const activeExperiments = kpis.filter(
      (kpi) => kpi.status === 'active' && kpi.totalSpend > 0
    );

    if (activeExperiments.length === 0) {
      return [];
    }

    // Score based on efficiency metrics
    const scoredExperiments = activeExperiments.map((kpi) => {
      // Lower CAC is better (invert it)
      const cacScore = kpi.cac > 0 ? (1 / kpi.cac) * 0.4 : 0;
      const conversionScore = (kpi.conversionRate / 100) * 0.4;
      const ctrScore = (kpi.ctr / 100) * 0.2;

      const score = cacScore + conversionScore + ctrScore;

      return {
        ...kpi,
        score: Math.max(score, 0),
      };
    });

    const totalScore = scoredExperiments.reduce((sum, exp) => sum + exp.score, 0);

    if (totalScore === 0) {
      const evenPercentage = 100 / activeExperiments.length;
      return activeExperiments.map((kpi) => ({
        experimentId: kpi.experimentId,
        experimentName: kpi.experimentName,
        currentSpend: kpi.totalSpend,
        suggestedPercentage: parseFloat(evenPercentage.toFixed(2)),
        suggestedBudget: totalBudget ? (totalBudget * evenPercentage) / 100 : null,
        score: 0,
        reason: 'Equal distribution (no positive scores)',
      }));
    }

    let suggestions = scoredExperiments.map((exp) => ({
      ...exp,
      rawPercentage: (exp.score / totalScore) * 100,
      suggestedPercentage: Math.min(
        Math.max((exp.score / totalScore) * 100, minAllocationPercent),
        maxAllocationPercent
      ),
    }));

    const totalPercentage = suggestions.reduce(
      (sum, sug) => sum + sug.suggestedPercentage,
      0
    );

    if (totalPercentage !== 100) {
      const adjustmentFactor = 100 / totalPercentage;
      suggestions = suggestions.map((sug) => ({
        ...sug,
        suggestedPercentage: sug.suggestedPercentage * adjustmentFactor,
      }));
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .map((sug) => ({
        experimentId: sug.experimentId,
        experimentName: sug.experimentName,
        currentSpend: sug.totalSpend,
        suggestedPercentage: parseFloat(sug.suggestedPercentage.toFixed(2)),
        suggestedBudget: totalBudget
          ? parseFloat(((totalBudget * sug.suggestedPercentage) / 100).toFixed(2))
          : null,
        score: parseFloat(sug.score.toFixed(4)),
        reason: `Efficiency-focused allocation (low CAC: $${sug.cac.toFixed(2)})`,
      }));
  }
}

// Strategy registry
export class AllocationStrategyRegistry {
  private strategies: Map<string, IAllocationStrategy> = new Map();

  constructor() {
    // Register default strategies
    this.register(new CompositeStrategy());
    this.register(new RevenueFocusedStrategy());
    this.register(new EfficiencyFocusedStrategy());
  }

  register(strategy: IAllocationStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  get(name: string): IAllocationStrategy | undefined {
    return this.strategies.get(name);
  }

  getAll(): IAllocationStrategy[] {
    return Array.from(this.strategies.values());
  }

  has(name: string): boolean {
    return this.strategies.has(name);
  }
}

export const strategyRegistry = new AllocationStrategyRegistry();
