'use client';

import { AllocationResponse } from '@/types';

interface AllocationSuggestionsProps {
  allocation: AllocationResponse | null;
}

export default function AllocationSuggestions({
  allocation,
}: AllocationSuggestionsProps) {
  if (!allocation) {
    return (
      <div className="text-center py-12 text-gray-500">
        Click "Generate Allocation Suggestion" to see recommendations
      </div>
    );
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalSuggestedBudget = allocation.suggestions.reduce(
    (sum, s) => sum + (s.suggestedBudget || 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Allocation Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Generated:</span>{' '}
            <span className="font-medium">
              {new Date(allocation.createdAt).toLocaleString()}
            </span>
          </div>
          {allocation.config.totalBudget && (
            <div>
              <span className="text-blue-700">Total Budget:</span>{' '}
              <span className="font-medium">
                {formatCurrency(allocation.config.totalBudget)}
              </span>
            </div>
          )}
          <div>
            <span className="text-blue-700">Min Allocation:</span>{' '}
            <span className="font-medium">
              {allocation.config.minAllocationPercent || 5}%
            </span>
          </div>
          <div>
            <span className="text-blue-700">Max Allocation:</span>{' '}
            <span className="font-medium">
              {allocation.config.maxAllocationPercent || 50}%
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {allocation.suggestions.map((suggestion, index) => (
          <div
            key={suggestion.experimentId}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-gray-700">
                    #{index + 1}
                  </span>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {suggestion.experimentName}
                    </h4>
                    <p className="text-sm text-gray-500">{suggestion.reason}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div>
                    <div className="text-xs text-gray-500 uppercase">
                      Current Spend
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(suggestion.currentSpend)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">
                      Suggested %
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {suggestion.suggestedPercentage.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">
                      Suggested Budget
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(suggestion.suggestedBudget)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">
                      Performance Score
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {suggestion.score.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Percentage bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${suggestion.suggestedPercentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalSuggestedBudget > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <div className="text-center">
            <div className="text-sm text-green-700">Total Suggested Budget</div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(totalSuggestedBudget)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
