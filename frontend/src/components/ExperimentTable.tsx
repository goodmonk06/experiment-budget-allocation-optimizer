'use client';

import { ExperimentKPI } from '@/types';

interface ExperimentTableProps {
  kpis: ExperimentKPI[];
}

export default function ExperimentTable({ kpis }: ExperimentTableProps) {
  if (kpis.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No experiments found. Please seed the database.
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Experiment
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Channel
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Spend
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Revenue
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Impressions
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Clicks
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Conversions
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              CTR
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Conv. Rate
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              CAC
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              ROAS
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {kpis.map((kpi) => (
            <tr key={kpi.experimentId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {kpi.experimentName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{kpi.channel}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                    kpi.status
                  )}`}
                >
                  {kpi.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                {formatCurrency(kpi.totalSpend)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                {formatCurrency(kpi.totalRevenue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                {formatNumber(kpi.totalImpressions)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                {formatNumber(kpi.totalClicks)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                {formatNumber(kpi.totalConversions)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                {kpi.ctr.toFixed(2)}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                {kpi.conversionRate.toFixed(2)}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                {formatCurrency(kpi.cac)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <span
                  className={
                    kpi.roas >= 2
                      ? 'text-green-600'
                      : kpi.roas >= 1
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }
                >
                  {kpi.roas.toFixed(2)}x
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
