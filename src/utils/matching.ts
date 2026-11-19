import type { BuyerRequirement, MatchResult, Product, QuantityUnit } from '../types';

/**
 * Convert quantity to kilograms for unit-consistent comparison.
 * 1 Quintal = 100 Kg.
 */
export function toKg(quantity: number, unit: QuantityUnit): number {
  return unit === 'Quintal' ? quantity * 100 : quantity;
}

/**
 * Normalize unit price to price per kilogram (₹/Kg).
 */
export function pricePerKg(price: number, unit: QuantityUnit): number {
  return unit === 'Quintal' ? price / 100 : price;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
}

/**
 * Transparent rule-based Farmer-Buyer Matching Engine.
 * Evaluates compatibility across five deterministic criteria:
 * 1. Product name or category
 * 2. Required quantity vs available quantity (unit-normalized to Kg)
 * 3. District / Western Odisha location proximity
 * 4. Buyer's maximum budget vs farmer's listed price
 * 5. Product availability and approval status
 */
export function evaluateMatch(
  product: Product,
  requirement: BuyerRequirement
): MatchResult | null {
  // Criterion 5: Product must be approved & available, requirement must be open
  if (product.approvalStatus !== 'Approved') return null;
  if (product.availabilityStatus === 'Out of Stock' || product.availableQuantity <= 0) return null;
  if (requirement.status !== 'Open' || requirement.requiredQuantity <= 0) return null;

  const prodName = normalizeText(product.name);
  const reqName = normalizeText(requirement.productName);

  // Criterion 1: Product Name or Category
  const exactNameMatch = prodName === reqName;
  const partialNameMatch =
    !exactNameMatch && (prodName.includes(reqName) || reqName.includes(prodName));
  const categoryMatch = product.category === requirement.category;

  if (!exactNameMatch && !partialNameMatch) {
    // Only match when product names correspond; avoid unrelated produce noise
    return null;
  }

  let score = 0;
  const reasons: string[] = [];

  if (exactNameMatch) {
    score += 35;
    reasons.push(`Exact produce match: ${product.name}`);
  } else if (partialNameMatch) {
    score += 28;
    reasons.push(`Matching produce variety: ${product.name} for ${requirement.productName}`);
  }

  if (categoryMatch) {
    score += 5;
  }

  // Criterion 2: Quantity Compatibility (Kg normalized)
  const availableKg = toKg(product.availableQuantity, product.unit);
  const requiredKg = toKg(requirement.requiredQuantity, requirement.unit);
  const coverageRatio = availableKg / requiredKg;

  if (availableKg >= requiredKg) {
    score += 25;
    reasons.push(
      `Quantity fulfilled: ${product.availableQuantity} ${product.unit} available covers ${requirement.requiredQuantity} ${requirement.unit} required`
    );
  } else if (coverageRatio >= 0.5) {
    score += 12;
    reasons.push(
      `Partial supply available: covers ${Math.round(coverageRatio * 100)}% of requested ${requirement.requiredQuantity} ${requirement.unit}`
    );
  } else {
    // Insufficient supply to be a useful match
    return null;
  }

  // Criterion 3: Location & District Match
  const sameDistrict =
    normalizeText(product.district) === normalizeText(requirement.district);
  if (sameDistrict) {
    score += 20;
    reasons.push(`Same district (${product.district}) — lower transport cost`);
  } else {
    score += 8;
    reasons.push(
      `Nearby Western Odisha district (${product.district} to ${requirement.district})`
    );
  }

  // Criterion 4: Price Compatibility (₹/Kg)
  const listedPerKg = pricePerKg(product.expectedPrice, product.unit);
  const budgetPerKg = pricePerKg(requirement.maxBudgetPerUnit, requirement.unit);
  const priceDeltaPerKg = Number((budgetPerKg - listedPerKg).toFixed(2));

  if (listedPerKg <= budgetPerKg) {
    score += 15;
    if (priceDeltaPerKg > 0) {
      reasons.push(
        `Within budget: ₹${listedPerKg}/kg listed vs ₹${budgetPerKg}/kg max budget (saves ₹${priceDeltaPerKg}/kg)`
      );
    } else {
      reasons.push(`Exact budget match at ₹${listedPerKg}/kg`);
    }
  } else if (listedPerKg <= budgetPerKg * 1.15) {
    score += 6;
    reasons.push(
      `Negotiable price: listed at ₹${listedPerKg}/kg vs ₹${budgetPerKg}/kg buyer budget`
    );
  } else {
    // More than 15% over buyer budget
    return null;
  }

  // Bonus for full immediate availability
  if (product.availabilityStatus === 'Available') {
    reasons.push('Immediately available for direct farm pickup or coordination');
  } else {
    reasons.push('Limited stock — quick coordination recommended');
  }

  const tier: MatchResult['tier'] =
    score >= 85 ? 'Strong Match' : score >= 65 ? 'Good Match' : 'Negotiable Match';

  return {
    id: `${product.id}__${requirement.id}`,
    product,
    requirement,
    score: Math.min(100, score),
    tier,
    reasons,
    priceDeltaPerKg,
  };
}

/**
 * Compute all valid rule-based matches between products and buyer requirements,
 * sorted by highest compatibility score first.
 */
export function findMatches(
  products: Product[],
  requirements: BuyerRequirement[]
): MatchResult[] {
  const results: MatchResult[] = [];
  for (const product of products) {
    for (const requirement of requirements) {
      const match = evaluateMatch(product, requirement);
      if (match) {
        results.push(match);
      }
    }
  }
  return results.sort((a, b) => b.score - a.score);
}
