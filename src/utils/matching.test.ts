import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateMatch, findMatches, toKg, pricePerKg } from './matching';
import type { BuyerRequirement, Product } from '../types';

const sampleTomato: Product = {
  id: 'prod-1',
  farmerId: 'farmer-1',
  farmerName: 'Ramesh Sahu',
  farmerMobile: '+91 94371 20451',
  name: 'Tomato',
  category: 'Vegetables',
  image: '/src/assets/images/produce_tomato.jpg',
  availableQuantity: 500,
  unit: 'Kg',
  expectedPrice: 20,
  harvestDate: '2026-11-18',
  availabilityStatus: 'Available',
  approvalStatus: 'Approved',
  village: 'Attabira',
  district: 'Bargarh',
  description: 'Freshly harvested local red tomatoes.',
  isDemo: true,
  createdAt: '2026-11-18T08:00:00Z',
};

const sampleRequirement: BuyerRequirement = {
  id: 'req-1',
  buyerId: 'buyer-1',
  businessName: 'Sharma Grocery Store',
  productName: 'Tomato',
  category: 'Vegetables',
  requiredQuantity: 200,
  unit: 'Kg',
  maxBudgetPerUnit: 22,
  deliveryLocation: 'Bargarh Main Market',
  district: 'Bargarh',
  requiredDeliveryDate: '2026-11-21',
  contactNumber: '+91 98611 45290',
  notes: 'Need firm Grade-A tomatoes',
  status: 'Open',
  isDemo: true,
  createdAt: '2026-11-18T09:00:00Z',
};

test('unit conversion converts Quintals to Kg accurately', () => {
  assert.equal(toKg(5, 'Quintal'), 500);
  assert.equal(toKg(250, 'Kg'), 250);
  assert.equal(pricePerKg(2000, 'Quintal'), 20);
  assert.equal(pricePerKg(20, 'Kg'), 20);
});

test('Ramesh Sahu Tomato matches Sharma Grocery Store as Strong Match', () => {
  const result = evaluateMatch(sampleTomato, sampleRequirement);
  assert.ok(result, 'Expected a valid match');
  assert.equal(result.tier, 'Strong Match');
  assert.equal(result.score, 100);
  assert.equal(result.priceDeltaPerKg, 2);
  assert.ok(result.reasons.some((r) => r.includes('Exact produce match')));
  assert.ok(result.reasons.some((r) => r.includes('Same district (Bargarh)')));
  assert.ok(result.reasons.some((r) => r.includes('Within budget')));
});

test('rejects unapproved or out-of-stock products', () => {
  const pendingProd: Product = { ...sampleTomato, approvalStatus: 'Pending' };
  const outOfStockProd: Product = { ...sampleTomato, availabilityStatus: 'Out of Stock' };
  assert.equal(evaluateMatch(pendingProd, sampleRequirement), null);
  assert.equal(evaluateMatch(outOfStockProd, sampleRequirement), null);
});

test('rejects incompatible products and excessive prices (>15% over budget)', () => {
  const potatoReq: BuyerRequirement = { ...sampleRequirement, productName: 'Potato' };
  assert.equal(evaluateMatch(sampleTomato, potatoReq), null);

  const expensiveTomato: Product = { ...sampleTomato, expectedPrice: 30 };
  assert.equal(evaluateMatch(expensiveTomato, sampleRequirement), null);
});

test('supports cross-unit matching (Quintal farmer listing vs Kg buyer requirement)', () => {
  const quintalTomato: Product = {
    ...sampleTomato,
    availableQuantity: 5,
    unit: 'Quintal',
    expectedPrice: 2000, // ₹20/Kg
  };
  const result = evaluateMatch(quintalTomato, sampleRequirement);
  assert.ok(result);
  assert.equal(result.tier, 'Strong Match');
});

test('findMatches sorts best matches first', () => {
  const sambalpurTomato: Product = {
    ...sampleTomato,
    id: 'prod-2',
    district: 'Sambalpur',
    expectedPrice: 23, // Slightly over ₹22 budget -> negotiable
  };
  const matches = findMatches([sambalpurTomato, sampleTomato], [sampleRequirement]);
  assert.equal(matches.length, 2);
  assert.equal(matches[0].product.id, 'prod-1');
  assert.ok(matches[0].score > matches[1].score);
});
