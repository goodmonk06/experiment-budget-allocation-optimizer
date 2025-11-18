const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchKPIs() {
  const response = await fetch(`${API_URL}/allocations/kpis/current`);
  if (!response.ok) {
    throw new Error('Failed to fetch KPIs');
  }
  return response.json();
}

export async function generateAllocation(config?: {
  minAllocationPercent?: number;
  maxAllocationPercent?: number;
  totalBudget?: number;
}) {
  const response = await fetch(`${API_URL}/allocations/suggest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config || {}),
  });

  if (!response.ok) {
    throw new Error('Failed to generate allocation');
  }

  return response.json();
}
