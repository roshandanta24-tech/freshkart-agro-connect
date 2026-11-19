export type UserRole = 'farmer' | 'buyer' | 'admin';

export type BuyerCategory =
  | 'Grocery Store'
  | 'Retailer'
  | 'Wholesaler'
  | 'Restaurant'
  | 'Hotel'
  | 'Individual Household';

export type ProductCategory =
  | 'Vegetables'
  | 'Fruits'
  | 'Grains'
  | 'Pulses'
  | 'Other Agricultural Products';

export type QuantityUnit = 'Kg' | 'Quintal';

export type AvailabilityStatus = 'Available' | 'Limited Stock' | 'Out of Stock';

export type ApprovalStatus = 'Approved' | 'Pending' | 'Rejected';

export type EnquiryStatus = 'Pending' | 'Accepted' | 'Rejected';

export type OrderStatus =
  | 'Enquiry Received'
  | 'Negotiation in Progress'
  | 'Accepted'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled';

export type RequirementStatus = 'Open' | 'Fulfilled' | 'Closed';

export const WESTERN_ODISHA_DISTRICTS = [
  'Bargarh',
  'Sambalpur',
  'Jharsuguda',
  'Balangir',
  'Subarnapur (Sonepur)',
  'Sundargarh',
] as const;

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Pulses',
  'Other Agricultural Products',
];

export const BUYER_CATEGORIES: BuyerCategory[] = [
  'Grocery Store',
  'Retailer',
  'Wholesaler',
  'Restaurant',
  'Hotel',
  'Individual Household',
];

export const ORDER_STATUSES: OrderStatus[] = [
  'Enquiry Received',
  'Negotiation in Progress',
  'Accepted',
  'Confirmed',
  'Completed',
  'Cancelled',
];

export interface PublicUser {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  role: UserRole;
  district: string;
  village: string;
  businessName?: string;
  buyerCategory?: BuyerCategory;
  farmingDetails?: string;
  accountStatus: 'active' | 'suspended';
  isDemo: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  farmerId: string;
  farmerName?: string;
  farmerMobile?: string;
  name: string;
  category: ProductCategory;
  image: string;
  availableQuantity: number;
  unit: QuantityUnit;
  expectedPrice: number; // Price per unit (₹)
  harvestDate: string;
  availabilityStatus: AvailabilityStatus;
  approvalStatus: ApprovalStatus;
  village: string;
  district: string;
  description: string;
  isDemo: boolean;
  createdAt: string;
}

export interface BuyerRequirement {
  id: string;
  buyerId: string;
  buyerName?: string;
  buyerCategory?: BuyerCategory;
  businessName: string;
  productName: string;
  category: ProductCategory;
  requiredQuantity: number;
  unit: QuantityUnit;
  maxBudgetPerUnit: number;
  deliveryLocation: string;
  district: string;
  requiredDeliveryDate: string;
  contactNumber: string;
  notes: string;
  status: RequirementStatus;
  isDemo: boolean;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  buyerId: string;
  farmerId: string;
  productId: string;
  buyerName: string;
  buyerBusiness?: string;
  buyerMobile?: string;
  farmerName?: string;
  farmerMobile?: string;
  productName: string;
  requiredQuantity: number;
  unit: QuantityUnit;
  expectedPrice: number;
  deliveryLocation: string;
  preferredPurchaseDate: string;
  message: string;
  status: EnquiryStatus;
  isDemo: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  enquiryId?: string;
  farmerId: string;
  buyerId: string;
  productId: string;
  farmerName: string;
  farmerMobile: string;
  farmerLocation: string;
  buyerName: string;
  buyerBusiness?: string;
  buyerMobile: string;
  buyerLocation: string;
  productName: string;
  quantity: number;
  unit: QuantityUnit;
  agreedPrice: number;
  totalValue: number;
  status: OrderStatus;
  orderDate: string;
  notes?: string;
  isDemo: boolean;
}

export interface MatchResult {
  id: string;
  product: Product;
  requirement: BuyerRequirement;
  score: number;
  tier: 'Strong Match' | 'Good Match' | 'Negotiable Match';
  reasons: string[];
  priceDeltaPerKg: number;
}
