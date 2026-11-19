export interface ScenarioAssumption {
  id: 'conservative' | 'base' | 'ambitious';
  label: string;
  description: string;
  expectedCustomers: number;
  purchasesPerMonth: number;
  avgTransactionValue: number;
  variableCostPerSale: number;
  monthlyFixedCost: number;
}

export interface ScenarioProjection extends ScenarioAssumption {
  totalMonthlySales: number;
  contributionPerSale: number;
  estimatedMonthlyRevenue: number;
  totalVariableCost: number;
  totalContribution: number;
  estimatedOperatingSurplus: number;
}

export const VENTURE_SCENARIOS: ScenarioAssumption[] = [
  {
    id: 'conservative',
    label: 'Conservative Scenario',
    description: 'Initial pilot launch phase across Bargarh and Sambalpur.',
    expectedCustomers: 50,
    purchasesPerMonth: 1,
    avgTransactionValue: 500,
    variableCostPerSale: 150,
    monthlyFixedCost: 20000,
  },
  {
    id: 'base',
    label: 'Base Scenario',
    description: 'Steady regional adoption with repeat retail and restaurant buyers.',
    expectedCustomers: 100,
    purchasesPerMonth: 2,
    avgTransactionValue: 500,
    variableCostPerSale: 150,
    monthlyFixedCost: 20000,
  },
  {
    id: 'ambitious',
    label: 'Ambitious Scenario',
    description: 'Expanded Western Odisha network with frequent bulk orders.',
    expectedCustomers: 250,
    purchasesPerMonth: 3,
    avgTransactionValue: 500,
    variableCostPerSale: 150,
    monthlyFixedCost: 30000,
  },
];

export function calculateProjection(assumption: ScenarioAssumption): ScenarioProjection {
  const totalMonthlySales = assumption.expectedCustomers * assumption.purchasesPerMonth;
  const contributionPerSale = assumption.avgTransactionValue - assumption.variableCostPerSale;
  const estimatedMonthlyRevenue = totalMonthlySales * assumption.avgTransactionValue;
  const totalVariableCost = totalMonthlySales * assumption.variableCostPerSale;
  const totalContribution = totalMonthlySales * contributionPerSale;
  const estimatedOperatingSurplus = totalContribution - assumption.monthlyFixedCost;

  return {
    ...assumption,
    totalMonthlySales,
    contributionPerSale,
    estimatedMonthlyRevenue,
    totalVariableCost,
    totalContribution,
    estimatedOperatingSurplus,
  };
}

export function formatINR(amount: number): string {
  const isNegative = amount < 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.abs(Math.round(amount)));
  return `${isNegative ? '-' : ''}₹${formatted}`;
}
