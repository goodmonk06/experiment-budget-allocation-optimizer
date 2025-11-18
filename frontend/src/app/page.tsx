'use client';

import { useState, useEffect } from 'react';
import ExperimentTable from '@/components/ExperimentTable';
import AllocationSuggestions from '@/components/AllocationSuggestions';
import { fetchKPIs, generateAllocation } from '@/lib/api';
import { ExperimentKPI, AllocationResponse } from '@/types';

export default function Home() {
  const [kpis, setKpis] = useState<ExperimentKPI[]>([]);
  const [allocation, setAllocation] = useState<AllocationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration state
  const [totalBudget, setTotalBudget] = useState<string>('');
  const [minAllocation, setMinAllocation] = useState<number>(5);
  const [maxAllocation, setMaxAllocation] = useState<number>(50);

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchKPIs();
      setKpis(data);
    } catch (err) {
      setError('Failed to load experiments. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAllocation = async () => {
    try {
      setGenerating(true);
      setError(null);

      const config: any = {
        minAllocationPercent: minAllocation,
        maxAllocationPercent: maxAllocation,
      };

      if (totalBudget && parseFloat(totalBudget) > 0) {
        config.totalBudget = parseFloat(totalBudget);
      }

      const data = await generateAllocation(config);
      setAllocation(data);

      // Scroll to suggestions
      setTimeout(() => {
        document.getElementById('suggestions')?.scrollIntoView({
          behavior: 'smooth',
        });
      }, 100);
    } catch (err) {
      setError('Failed to generate allocation. Please try again.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading experiments...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Budget Allocation Optimizer
          </h1>
          <p className="text-gray-600">
            Optimize your marketing budget across experiments based on performance
            metrics
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* KPI Summary Cards */}
        {kpis.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 uppercase">Total Spend</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                $
                {kpis
                  .reduce((sum, k) => sum + k.totalSpend, 0)
                  .toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 uppercase">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                $
                {kpis
                  .reduce((sum, k) => sum + k.totalRevenue, 0)
                  .toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 uppercase">
                Total Conversions
              </div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {kpis
                  .reduce((sum, k) => sum + k.totalConversions, 0)
                  .toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500 uppercase">Avg ROAS</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">
                {(
                  kpis.reduce((sum, k) => sum + k.roas, 0) / kpis.length
                ).toFixed(2)}
                x
              </div>
            </div>
          </div>
        )}

        {/* Experiments Table */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Experiment Performance
          </h2>
          <ExperimentTable kpis={kpis} />
        </div>

        {/* Allocation Controls */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Generate Budget Allocation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Budget (optional)
              </label>
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="e.g., 50000"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Allocation % (default: 5%)
              </label>
              <input
                type="number"
                value={minAllocation}
                onChange={(e) => setMinAllocation(parseFloat(e.target.value))}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Allocation % (default: 50%)
              </label>
              <input
                type="number"
                value={maxAllocation}
                onChange={(e) => setMaxAllocation(parseFloat(e.target.value))}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateAllocation}
            disabled={generating || kpis.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {generating ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Allocation Suggestion'
            )}
          </button>
        </div>

        {/* Allocation Suggestions */}
        <div id="suggestions" className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Budget Allocation Suggestions
          </h2>
          <AllocationSuggestions allocation={allocation} />
        </div>
      </div>
    </main>
  );
}
