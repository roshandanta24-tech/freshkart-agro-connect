import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateProjection, formatINR, VENTURE_SCENARIOS } from './projections';

test('Base Scenario matches venture plan financial figures exactly', () => {
  const base = VENTURE_SCENARIOS.find((s) => s.id === 'base')!;
  const result = calculateProjection(base);
  assert.equal(result.totalMonthlySales, 200);
  assert.equal(result.contributionPerSale, 350);
  assert.equal(result.estimatedMonthlyRevenue, 100000);
  assert.equal(result.estimatedOperatingSurplus, 50000);
  assert.equal(formatINR(result.estimatedMonthlyRevenue), '₹1,00,000');
  assert.equal(formatINR(result.estimatedOperatingSurplus), '₹50,000');
});

test('Conservative Scenario computes expected monthly surplus accurately', () => {
  const conservative = VENTURE_SCENARIOS.find((s) => s.id === 'conservative')!;
  const result = calculateProjection(conservative);
  assert.equal(result.totalMonthlySales, 50);
  assert.equal(result.estimatedMonthlyRevenue, 25000);
  assert.equal(result.totalContribution, 17500);
  assert.equal(result.estimatedOperatingSurplus, -2500);
  assert.equal(formatINR(result.estimatedOperatingSurplus), '-₹2,500');
});

test('Ambitious Scenario computes expected monthly surplus accurately', () => {
  const ambitious = VENTURE_SCENARIOS.find((s) => s.id === 'ambitious')!;
  const result = calculateProjection(ambitious);
  assert.equal(result.totalMonthlySales, 750);
  assert.equal(result.estimatedMonthlyRevenue, 375000);
  assert.equal(result.totalContribution, 262500);
  assert.equal(result.estimatedOperatingSurplus, 232500);
  assert.equal(formatINR(result.estimatedOperatingSurplus), '₹2,32,500');
});
