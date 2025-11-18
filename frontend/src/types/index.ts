export interface ExperimentKPI {
  experimentId: string;
  experimentName: string;
  channel: string;
  status: string;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  ctr: number;
  cac: number;
  conversionRate: number;
  roas: number;
  revenuePerSpend: number;
}

export interface AllocationSuggestion {
  experimentId: string;
  experimentName: string;
  currentSpend: number;
  suggestedPercentage: number;
  suggestedBudget: number | null;
  score: number;
  reason: string;
}

export interface AllocationResponse {
  id: string;
  createdAt: string;
  suggestions: AllocationSuggestion[];
  config: {
    minAllocationPercent?: number;
    maxAllocationPercent?: number;
    totalBudget?: number;
  };
}
