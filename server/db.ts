import fs from 'node:fs';
import path from 'node:path';
import type {
  BuyerRequirement,
  Enquiry,
  Order,
  Product,
} from '../src/types';
import { hashPassword, type StoredUser } from './auth';

export interface DatabaseSchema {
  version: number;
  users: StoredUser[];
  products: Product[];
  buyerRequirements: BuyerRequirement[];
  enquiries: Enquiry[];
  orders: Order[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'freshkart-db.json');

const IMG = {
  tomato: '/src/assets/images/produce_tomato_1795091214056.jpg',
  potato: '/src/assets/images/produce_potato_1795091335112.jpg',
  onion: '/src/assets/images/produce_onion_1795091336316.jpg',
  greenChilli: '/src/assets/images/produce_green_chilli_1795091215513.jpg',
  cauliflower: '/src/assets/images/produce_cauliflower_1795091226831.jpg',
  brinjal: '/src/assets/images/produce_brinjal_1795091214951.jpg',
  cabbage: '/src/assets/images/produce_cabbage_1795091335150.jpg',
  rice: '/src/assets/images/produce_rice_1795091215748.jpg',
  mango: '/src/assets/images/produce_mango_1795091341049.jpg',
  banana: '/src/assets/images/produce_banana_1795091340395.jpg',
};

function buildInitialSeed(): DatabaseSchema {
  const users: StoredUser[] = [
    {
      id: 'usr-farmer-1',
      fullName: 'Ramesh Sahu',
      mobile: '+91 94371 20451',
      email: 'ramesh.farmer@freshkart.demo',
      passwordHash: hashPassword('farmer123'),
      role: 'farmer',
      district: 'Bargarh',
      village: 'Attabira',
      farmingDetails: '6.5 acres irrigated vegetable & paddy farm near Hirakud canal.',
      accountStatus: 'active',
      isDemo: true,
      createdAt: '2026-10-12T07:30:00.000Z',
    },
    {
      id: 'usr-farmer-2',
      fullName: 'Savitri Meher',
      mobile: '+91 94372 88319',
      email: 'savitri.farmer@freshkart.demo',
      passwordHash: hashPassword('farmer123'),
      role: 'farmer',
      district: 'Sambalpur',
      village: 'Burla',
      farmingDetails: '4 acres seasonal vegetable and orchard cultivation.',
      accountStatus: 'active',
      isDemo: true,
      createdAt: '2026-10-18T08:15:00.000Z',
    },
    {
      id: 'usr-farmer-3',
      fullName: 'Bibhuti Pradhan',
      mobile: '+91 94375 61904',
      email: 'bibhuti.farmer@freshkart.demo',
      passwordHash: hashPassword('farmer123'),
      role: 'farmer',
      district: 'Bargarh',
      village: 'Sohela',
      farmingDetails: '8 acres traditional rice, pulses, and winter brassica crops.',
      accountStatus: 'active',
      isDemo: true,
      createdAt: '2026-10-22T06:45:00.000Z',
    },
    {
      id: 'usr-buyer-1',
      fullName: 'Prakash Sharma',
      mobile: '+91 98611 45290',
      email: 'sharma.buyer@freshkart.demo',
      passwordHash: hashPassword('buyer123'),
      role: 'buyer',
      buyerCategory: 'Grocery Store',
      businessName: 'Sharma Grocery Store',
      district: 'Bargarh',
      village: 'Bargarh Main Road',
      accountStatus: 'active',
      isDemo: true,
      createdAt: '2026-10-15T10:00:00.000Z',
    },
    {
      id: 'usr-buyer-2',
      fullName: 'Ananya Patel',
      mobile: '+91 98612 77341',
      email: 'mahanadi.buyer@freshkart.demo',
      passwordHash: hashPassword('buyer123'),
      role: 'buyer',
      buyerCategory: 'Restaurant',
      businessName: 'Mahanadi Spice Restaurant',
      district: 'Sambalpur',
      village: 'Ainthapali',
      accountStatus: 'active',
      isDemo: true,
      createdAt: '2026-10-20T11:30:00.000Z',
    },
    {
      id: 'usr-buyer-3',
      fullName: 'Debashis Dash',
      mobile: '+91 98614 33018',
      email: 'dash.wholesale@freshkart.demo',
      passwordHash: hashPassword('buyer123'),
      role: 'buyer',
      buyerCategory: 'Wholesaler',
      businessName: 'Dash Agro Traders',
      district: 'Sambalpur',
      village: 'Khetrajpur Mandi Area',
      accountStatus: 'active',
      isDemo: true,
      createdAt: '2026-10-25T09:00:00.000Z',
    },
    {
      id: 'usr-admin-1',
      fullName: 'FreshKart Operations Admin',
      mobile: '+91 94370 11223',
      email: 'admin@freshkart.demo',
      passwordHash: hashPassword('admin123'),
      role: 'admin',
      district: 'Sambalpur',
      village: 'Sambalpur HQ',
      businessName: 'FreshKart Agro Connect',
      accountStatus: 'active',
      isDemo: true,
      createdAt: '2026-10-01T06:00:00.000Z',
    },
  ];

  const products: Product[] = [
    {
      id: 'prod-1',
      farmerId: 'usr-farmer-1',
      name: 'Tomato',
      category: 'Vegetables',
      image: IMG.tomato,
      availableQuantity: 500,
      unit: 'Kg',
      expectedPrice: 20,
      harvestDate: '2026-11-18',
      availabilityStatus: 'Available',
      approvalStatus: 'Approved',
      village: 'Attabira',
      district: 'Bargarh',
      description:
        'Firm, naturally ripened local desi tomatoes harvested early morning. Ideal for retail shops, hotels, and bulk kitchen supply.',
      isDemo: true,
      createdAt: '2026-11-18T06:00:00.000Z',
    },
    {
      id: 'prod-2',
      farmerId: 'usr-farmer-2',
      name: 'Potato',
      category: 'Vegetables',
      image: IMG.potato,
      availableQuantity: 800,
      unit: 'Kg',
      expectedPrice: 25,
      harvestDate: '2026-11-16',
      availabilityStatus: 'Available',
      approvalStatus: 'Approved',
      village: 'Burla',
      district: 'Sambalpur',
      description:
        'Clean, medium-sized golden farm potatoes packed in 50 kg breathable gunny sacks. Ready for farm-gate pickup or local delivery.',
      isDemo: true,
      createdAt: '2026-11-17T07:20:00.000Z',
    },
    {
      id: 'prod-3',
      farmerId: 'usr-farmer-1',
      name: 'Onion',
      category: 'Vegetables',
      image: IMG.onion,
      availableQuantity: 400,
      unit: 'Kg',
      expectedPrice: 30,
      harvestDate: '2026-11-14',
      availabilityStatus: 'Available',
      approvalStatus: 'Approved',
      village: 'Attabira',
      district: 'Bargarh',
      description:
        'Well-cured deep red onions with strong aroma and long shelf life. Sorted by size for grocery retailers and restaurants.',
      isDemo: true,
      createdAt: '2026-11-16T09:10:00.000Z',
    },
    {
      id: 'prod-4',
      farmerId: 'usr-farmer-2',
      name: 'Green Chilli',
      category: 'Vegetables',
      image: IMG.greenChilli,
      availableQuantity: 200,
      unit: 'Kg',
      expectedPrice: 45,
      harvestDate: '2026-11-19',
      availabilityStatus: 'Available',
      approvalStatus: 'Approved',
      village: 'Burla',
      district: 'Sambalpur',
      description:
        'Crisp, high-pungency green chillies picked fresh today. Available in 10 kg and 25 kg crates for daily vegetable buyers.',
      isDemo: true,
      createdAt: '2026-11-19T05:45:00.000Z',
    },
    {
      id: 'prod-5',
      farmerId: 'usr-farmer-3',
      name: 'Cauliflower',
      category: 'Vegetables',
      image: IMG.cauliflower,
      availableQuantity: 300,
      unit: 'Kg',
      expectedPrice: 30,
      harvestDate: '2026-11-18',
      availabilityStatus: 'Available',
      approvalStatus: 'Approved',
      village: 'Sohela',
      district: 'Bargarh',
      description:
        'Compact, bright creamy-white winter cauliflowers wrapped in protective green outer leaves for safe transport.',
      isDemo: true,
      createdAt: '2026-11-18T08:00:00.000Z',
    },
    {
      id: 'prod-6',
      farmerId: 'usr-farmer-2',
      name: 'Brinjal',
      category: 'Vegetables',
      image: IMG.brinjal,
      availableQuantity: 250,
      unit: 'Kg',
      expectedPrice: 25,
      harvestDate: '2026-11-18',
      availabilityStatus: 'Available',
      approvalStatus: 'Approved',
      village: 'Burla',
      district: 'Sambalpur',
      description:
        'Glossy purple Western Odisha brinjals with tender flesh and minimal seeds. Sorted clean at the farm.',
      isDemo: true,
      createdAt: '2026-11-18T10:30:00.000Z',
    },
    {
      id: 'prod-7',
      farmerId: 'usr-farmer-3',
      name: 'Cabbage',
      category: 'Vegetables',
      image: IMG.cabbage,
      availableQuantity: 350,
      unit: 'Kg',
      expectedPrice: 20,
      harvestDate: '2026-11-17',
      availabilityStatus: 'Available',
      approvalStatus: 'Approved',
      village: 'Sohela',
      district: 'Bargarh',
      description:
        'Tight, crunchy green cabbages grown with organic compost. Suitable for hotels, caterers, and daily grocery stalls.',
      isDemo: true,
      createdAt: '2026-11-17T11:15:00.000Z',
    },
    {
      id: 'prod-8',
      farmerId: 'usr-farmer-1',
      name: 'Rice',
      category: 'Grains',
      image: IMG.rice,
      availableQuantity: 1000,
      unit: 'Kg',
      expectedPrice: 35,
      harvestDate: '2026-11-10',
      availabilityStatus: 'Available',
      approvalStatus: 'Approved',
      village: 'Attabira',
      district: 'Bargarh',
      description:
        'Premium Bargarh Swarna raw rice milled from fresh paddy harvest. Clean, stone-free grains packed in 25 kg or 50 kg bags.',
      isDemo: true,
      createdAt: '2026-11-15T06:30:00.000Z',
    },
    {
      id: 'prod-9',
      farmerId: 'usr-farmer-2',
      name: 'Mango',
      category: 'Fruits',
      image: IMG.mango,
      availableQuantity: 150,
      unit: 'Kg',
      expectedPrice: 60,
      harvestDate: '2026-11-17',
      availabilityStatus: 'Limited Stock',
      approvalStatus: 'Approved',
      village: 'Burla',
      district: 'Sambalpur',
      description:
        'Sweet orchard-grown Amrapali seasonal lot, carbide-free natural ripening, hand-graded for retail fruit shops and households.',
      isDemo: true,
      createdAt: '2026-11-17T14:00:00.000Z',
    },
    {
      id: 'prod-10',
      farmerId: 'usr-farmer-1',
      name: 'Banana',
      category: 'Fruits',
      image: IMG.banana,
      availableQuantity: 200,
      unit: 'Kg',
      expectedPrice: 40,
      harvestDate: '2026-11-18',
      availabilityStatus: 'Available',
      approvalStatus: 'Approved',
      village: 'Attabira',
      district: 'Bargarh',
      description:
        'Farm-harvested Champa and Bantala banana bunches cut directly from our family orchard. Clean skin and sweet flavour.',
      isDemo: true,
      createdAt: '2026-11-18T12:00:00.000Z',
    },
    {
      id: 'prod-11',
      farmerId: 'usr-farmer-3',
      name: 'Fresh Green Cabbage (Bulk Lot)',
      category: 'Vegetables',
      image: IMG.cabbage,
      availableQuantity: 4,
      unit: 'Quintal',
      expectedPrice: 1900,
      harvestDate: '2026-11-19',
      availabilityStatus: 'Available',
      approvalStatus: 'Pending',
      village: 'Sohela',
      district: 'Bargarh',
      description:
        'Second winter harvest lot awaiting quick marketplace approval for wholesale buyers in Bargarh and Sambalpur.',
      isDemo: true,
      createdAt: '2026-11-19T03:00:00.000Z',
    },
  ];

  const buyerRequirements: BuyerRequirement[] = [
    {
      id: 'req-1',
      buyerId: 'usr-buyer-1',
      businessName: 'Sharma Grocery Store',
      productName: 'Tomato',
      category: 'Vegetables',
      requiredQuantity: 200,
      unit: 'Kg',
      maxBudgetPerUnit: 22,
      deliveryLocation: 'Bargarh Main Market',
      district: 'Bargarh',
      requiredDeliveryDate: '2026-11-22',
      contactNumber: '+91 98611 45290',
      notes: 'Looking for firm red tomatoes harvested within 24 hours. Morning drop-off preferred.',
      status: 'Open',
      isDemo: true,
      createdAt: '2026-11-18T09:00:00.000Z',
    },
    {
      id: 'req-2',
      buyerId: 'usr-buyer-2',
      businessName: 'Mahanadi Spice Restaurant',
      productName: 'Potato',
      category: 'Vegetables',
      requiredQuantity: 150,
      unit: 'Kg',
      maxBudgetPerUnit: 27,
      deliveryLocation: 'Ainthapali, Sambalpur',
      district: 'Sambalpur',
      requiredDeliveryDate: '2026-11-23',
      contactNumber: '+91 98612 77341',
      notes: 'Regular weekly kitchen requirement. Clean medium potatoes preferred.',
      status: 'Open',
      isDemo: true,
      createdAt: '2026-11-18T11:20:00.000Z',
    },
    {
      id: 'req-3',
      buyerId: 'usr-buyer-2',
      businessName: 'Mahanadi Spice Restaurant',
      productName: 'Green Chilli',
      category: 'Vegetables',
      requiredQuantity: 40,
      unit: 'Kg',
      maxBudgetPerUnit: 48,
      deliveryLocation: 'Ainthapali, Sambalpur',
      district: 'Sambalpur',
      requiredDeliveryDate: '2026-11-21',
      contactNumber: '+91 98612 77341',
      notes: 'Fresh green chillies needed for weekend catering orders.',
      status: 'Open',
      isDemo: true,
      createdAt: '2026-11-18T13:00:00.000Z',
    },
    {
      id: 'req-4',
      buyerId: 'usr-buyer-1',
      businessName: 'Sharma Grocery Store',
      productName: 'Rice',
      category: 'Grains',
      requiredQuantity: 300,
      unit: 'Kg',
      maxBudgetPerUnit: 38,
      deliveryLocation: 'Bargarh Main Road',
      district: 'Bargarh',
      requiredDeliveryDate: '2026-11-25',
      contactNumber: '+91 98611 45290',
      notes: 'Need 25 kg bags of local Bargarh raw rice for retail counter.',
      status: 'Open',
      isDemo: true,
      createdAt: '2026-11-18T15:10:00.000Z',
    },
    {
      id: 'req-5',
      buyerId: 'usr-buyer-3',
      businessName: 'Dash Agro Traders',
      productName: 'Onion',
      category: 'Vegetables',
      requiredQuantity: 250,
      unit: 'Kg',
      maxBudgetPerUnit: 32,
      deliveryLocation: 'Khetrajpur, Sambalpur',
      district: 'Sambalpur',
      requiredDeliveryDate: '2026-11-24',
      contactNumber: '+91 98614 33018',
      notes: 'Dry red onions in 50 kg mesh bags. Direct settlement on weighing.',
      status: 'Open',
      isDemo: true,
      createdAt: '2026-11-18T16:40:00.000Z',
    },
  ];

  const enquiries: Enquiry[] = [
    {
      id: 'enq-101',
      buyerId: 'usr-buyer-1',
      farmerId: 'usr-farmer-1',
      productId: 'prod-1',
      buyerName: 'Prakash Sharma (Sharma Grocery Store)',
      buyerBusiness: 'Sharma Grocery Store',
      buyerMobile: '+91 98611 45290',
      farmerName: 'Ramesh Sahu',
      farmerMobile: '+91 94371 20451',
      productName: 'Tomato',
      requiredQuantity: 200,
      unit: 'Kg',
      expectedPrice: 20,
      deliveryLocation: 'Bargarh Main Market',
      preferredPurchaseDate: '2026-11-21',
      message: 'Can pick up 200 kg tomorrow morning by 7 AM directly from Attabira.',
      status: 'Pending',
      isDemo: true,
      createdAt: '2026-11-18T17:15:00.000Z',
    },
    {
      id: 'enq-102',
      buyerId: 'usr-buyer-2',
      farmerId: 'usr-farmer-2',
      productId: 'prod-2',
      buyerName: 'Ananya Patel (Mahanadi Spice Restaurant)',
      buyerBusiness: 'Mahanadi Spice Restaurant',
      buyerMobile: '+91 98612 77341',
      farmerName: 'Savitri Meher',
      farmerMobile: '+91 94372 88319',
      productName: 'Potato',
      requiredQuantity: 150,
      unit: 'Kg',
      expectedPrice: 24,
      deliveryLocation: 'Ainthapali, Sambalpur',
      preferredPurchaseDate: '2026-11-20',
      message: 'Need 3 bags of 50 kg clean potatoes. Please confirm on WhatsApp.',
      status: 'Accepted',
      isDemo: true,
      createdAt: '2026-11-17T14:20:00.000Z',
    },
  ];

  const orders: Order[] = [
    {
      id: 'ORD-2026-101',
      enquiryId: 'enq-102',
      farmerId: 'usr-farmer-2',
      buyerId: 'usr-buyer-2',
      productId: 'prod-2',
      farmerName: 'Savitri Meher',
      farmerMobile: '+91 94372 88319',
      farmerLocation: 'Burla, Sambalpur',
      buyerName: 'Ananya Patel',
      buyerBusiness: 'Mahanadi Spice Restaurant',
      buyerMobile: '+91 98612 77341',
      buyerLocation: 'Ainthapali, Sambalpur',
      productName: 'Potato',
      quantity: 150,
      unit: 'Kg',
      agreedPrice: 24,
      totalValue: 3600,
      status: 'Confirmed',
      orderDate: '2026-11-17T16:00:00.000Z',
      notes: 'Direct farm coordination via WhatsApp. Payment on delivery.',
      isDemo: true,
    },
    {
      id: 'ORD-2026-102',
      farmerId: 'usr-farmer-1',
      buyerId: 'usr-buyer-1',
      productId: 'prod-8',
      farmerName: 'Ramesh Sahu',
      farmerMobile: '+91 94371 20451',
      farmerLocation: 'Attabira, Bargarh',
      buyerName: 'Prakash Sharma',
      buyerBusiness: 'Sharma Grocery Store',
      buyerMobile: '+91 98611 45290',
      buyerLocation: 'Bargarh Main Road',
      productName: 'Rice',
      quantity: 250,
      unit: 'Kg',
      agreedPrice: 35,
      totalValue: 8750,
      status: 'Completed',
      orderDate: '2026-11-14T09:30:00.000Z',
      notes: '10 bags of 25 kg delivered to Bargarh Main Road shop. Settled directly.',
      isDemo: true,
    },
    {
      id: 'ORD-2026-103',
      farmerId: 'usr-farmer-1',
      buyerId: 'usr-buyer-3',
      productId: 'prod-3',
      farmerName: 'Ramesh Sahu',
      farmerMobile: '+91 94371 20451',
      farmerLocation: 'Attabira, Bargarh',
      buyerName: 'Debashis Dash',
      buyerBusiness: 'Dash Agro Traders',
      buyerMobile: '+91 98614 33018',
      buyerLocation: 'Khetrajpur, Sambalpur',
      productName: 'Onion',
      quantity: 200,
      unit: 'Kg',
      agreedPrice: 29,
      totalValue: 5800,
      status: 'Negotiation in Progress',
      orderDate: '2026-11-18T12:10:00.000Z',
      notes: 'Discussing transport sharing between Attabira and Sambalpur.',
      isDemo: true,
    },
  ];

  return {
    version: 1,
    users,
    products,
    buyerRequirements,
    enquiries,
    orders,
  };
}

let cachedDb: DatabaseSchema | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadDb(): DatabaseSchema {
  if (cachedDb) return cachedDb;
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.products)) {
        cachedDb = parsed;
        return cachedDb;
      }
    } catch (err) {
      console.error('Failed to read database file, re-initializing seed:', err);
    }
  }
  cachedDb = buildInitialSeed();
  saveDb(cachedDb);
  return cachedDb;
}

