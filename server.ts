import crypto from 'node:crypto';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import {
  createAuthMiddleware,
  hashPassword,
  signToken,
  toPublicUser,
  verifyPassword,
  type AuthedRequest,
} from './server/auth';
import {
  enrichEnquiry,
  enrichOrder,
  enrichProduct,
  enrichRequirement,
  getNextOrderId,
  loadDb,
  saveDb,
} from './server/db';
import { findMatches } from './src/utils/matching';
import { formatIndianPhone, isValidIndianPhone } from './src/utils/whatsapp';
import {
  ORDER_STATUSES,
  PRODUCT_CATEGORIES,
  type ApprovalStatus,
  type AvailabilityStatus,
  type BuyerCategory,
  type BuyerRequirement,
  type Enquiry,
  type Order,
  type OrderStatus,
  type Product,
  type ProductCategory,
  type QuantityUnit,
  type UserRole,
} from './src/types';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // Initialize persistent database on boot
  loadDb();

  const { attachOptionalUser, requireAuth, requireRole } = createAuthMiddleware((userId) => {
    const db = loadDb();
    return db.users.find((u) => u.id === userId);
  });

  // =========================================================================
  // AUTHENTICATION ROUTES
  // =========================================================================

  app.post('/api/auth/register', (req, res) => {
    const db = loadDb();
    const {
      fullName,
      mobile,
      email,
      password,
      role,
      district,
      village,
      businessName,
      buyerCategory,
      farmingDetails,
    } = req.body || {};

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
    }
    if (!mobile || !isValidIndianPhone(String(mobile))) {
      return res
        .status(400)
        .json({ error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9861145290).' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    if (role !== 'farmer' && role !== 'buyer') {
      return res.status(400).json({ error: 'Please choose either Farmer or Buyer account role.' });
    }
    if (!district || typeof district !== 'string') {
      return res.status(400).json({ error: 'Please select your district in Western Odisha.' });
    }
    if (!village || typeof village !== 'string' || village.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter your village or town location.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res
        .status(409)
        .json({ error: 'An account with this email already exists. Please log in instead.' });
    }

    const newUser = {
      id: `usr-${role}-${crypto.randomUUID().slice(0, 8)}`,
      fullName: fullName.trim(),
      mobile: formatIndianPhone(String(mobile).trim()),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: role as UserRole,
      district: district.trim(),
      village: village.trim(),
      businessName: businessName ? String(businessName).trim() : undefined,
      buyerCategory: role === 'buyer' ? ((buyerCategory as BuyerCategory) || 'Grocery Store') : undefined,
      farmingDetails: role === 'farmer' && farmingDetails ? String(farmingDetails).trim() : undefined,
      accountStatus: 'active' as const,
      isDemo: false,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb(db);

    const token = signToken(newUser.id, newUser.role);
    return res.status(201).json({ token, user: toPublicUser(newUser) });
  });

  app.post('/api/auth/login', (req, res) => {
    const db = loadDb();
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        error: 'This account has been suspended by an administrator.',
      });
    }
    const token = signToken(user.id, user.role);
    return res.json({ token, user: toPublicUser(user) });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    return res.json({ user: req.authUser });
  });

  app.patch('/api/auth/profile', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const user = db.users.find((u) => u.id === req.authUser!.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { fullName, mobile, district, village, businessName, buyerCategory, farmingDetails } =
      req.body || {};

    if (fullName !== undefined) {
      if (String(fullName).trim().length < 2) {
        return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
      }
      user.fullName = String(fullName).trim();
    }
    if (mobile !== undefined) {
      if (!isValidIndianPhone(String(mobile))) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
      }
      user.mobile = formatIndianPhone(String(mobile).trim());
    }
    if (district !== undefined && String(district).trim().length >= 2) {
      user.district = String(district).trim();
    }
    if (village !== undefined) {
      if (String(village).trim().length < 2) {
        return res.status(400).json({ error: 'Village or town location must be at least 2 characters.' });
      }
      user.village = String(village).trim();
    }
    if (businessName !== undefined) user.businessName = String(businessName).trim() || undefined;
    if (buyerCategory && user.role === 'buyer') user.buyerCategory = buyerCategory;
    if (farmingDetails !== undefined && user.role === 'farmer') {
      user.farmingDetails = String(farmingDetails).trim() || undefined;
    }

    saveDb(db);
    return res.json({ user: toPublicUser(user) });
  });

  // =========================================================================
  // PRODUCTS ROUTES
  // =========================================================================

  app.get('/api/products', attachOptionalUser, (req: AuthedRequest, res) => {
    const db = loadDb();
    const { mine, includeAll } = req.query;

    let list = db.products.map((p) => enrichProduct(db, p));

    if (mine === 'true') {
      if (!req.authUser) {
        return res.status(401).json({ error: 'Login required to view your products.' });
      }
      list = list.filter((p) => p.farmerId === req.authUser!.id);
    } else if (includeAll === 'true' && req.authUser?.role === 'admin') {
      // Admin sees pending/approved/rejected
    } else {
      // Public marketplace only shows approved products
      list = list.filter((p) => p.approvalStatus === 'Approved');
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ products: list });
  });

  app.get('/api/products/:id', attachOptionalUser, (req: AuthedRequest, res) => {
    const db = loadDb();
    const found = db.products.find((p) => p.id === req.params.id);
    if (!found) return res.status(404).json({ error: 'Product not found.' });

    const isOwnerOrAdmin =
      req.authUser && (req.authUser.role === 'admin' || req.authUser.id === found.farmerId);
    if (found.approvalStatus !== 'Approved' && !isOwnerOrAdmin) {
      return res.status(404).json({ error: 'Product is not publicly available.' });
    }
    return res.json({ product: enrichProduct(db, found) });
  });

  app.post('/api/products', requireAuth, requireRole('farmer', 'admin'), (req: AuthedRequest, res) => {
    const db = loadDb();
    const {
      name,
      category,
      image,
      availableQuantity,
      unit,
      expectedPrice,
      harvestDate,
      availabilityStatus,
      village,
      district,
      description,
    } = req.body || {};

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Product name is required.' });
    }
    if (!PRODUCT_CATEGORIES.includes(category as ProductCategory)) {
      return res.status(400).json({ error: 'Please select a valid product category.' });
    }
    const qty = Number(availableQuantity);
    const price = Number(expectedPrice);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Available quantity must be greater than zero.' });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: 'Expected price per unit must be greater than zero.' });
    }
    const validUnit: QuantityUnit = unit === 'Quintal' ? 'Quintal' : 'Kg';
    const validAvailability: AvailabilityStatus =
      availabilityStatus === 'Limited Stock' || availabilityStatus === 'Out of Stock'
        ? availabilityStatus
        : 'Available';

    const newProduct: Product = {
      id: `prod-${crypto.randomUUID().slice(0, 8)}`,
      farmerId: req.authUser!.id,
      name: String(name).trim(),
      category: category as ProductCategory,
      image:
        typeof image === 'string' && image.trim().length > 0
          ? image.trim()
          : '/src/assets/images/produce_tomato_1795091214056.jpg',
      availableQuantity: qty,
      unit: validUnit,
      expectedPrice: price,
      harvestDate: harvestDate ? String(harvestDate) : new Date().toISOString().slice(0, 10),
      availabilityStatus: validAvailability,
      approvalStatus: 'Approved', // Auto-approved in MVP pilot so farmers can immediately test discovery; Admin can still moderate/reject
      village: village ? String(village).trim() : req.authUser!.village,
      district: district ? String(district).trim() : req.authUser!.district,
      description: description ? String(description).trim() : '',
      isDemo: false,
      createdAt: new Date().toISOString(),
    };

    db.products.unshift(newProduct);
    saveDb(db);
    return res.status(201).json({ product: enrichProduct(db, newProduct) });
  });

  app.put('/api/products/:id', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    if (product.farmerId !== req.authUser!.id && req.authUser!.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own product listings.' });
    }

    const {
      name,
      category,
      image,
      availableQuantity,
      unit,
      expectedPrice,
      harvestDate,
      availabilityStatus,
      village,
      district,
      description,
    } = req.body || {};

    if (name !== undefined) {
      if (String(name).trim().length < 2) {
        return res.status(400).json({ error: 'Product name must be at least 2 characters.' });
      }
      product.name = String(name).trim();
    }
    if (category && PRODUCT_CATEGORIES.includes(category)) product.category = category;
    if (typeof image === 'string' && image.trim()) product.image = image.trim();
    if (availableQuantity !== undefined) {
      const qty = Number(availableQuantity);
      if (!Number.isFinite(qty) || qty < 0) {
        return res.status(400).json({ error: 'Quantity must be a valid non-negative number.' });
      }
      product.availableQuantity = qty;
      if (qty === 0) {
        product.availabilityStatus = 'Out of Stock';
      }
    }
    if (unit === 'Kg' || unit === 'Quintal') product.unit = unit;
    if (expectedPrice !== undefined) {
      const price = Number(expectedPrice);
      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({ error: 'Price must be greater than zero.' });
      }
      product.expectedPrice = price;
    }
    if (harvestDate) product.harvestDate = String(harvestDate);
    if (
      availabilityStatus === 'Available' ||
      availabilityStatus === 'Limited Stock' ||
      availabilityStatus === 'Out of Stock'
    ) {
      product.availabilityStatus = product.availableQuantity === 0 ? 'Out of Stock' : availabilityStatus;
    }
    if (village !== undefined) {
      if (String(village).trim().length < 2) {
        return res.status(400).json({ error: 'Village name must be at least 2 characters.' });
      }
      product.village = String(village).trim();
    }
    if (district !== undefined && String(district).trim().length >= 2) {
      product.district = String(district).trim();
    }
    if (description !== undefined) product.description = String(description).trim();

    saveDb(db);
    return res.json({ product: enrichProduct(db, product) });
  });

  app.delete('/api/products/:id', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const index = db.products.findIndex((p) => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Product not found.' });

    const product = db.products[index];
    if (product.farmerId !== req.authUser!.id && req.authUser!.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own product listings.' });
    }

    db.products.splice(index, 1);
    saveDb(db);
    return res.json({ deleted: true, id: product.id });
  });

  // =========================================================================
  // BUYER REQUIREMENTS ROUTES
  // =========================================================================

  app.get('/api/requirements', attachOptionalUser, (req: AuthedRequest, res) => {
    const db = loadDb();
    const { mine } = req.query;
    let list = db.buyerRequirements.map((r) => enrichRequirement(db, r));

    if (mine === 'true') {
      if (!req.authUser) return res.status(401).json({ error: 'Login required.' });
      list = list.filter((r) => r.buyerId === req.authUser!.id);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ requirements: list });
  });

  app.post(
    '/api/requirements',
    requireAuth,
    requireRole('buyer', 'admin'),
    (req: AuthedRequest, res) => {
      const db = loadDb();
      const {
        businessName,
        productName,
        category,
        requiredQuantity,
        unit,
        maxBudgetPerUnit,
        deliveryLocation,
        district,
        requiredDeliveryDate,
        contactNumber,
        notes,
      } = req.body || {};

      if (!productName || String(productName).trim().length < 2) {
        return res.status(400).json({ error: 'Please specify the agricultural product required.' });
      }
      const qty = Number(requiredQuantity);
      const budget = Number(maxBudgetPerUnit);
      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({ error: 'Required quantity must be greater than zero.' });
      }
      if (!Number.isFinite(budget) || budget <= 0) {
        return res.status(400).json({ error: 'Maximum budget per unit must be greater than zero.' });
      }
      const phone = contactNumber ? String(contactNumber).trim() : req.authUser!.mobile;
      if (!isValidIndianPhone(phone)) {
        return res.status(400).json({ error: 'Please provide a valid 10-digit Indian mobile number.' });
      }

      const newReq: BuyerRequirement = {
        id: `req-${crypto.randomUUID().slice(0, 8)}`,
        buyerId: req.authUser!.id,
        businessName:
          (businessName && String(businessName).trim()) ||
          req.authUser!.businessName ||
          req.authUser!.fullName,
        productName: String(productName).trim(),
        category: PRODUCT_CATEGORIES.includes(category) ? category : 'Vegetables',
        requiredQuantity: qty,
        unit: unit === 'Quintal' ? 'Quintal' : 'Kg',
        maxBudgetPerUnit: budget,
        deliveryLocation: deliveryLocation
          ? String(deliveryLocation).trim()
          : `${req.authUser!.village}, ${req.authUser!.district}`,
        district: district ? String(district).trim() : req.authUser!.district,
        requiredDeliveryDate:
          requiredDeliveryDate || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        contactNumber: formatIndianPhone(phone),
        notes: notes ? String(notes).trim() : '',
        status: 'Open',
        isDemo: false,
        createdAt: new Date().toISOString(),
      };

      db.buyerRequirements.unshift(newReq);
      saveDb(db);
      return res.status(201).json({ requirement: enrichRequirement(db, newReq) });
    }
  );

  app.patch('/api/requirements/:id', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const item = db.buyerRequirements.find((r) => r.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Requirement not found.' });
    if (item.buyerId !== req.authUser!.id && req.authUser!.role !== 'admin') {
      return res.status(403).json({ error: 'You can only update your own requirements.' });
    }
    const { status } = req.body || {};
    if (status === 'Open' || status === 'Fulfilled' || status === 'Closed') {
      item.status = status;
    }
    saveDb(db);
    return res.json({ requirement: enrichRequirement(db, item) });
  });

  app.delete('/api/requirements/:id', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const idx = db.buyerRequirements.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Requirement not found.' });
    if (db.buyerRequirements[idx].buyerId !== req.authUser!.id && req.authUser!.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own requirements.' });
    }
    const [removed] = db.buyerRequirements.splice(idx, 1);
    saveDb(db);
    return res.json({ deleted: true, id: removed.id });
  });

  // =========================================================================
  // ENQUIRIES ROUTES
  // =========================================================================

  app.get('/api/enquiries', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    let list = db.enquiries.map((e) => enrichEnquiry(db, e));
    if (req.authUser!.role === 'farmer') {
      list = list.filter((e) => e.farmerId === req.authUser!.id);
    } else if (req.authUser!.role === 'buyer') {
      list = list.filter((e) => e.buyerId === req.authUser!.id);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ enquiries: list });
  });

  app.post('/api/enquiries', requireAuth, requireRole('buyer', 'admin'), (req: AuthedRequest, res) => {
    const db = loadDb();
    const {
      productId,
      buyerName,
      requiredQuantity,
      expectedPrice,
      deliveryLocation,
      preferredPurchaseDate,
      message,
    } = req.body || {};

    const product = db.products.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Selected product was not found.' });
    }
    if (product.approvalStatus !== 'Approved') {
      return res
        .status(400)
        .json({ error: 'This product listing is not yet approved for purchase enquiries.' });
    }
    if (product.availabilityStatus === 'Out of Stock' || product.availableQuantity <= 0) {
      return res.status(400).json({ error: 'This product is currently out of stock.' });
    }
    const farmer = db.users.find((u) => u.id === product.farmerId);
    const qty = Number(requiredQuantity);
    const price = Number(expectedPrice);

    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Required quantity must be greater than zero.' });
    }
    if (qty > product.availableQuantity) {
      return res.status(400).json({
        error: `Requested quantity (${qty} ${product.unit}) exceeds available stock (${product.availableQuantity} ${product.unit}).`,
      });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: 'Expected price must be greater than zero.' });
    }
    if (!deliveryLocation || String(deliveryLocation).trim().length < 2) {
      return res.status(400).json({ error: 'Delivery location is required.' });
    }

    const nowIso = new Date().toISOString();
    const newEnquiry: Enquiry = {
      id: `enq-${crypto.randomUUID().slice(0, 6)}`,
      buyerId: req.authUser!.id,
      farmerId: product.farmerId,
      productId: product.id,
      buyerName:
        (buyerName && String(buyerName).trim()) ||
        (req.authUser!.businessName
          ? `${req.authUser!.fullName} (${req.authUser!.businessName})`
          : req.authUser!.fullName),
      buyerBusiness: req.authUser!.businessName,
      buyerMobile: req.authUser!.mobile,
      farmerName: farmer?.fullName || 'Registered Farmer',
      farmerMobile: farmer?.mobile || '',
      productName: product.name,
      requiredQuantity: qty,
      unit: product.unit,
      expectedPrice: price,
      deliveryLocation: String(deliveryLocation).trim(),
      preferredPurchaseDate:
        preferredPurchaseDate || new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      message: message ? String(message).trim() : '',
      status: 'Pending',
      isDemo: false,
      createdAt: nowIso,
    };

    db.enquiries.unshift(newEnquiry);

    // Create initial order tracking record in 'Enquiry Received' stage
    const initialOrder: Order = {
      id: getNextOrderId(db.orders),
      enquiryId: newEnquiry.id,
      farmerId: product.farmerId,
      buyerId: req.authUser!.id,
      productId: product.id,
      farmerName: farmer?.fullName || 'Registered Farmer',
      farmerMobile: farmer?.mobile || '',
      farmerLocation: farmer ? `${farmer.village}, ${farmer.district}` : `${product.village}, ${product.district}`,
      buyerName: req.authUser!.fullName,
      buyerBusiness: req.authUser!.businessName,
      buyerMobile: req.authUser!.mobile,
      buyerLocation: newEnquiry.deliveryLocation,
      productName: product.name,
      quantity: qty,
      unit: product.unit,
      agreedPrice: price,
      totalValue: qty * price,
      status: 'Enquiry Received',
      orderDate: nowIso,
      notes: newEnquiry.message || 'Initial purchase enquiry submitted. Awaiting farmer response.',
      isDemo: false,
    };
    db.orders.unshift(initialOrder);

    saveDb(db);
    return res.status(201).json({ enquiry: newEnquiry, order: initialOrder });
  });

  app.patch('/api/enquiries/:id', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const enquiry = db.enquiries.find((e) => e.id === req.params.id);
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found.' });

    if (enquiry.farmerId !== req.authUser!.id && req.authUser!.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Only the product owner farmer or an admin can respond to this enquiry.' });
    }

    const { status } = req.body || {};
    if (status !== 'Accepted' && status !== 'Rejected' && status !== 'Pending') {
      return res.status(400).json({ error: 'Invalid enquiry status.' });
    }

    enquiry.status = status;
    let linkedOrder: Order | null = db.orders.find((o) => o.enquiryId === enquiry.id) || null;

    if (status === 'Accepted') {
      if (linkedOrder) {
        if (
          linkedOrder.status === 'Enquiry Received' ||
          linkedOrder.status === 'Negotiation in Progress' ||
          linkedOrder.status === 'Cancelled'
        ) {
          linkedOrder.status = 'Accepted';
        }
      } else {
        const farmer = db.users.find((u) => u.id === enquiry.farmerId);
        const buyer = db.users.find((u) => u.id === enquiry.buyerId);
        linkedOrder = {
          id: getNextOrderId(db.orders),
          enquiryId: enquiry.id,
          farmerId: enquiry.farmerId,
          buyerId: enquiry.buyerId,
          productId: enquiry.productId,
          farmerName: farmer?.fullName || enquiry.farmerName || 'Farmer',
          farmerMobile: farmer?.mobile || enquiry.farmerMobile || '',
          farmerLocation: farmer ? `${farmer.village}, ${farmer.district}` : 'Western Odisha',
          buyerName: buyer?.fullName || enquiry.buyerName,
          buyerBusiness: buyer?.businessName || enquiry.buyerBusiness,
          buyerMobile: buyer?.mobile || enquiry.buyerMobile || '',
          buyerLocation: enquiry.deliveryLocation,
          productName: enquiry.productName,
          quantity: enquiry.requiredQuantity,
          unit: enquiry.unit,
          agreedPrice: enquiry.expectedPrice,
          totalValue: enquiry.requiredQuantity * enquiry.expectedPrice,
          status: 'Accepted',
          orderDate: new Date().toISOString(),
          notes:
            enquiry.message ||
            'Created from accepted buyer enquiry. Coordinate pickup/delivery directly.',
          isDemo: false,
        };
        db.orders.unshift(linkedOrder);
      }
    } else if (status === 'Rejected' && linkedOrder) {
      linkedOrder.status = 'Cancelled';
    }

    saveDb(db);
    return res.json({
      enquiry: enrichEnquiry(db, enquiry),
      order: linkedOrder ? enrichOrder(db, linkedOrder) : null,
    });
  });

  // =========================================================================
  // ORDERS ROUTES
  // =========================================================================

  app.get('/api/orders', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    let list = db.orders.map((o) => enrichOrder(db, o));
    if (req.authUser!.role === 'farmer') {
      list = list.filter((o) => o.farmerId === req.authUser!.id);
    } else if (req.authUser!.role === 'buyer') {
      list = list.filter((o) => o.buyerId === req.authUser!.id);
    }
    list.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    return res.json({ orders: list });
  });

  app.patch('/api/orders/:id', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const isParticipant =
      order.farmerId === req.authUser!.id ||
      order.buyerId === req.authUser!.id ||
      req.authUser!.role === 'admin';
    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not authorized to update this order.' });
    }

    const { status, agreedPrice, notes } = req.body || {};
    if (status !== undefined) {
      if (!ORDER_STATUSES.includes(status as OrderStatus)) {
        return res.status(400).json({ error: 'Invalid order status.' });
      }
      order.status = status as OrderStatus;

      // Keep linked enquiry synchronized when order status advances or is cancelled
      if (order.enquiryId) {
        const linkedEnquiry = db.enquiries.find((e) => e.id === order.enquiryId);
        if (linkedEnquiry && linkedEnquiry.status === 'Pending') {
          if (
            order.status === 'Accepted' ||
            order.status === 'Confirmed' ||
            order.status === 'Completed'
          ) {
            linkedEnquiry.status = 'Accepted';
          } else if (order.status === 'Cancelled') {
            linkedEnquiry.status = 'Rejected';
          }
        }
      }
    }
    if (agreedPrice !== undefined) {
      const price = Number(agreedPrice);
      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({ error: 'Agreed price must be greater than zero.' });
      }
      order.agreedPrice = price;
      order.totalValue = price * order.quantity;
    }
    if (notes !== undefined) {
      order.notes = String(notes).trim();
    }

    saveDb(db);
    return res.json({ order: enrichOrder(db, order) });
  });

  // =========================================================================
  // RULE-BASED FARMER-BUYER MATCHING ROUTE
  // =========================================================================

  app.get('/api/matches', attachOptionalUser, (req: AuthedRequest, res) => {
    const db = loadDb();
    const allProducts = db.products.map((p) => enrichProduct(db, p));
    const allRequirements = db.buyerRequirements.map((r) => enrichRequirement(db, r));

    let products = allProducts;
    let requirements = allRequirements;

    if (req.query.scope === 'mine' && req.authUser) {
      if (req.authUser.role === 'farmer') {
        products = allProducts.filter((p) => p.farmerId === req.authUser!.id);
      } else if (req.authUser.role === 'buyer') {
        requirements = allRequirements.filter((r) => r.buyerId === req.authUser!.id);
      }
    }

    const matches = findMatches(products, requirements);
    return res.json({ matches });
  });

  // =========================================================================
  // PROTECTED ADMIN ROUTES (STRICT ROLE-BASED ACCESS)
  // =========================================================================

  app.get('/api/admin/overview', requireAuth, requireRole('admin'), (_req, res) => {
    const db = loadDb();
    const publicUsers = db.users.map(toPublicUser);
    const farmers = publicUsers.filter((u) => u.role === 'farmer');
    const buyers = publicUsers.filter((u) => u.role === 'buyer');
    const products = db.products.map((p) => enrichProduct(db, p));
    const requirements = db.buyerRequirements.map((r) => enrichRequirement(db, r));

    const stats = {
      totalFarmers: farmers.length,
      totalBuyers: buyers.length,
      activeListings: products.filter(
        (p) => p.approvalStatus === 'Approved' && p.availabilityStatus !== 'Out of Stock'
      ).length,
      pendingApprovals: products.filter((p) => p.approvalStatus === 'Pending').length,
      totalEnquiries: db.enquiries.length,
      confirmedOrders: db.orders.filter(
        (o) => o.status === 'Confirmed' || o.status === 'Completed'
      ).length,
      openRequirements: requirements.filter((r) => r.status === 'Open').length,
      demoOrderVolume: db.orders
        .filter((o) => o.status !== 'Cancelled')
        .reduce((acc, o) => acc + o.totalValue, 0),
    };

    const enrichedEnquiries = db.enquiries
      .map((e) => enrichEnquiry(db, e))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const enrichedOrders = db.orders
      .map((o) => enrichOrder(db, o))
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    return res.json({
      stats,
      farmers,
      buyers,
      products,
      requirements,
      enquiries: enrichedEnquiries,
      orders: enrichedOrders,
    });
  });

  app.patch(
    '/api/admin/products/:id/approval',
    requireAuth,
    requireRole('admin'),
    (req, res) => {
      const db = loadDb();
      const product = db.products.find((p) => p.id === req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found.' });

      const { approvalStatus } = req.body || {};
      if (
        approvalStatus !== 'Approved' &&
        approvalStatus !== 'Pending' &&
        approvalStatus !== 'Rejected'
      ) {
        return res.status(400).json({ error: 'Invalid approval status.' });
      }

      product.approvalStatus = approvalStatus as ApprovalStatus;
      saveDb(db);
      return res.json({ product: enrichProduct(db, product) });
    }
  );

  app.patch(
    '/api/admin/users/:id/status',
    requireAuth,
    requireRole('admin'),
    (req: AuthedRequest, res) => {
      const db = loadDb();
      const user = db.users.find((u) => u.id === req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      if (user.id === req.authUser!.id) {
        return res.status(400).json({ error: 'You cannot suspend your own admin account.' });
      }
      const { accountStatus } = req.body || {};
      if (accountStatus !== 'active' && accountStatus !== 'suspended') {
        return res.status(400).json({ error: 'Invalid account status.' });
      }
      user.accountStatus = accountStatus;
      saveDb(db);
      return res.json({ user: toPublicUser(user) });
    }
  );

  // Catch unknown API routes before Vite / static SPA fallback
  app.all('/api/*', (_req, res) => {
    return res.status(404).json({ error: 'API endpoint not found.' });
  });

  // =========================================================================
  // VITE MIDDLEWARE (DEV) OR STATIC ASSETS (PROD)
  // =========================================================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FreshKart Agro Connect server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start FreshKart server:', err);
  process.exit(1);
});
