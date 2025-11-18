import { z } from 'zod';

// Validation schemas
export const CreateExperimentSchema = z.object({
  name: z.string().min(1),
  channel: z.string().min(1),
  status: z.enum(['active', 'paused', 'completed']),
});

export const UpsertMetricSchema = z.object({
  experimentId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  spend: z.number().nonnegative(),
  impressions: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  conversions: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
});

export const AllocationConfigSchema = z.object({
  minAllocationPercent: z.number().min(0).max(100).default(5),
  maxAllocationPercent: z.number().min(0).max(100).default(50),
  totalBudget: z.number().positive().optional(),
});

// Types
export type CreateExperimentInput = z.infer<typeof CreateExperimentSchema>;
export type UpsertMetricInput = z.infer<typeof UpsertMetricSchema>;
export type AllocationConfig = z.infer<typeof AllocationConfigSchema>;

// Calculated KPIs
export interface ExperimentKPIs {
  experimentId: string;
  experimentName: string;
  channel: string;
  status: string;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  ctr: number; // Click-through rate (clicks / impressions)
  cac: number; // Customer acquisition cost (spend / conversions)
  conversionRate: number; // conversions / clicks
  roas: number; // Return on ad spend (revenue / spend)
  revenuePerSpend: number; // revenue / spend (alias for ROAS)
}

export interface AllocationSuggestionOutput {
  experimentId: string;
  experimentName: string;
  currentSpend: number;
  suggestedPercentage: number;
  suggestedBudget: number | null;
  score: number; // The allocation score used for ranking
  reason: string;
}