export function saveDb(db: DatabaseSchema): void {
  ensureDataDir();
  cachedDb = db;
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

export function enrichProduct(db: DatabaseSchema, product: Product): Product {
  const farmer = db.users.find((u) => u.id === product.farmerId);
  return {
    ...product,
    farmerName: farmer?.fullName || product.farmerName || 'Registered Farmer',
    farmerMobile: farmer?.mobile || product.farmerMobile || '',
  };
}

export function enrichRequirement(
  db: DatabaseSchema,
  req: BuyerRequirement
): BuyerRequirement {
  const buyer = db.users.find((u) => u.id === req.buyerId);
  return {
    ...req,
    buyerName: buyer?.fullName || req.buyerName || req.businessName,
    buyerCategory: buyer?.buyerCategory || req.buyerCategory,
  };
}

export function enrichEnquiry(db: DatabaseSchema, enquiry: Enquiry): Enquiry {
  const buyer = db.users.find((u) => u.id === enquiry.buyerId);
  const farmer = db.users.find((u) => u.id === enquiry.farmerId);
  return {
    ...enquiry,
    buyerMobile: buyer?.mobile || enquiry.buyerMobile || '',
    farmerMobile: farmer?.mobile || enquiry.farmerMobile || '',
    farmerName: farmer?.fullName || enquiry.farmerName || 'Registered Farmer',
  };
}

export function enrichOrder(db: DatabaseSchema, order: Order): Order {
  const farmer = db.users.find((u) => u.id === order.farmerId);
  const buyer = db.users.find((u) => u.id === order.buyerId);
  return {
    ...order,
    farmerName: farmer?.fullName || order.farmerName,
    farmerMobile: farmer?.mobile || order.farmerMobile,
    buyerName: buyer?.fullName || order.buyerName,
    buyerMobile: buyer?.mobile || order.buyerMobile,
  };
}

export function getNextOrderId(orders: Order[]): string {
  let maxNum = 100;
  for (const o of orders) {
    const match = /ORD-\d{4}-(\d+)/.exec(o.id);
    if (match) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }
  return `ORD-2026-${maxNum + 1}`;
}

