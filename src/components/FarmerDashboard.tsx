import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  MessageSquare,
  GitCompare,
  ClipboardList,
  ReceiptIndianRupee,
  User,
  LogOut,
  Check,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  ORDER_STATUSES,
  PRODUCT_CATEGORIES,
  WESTERN_ODISHA_DISTRICTS,
  type AvailabilityStatus,
  type BuyerRequirement,
  type Enquiry,
  type MatchResult,
  type Order,
  type OrderStatus,
  type Product,
  type ProductCategory,
  type PublicUser,
  type QuantityUnit,
} from '../types';
import { api } from '../lib/api';
import { formatINR } from '../utils/projections';
import { PRESET_PRODUCE_IMAGES, formatQuantity, formatShortDate } from '../utils/format';
import {
  buildFarmerEnquiryReplyMessage,
  buildOrderWhatsAppMessage,
  buildRequirementWhatsAppMessage,
  isValidIndianPhone,
} from '../utils/whatsapp';
import { ProduceImage } from './ProduceImage';
import { WhatsAppButton } from './WhatsAppButton';
import { OrderDetailModal } from './OrderDetailModal';

type FarmerTab =
  | 'dashboard'
  | 'add-product'
  | 'my-products'
  | 'enquiries'
  | 'matches'
  | 'orders'
  | 'sales'
  | 'profile';

interface FarmerDashboardProps {
  user: PublicUser;
  refreshKey?: number;
  onUserUpdated: (user: PublicUser) => void;
  onGlobalDataChanged: () => void;
  onLogout: () => void;
}

export function FarmerDashboard({
  user,
  refreshKey = 0,
  onUserUpdated,
  onGlobalDataChanged,
  onLogout,
}: FarmerDashboardProps) {
  const [activeTab, setActiveTab] = useState<FarmerTab>('dashboard');
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [allRequirements, setAllRequirements] = useState<BuyerRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Add / Edit Product form state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<ProductCategory>('Vegetables');
  const [prodImage, setProdImage] = useState<string>(PRESET_PRODUCE_IMAGES[0].url);
  const [prodQty, setProdQty] = useState('100');
  const [prodUnit, setProdUnit] = useState<QuantityUnit>('Kg');
  const [prodPrice, setProdPrice] = useState('25');
  const [prodHarvestDate, setProdHarvestDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [prodAvailability, setProdAvailability] =
    useState<AvailabilityStatus>('Available');
  const [prodVillage, setProdVillage] = useState(user.village);
  const [prodDistrict, setProdDistrict] = useState(user.district);
  const [prodDescription, setProdDescription] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Profile form state
  const [profName, setProfName] = useState(user.fullName);
  const [profMobile, setProfMobile] = useState(user.mobile);
  const [profDistrict, setProfDistrict] = useState(user.district);
  const [profVillage, setProfVillage] = useState(user.village);
  const [profFarming, setProfFarming] = useState(user.farmingDetails || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadFarmerData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, enqRes, ordRes, matchRes, reqRes] = await Promise.all([
        api.getProducts({ mine: true }),
        api.getEnquiries(),
        api.getOrders(),
        api.getMatches('mine'),
        api.getRequirements(false),
      ]);
      setMyProducts(prodRes.products);
      setEnquiries(enqRes.enquiries);
      setOrders(ordRes.orders);
      setMatches(matchRes.matches);
      setAllRequirements(reqRes.requirements.filter((r) => r.status === 'Open'));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarmerData();
  }, [loadFarmerData, refreshKey]);

  useEffect(() => {
    setProfName(user.fullName);
    setProfMobile(user.mobile);
    setProfDistrict(user.district);
    setProfVillage(user.village);
    setProfFarming(user.farmingDetails || '');
  }, [user]);

  const resetProductForm = () => {
    setEditingProductId(null);
    setProdName('');
    setProdCategory('Vegetables');
    setProdImage(PRESET_PRODUCE_IMAGES[0].url);
    setProdQty('100');
    setProdUnit('Kg');
    setProdPrice('25');
    setProdHarvestDate(new Date().toISOString().slice(0, 10));
    setProdAvailability('Available');
    setProdVillage(user.village);
    setProdDistrict(user.district);
    setProdDescription('');
  };

  const handleStartEdit = (product: Product) => {
    setEditingProductId(product.id);
    setProdName(product.name);
    setProdCategory(product.category);
    setProdImage(product.image);
    setProdQty(String(product.availableQuantity));
    setProdUnit(product.unit);
    setProdPrice(String(product.expectedPrice));
    setProdHarvestDate(product.harvestDate);
    setProdAvailability(product.availabilityStatus);
    setProdVillage(product.village);
    setProdDistrict(product.district);
    setProdDescription(product.description);
    setFeedback('');
    setErrorMsg('');
    setActiveTab('add-product');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      setErrorMsg('Please select an image smaller than 2.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProdImage(reader.result);
        setErrorMsg('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFeedback('');
    setSavingProduct(true);
    try {
      const payload = {
        name: prodName,
        category: prodCategory,
        image: prodImage,
        availableQuantity: Number(prodQty),
        unit: prodUnit,
        expectedPrice: Number(prodPrice),
        harvestDate: prodHarvestDate,
        availabilityStatus: prodAvailability,
        village: prodVillage,
        district: prodDistrict,
        description: prodDescription,
      };
      if (editingProductId) {
        await api.updateProduct(editingProductId, payload);
        setFeedback('Product listing updated successfully.');
      } else {
        await api.createProduct(payload);
        setFeedback('New agricultural product listed successfully!');
      }
      resetProductForm();
      await loadFarmerData();
      onGlobalDataChanged();
      setActiveTab('my-products');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    setErrorMsg('');
    setFeedback('');
    try {
      await api.deleteProduct(product.id);
      setFeedback(`Deleted listing "${product.name}".`);
      await loadFarmerData();
      onGlobalDataChanged();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete product.');
    }
  };

  const handleRespondEnquiry = async (enquiryId: string, status: 'Accepted' | 'Rejected') => {
    setErrorMsg('');
    setFeedback('');
    try {
      const res = await api.updateEnquiryStatus(enquiryId, status);
      setFeedback(
        status === 'Accepted' && res.order
          ? `Enquiry accepted! Order #${res.order.id} is now Accepted in My Orders.`
          : `Enquiry marked as ${status}.`
      );
      await loadFarmerData();
      onGlobalDataChanged();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update enquiry.');
    }
  };

  const handleUpdateOrder = async (
    orderId: string,
    payload: { status?: OrderStatus; agreedPrice?: number; notes?: string }
  ) => {
    const res = await api.updateOrder(orderId, payload);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(res.order);
    }
    onGlobalDataChanged();
  };

  const handleInlineStatusChange = async (orderId: string, status: OrderStatus) => {
    setErrorMsg('');
    setFeedback('');
    try {
      await handleUpdateOrder(orderId, { status });
      setFeedback(`Order #${orderId} status updated to ${status}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update order status.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFeedback('');
    if (!isValidIndianPhone(profMobile)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await api.updateProfile({
        fullName: profName,
        mobile: profMobile,
        district: profDistrict,
        village: profVillage,
        farmingDetails: profFarming,
      });
      onUserUpdated(res.user);
      setFeedback('Farmer profile updated successfully.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Dashboard metrics
  const activeListingsCount = myProducts.filter(
    (p) => p.approvalStatus === 'Approved' && p.availabilityStatus !== 'Out of Stock'
  ).length;
  const confirmedOrders = orders.filter(
    (o) => o.status === 'Confirmed' || o.status === 'Completed'
  );
  const salesOrders = orders.filter(
    (o) => o.status === 'Accepted' || o.status === 'Confirmed' || o.status === 'Completed'
  );
  const totalSalesValue = salesOrders.reduce((sum, o) => sum + o.totalValue, 0);

  const sidebarItems: { id: FarmerTab; label: string; icon: typeof LayoutDashboard; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-product', label: editingProductId ? 'Edit Product' : 'Add New Product', icon: PlusCircle },
    { id: 'my-products', label: 'My Products', icon: Package, count: myProducts.length },
    {
      id: 'enquiries',
      label: 'Buyer Enquiries',
      icon: MessageSquare,
      count: enquiries.filter((e) => e.status === 'Pending').length,
    },
    { id: 'matches', label: 'Matching Buyers', icon: GitCompare, count: matches.length },
    { id: 'orders', label: 'My Orders', icon: ClipboardList, count: orders.length },
    { id: 'sales', label: 'Sales History', icon: ReceiptIndianRupee },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-[#DCE6D9] p-4 lg:sticky lg:top-24">
            <div className="pb-4 mb-3 border-b border-[#DCE6D9]">
              <p className="text-xs font-semibold text-[#2E7D32]">
                Farmer Account{user.isDemo ? ' · DEMO' : ''}
              </p>
              <p className="font-display font-bold text-base text-[#1A241B] mt-0.5 truncate">
                {user.fullName}
              </p>
              <p className="text-xs text-[#4A594C] truncate">
                {user.village}, {user.district}
              </p>
            </div>

            <nav aria-label="Farmer dashboard navigation" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (editingProductId) {
                        resetProductForm();
                      }
                      setFeedback('');
                      setErrorMsg('');
                      setActiveTab(item.id);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[42px] text-left ${
                      isActive
                        ? 'bg-[#2E7D32] text-white'
                        : 'text-[#4A594C] hover:bg-[#E8F5E9]/70 hover:text-[#1A241B]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span
                        className={`text-xs tabular-nums font-semibold ${
                          isActive ? 'text-white/90' : 'text-[#2E7D32]'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors min-h-[42px] lg:mt-2 lg:pt-3 lg:border-t lg:border-[#DCE6D9]"
              >
                <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Workspace */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-white rounded-xl border border-[#DCE6D9] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-2xl text-[#1A241B]">
                Farmer Dashboard
              </h1>
              <p className="text-sm text-[#4A594C] mt-1">
                Welcome to FreshKart! Manage your agricultural listings and connect with buyers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetProductForm();
                setActiveTab('add-product');
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] transition-colors whitespace-nowrap min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>Add New Product</span>
            </button>
          </div>

          {feedback && (
            <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/25 text-sm font-medium text-[#1B5E20]">
              {feedback}
            </div>
          )}
          {errorMsg && (
            <div role="alert" className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-xl border border-[#DCE6D9] p-8 text-sm text-[#4A594C]">
              Loading your farmer workspace...
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: 'Total Products Listed', value: String(myProducts.length) },
                      { label: 'Active Listings', value: String(activeListingsCount) },
                      { label: 'Buyer Enquiries', value: String(enquiries.length) },
                      { label: 'Confirmed Orders', value: String(confirmedOrders.length) },
                      {
                        label: 'Total Sales Value',
                        value: formatINR(totalSalesValue),
                        highlight: true,
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="bg-white rounded-xl border border-[#DCE6D9] p-4"
                      >
                        <p className="text-xs text-[#4A594C]">{stat.label}</p>
                        <p
                          className={`font-display font-bold text-2xl tabular-nums mt-1.5 ${
                            stat.highlight ? 'text-[#1B5E20]' : 'text-[#1A241B]'
                          }`}
                        >
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Quick Match Preview */}
                  <section className="bg-white rounded-xl border border-[#DCE6D9] p-6 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="font-display font-bold text-lg text-[#1A241B]">
                          Top Matching Buyers for Your Produce
                        </h2>
                        <p className="text-xs text-[#4A594C]">
                          Transparent rule-based matches based on crop, quantity, district, and price
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('matches')}
                        className="text-xs font-semibold text-[#1B5E20] hover:underline whitespace-nowrap"
                      >
                        View All Matches ({matches.length})
                      </button>
                    </div>

                    {matches.length === 0 ? (
                      <p className="text-sm text-[#4A594C]">
                        No matching open buyer requirements yet. Add more seasonal crops to discover
                        compatible buyers.
                      </p>
                    ) : (
                      <div className="pt-2 border-t border-[#DCE6D9] grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DCE6D9]">
                        {matches.slice(0, 2).map((m, idx) => (
                          <div
                            key={m.id}
                            className={`space-y-2.5 py-4 md:py-2 ${idx === 0 ? 'md:pr-6' : 'md:pl-6'}`}
                          >
                            <p className="text-xs font-semibold text-[#1B5E20] tabular-nums">
                              {m.tier} ({m.score}/100) · {m.requirement.district}
                            </p>
                            <p className="font-semibold text-sm text-[#1A241B]">
                              {m.requirement.businessName} needs{' '}
                              {formatQuantity(m.requirement.requiredQuantity, m.requirement.unit)}{' '}
                              of {m.requirement.productName}
                            </p>
                            <p className="text-xs text-[#4A594C] tabular-nums">
                              Buyer max budget: {formatINR(m.requirement.maxBudgetPerUnit)}/
                              {m.requirement.unit} · Your price: {formatINR(m.product.expectedPrice)}
                              /{m.product.unit}
                            </p>
                            <div className="pt-1">
                              <WhatsAppButton
                                phone={m.requirement.contactNumber}
                                message={buildRequirementWhatsAppMessage(
                                  m.requirement.productName,
                                  m.requirement.businessName,
                                  formatQuantity(m.requirement.requiredQuantity, m.requirement.unit)
                                )}
                                label="WhatsApp Buyer"
                                variant="primary"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Recent Enquiries */}
                  <section className="bg-white rounded-xl border border-[#DCE6D9] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display font-bold text-lg text-[#1A241B]">
                        Recent Buyer Enquiries
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActiveTab('enquiries')}
                        className="text-xs font-semibold text-[#1B5E20] hover:underline"
                      >
                        Manage Enquiries
                      </button>
                    </div>
                    {enquiries.length === 0 ? (
                      <p className="text-sm text-[#4A594C]">No buyer enquiries received yet.</p>
                    ) : (
                      <div className="divide-y divide-[#DCE6D9]">
                        {enquiries.slice(0, 3).map((enq) => (
                          <div
                            key={enq.id}
                            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <p className="font-semibold text-sm text-[#1A241B]">
                                {enq.productName} — {formatQuantity(enq.requiredQuantity, enq.unit)}{' '}
                                @ {formatINR(enq.expectedPrice)}/{enq.unit}
                              </p>
                              <p className="text-xs text-[#4A594C]">
                                From {enq.buyerName} · {enq.deliveryLocation} · Status:{' '}
                                <span className="font-semibold text-[#1B5E20]">{enq.status}</span>
                              </p>
                            </div>
                            <WhatsAppButton
                              phone={enq.buyerMobile}
                              message={buildFarmerEnquiryReplyMessage(
                                enq.buyerName,
                                enq.productName,
                                formatQuantity(enq.requiredQuantity, enq.unit),
                                `${formatINR(enq.expectedPrice)}/${enq.unit}`
                              )}
                              label="WhatsApp"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {/* TAB 2: ADD / EDIT PRODUCT FORM */}
              {activeTab === 'add-product' && (
                <section className="bg-white rounded-xl border border-[#DCE6D9] p-6 sm:p-8">
                  <h2 className="font-display font-bold text-xl text-[#1A241B]">
                    {editingProductId ? 'Edit Agricultural Product' : 'Add New Agricultural Product'}
                  </h2>
                  <p className="text-sm text-[#4A594C] mt-1">
                    Fill in your harvest details clearly so local buyers can discover and contact you.
                  </p>

                  <form onSubmit={handleSaveProduct} className="mt-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="prod-name" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Product Name
                        </label>
                        <input
                          id="prod-name"
                          type="text"
                          required
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          placeholder="e.g. Tomato, Bitter Gourd, Swarna Rice"
                          className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[46px]"
                        />
                      </div>

                      <div>
                        <label htmlFor="prod-category" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Product Category
                        </label>
                        <select
                          id="prod-category"
                          value={prodCategory}
                          onChange={(e) => setProdCategory(e.target.value as ProductCategory)}
                          className="w-full rounded-lg border border-[#DCE6D9] bg-white px-3.5 py-2.5 text-sm min-h-[46px]"
                        >
                          {PRODUCT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="prod-qty" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Available Quantity
                        </label>
                        <input
                          id="prod-qty"
                          type="number"
                          min="1"
                          required
                          value={prodQty}
                          onChange={(e) => setProdQty(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm tabular-nums min-h-[46px]"
                        />
                      </div>

                      <div>
                        <label htmlFor="prod-unit" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Unit
                        </label>
                        <select
                          id="prod-unit"
                          value={prodUnit}
                          onChange={(e) => setProdUnit(e.target.value as QuantityUnit)}
                          className="w-full rounded-lg border border-[#DCE6D9] bg-white px-3.5 py-2.5 text-sm min-h-[46px]"
                        >
                          <option value="Kg">Kilograms (Kg)</option>
                          <option value="Quintal">Quintals (100 Kg)</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="prod-price" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Expected Price per {prodUnit} (₹)
                        </label>
                        <input
                          id="prod-price"
                          type="number"
                          min="1"
                          step="0.5"
                          required
                          value={prodPrice}
                          onChange={(e) => setProdPrice(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm tabular-nums min-h-[46px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label htmlFor="prod-harvest" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Harvest Date
                        </label>
                        <input
                          id="prod-harvest"
                          type="date"
                          required
                          value={prodHarvestDate}
                          onChange={(e) => setProdHarvestDate(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[46px]"
                        />
                      </div>

                      <div>
                        <label htmlFor="prod-avail" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Availability Status
                        </label>
                        <select
                          id="prod-avail"
                          value={prodAvailability}
                          onChange={(e) => setProdAvailability(e.target.value as AvailabilityStatus)}
                          className="w-full rounded-lg border border-[#DCE6D9] bg-white px-3.5 py-2.5 text-sm min-h-[46px]"
                        >
                          <option value="Available">Available</option>
                          <option value="Limited Stock">Limited Stock</option>
                          <option value="Out of Stock">Out of Stock</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="prod-village" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Village
                        </label>
                        <input
                          id="prod-village"
                          type="text"
                          required
                          value={prodVillage}
                          onChange={(e) => setProdVillage(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[46px]"
                        />
                      </div>

                      <div>
                        <label htmlFor="prod-district" className="block text-sm font-medium text-[#1A241B] mb-1">
                          District
                        </label>
                        <select
                          id="prod-district"
                          value={prodDistrict}
                          onChange={(e) => setProdDistrict(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE6D9] bg-white px-3.5 py-2.5 text-sm min-h-[46px]"
                        >
                          {WESTERN_ODISHA_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Product Image Picker & Upload */}
                    <div className="space-y-3 p-4 rounded-xl bg-[#F8FAF5] border border-[#DCE6D9]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#1A241B]">Product Photograph</p>
                          <p className="text-xs text-[#4A594C]">
                            Upload a photo from your phone/computer or choose a sample produce photo.
                          </p>
                        </div>
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#2E7D32]/40 text-xs font-semibold text-[#1B5E20] hover:bg-[#E8F5E9] cursor-pointer min-h-[40px]">
                          <Upload className="w-4 h-4" aria-hidden="true" />
                          <span>Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="sr-only"
                          />
                        </label>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-24 h-18 rounded-lg overflow-hidden border border-[#DCE6D9] shrink-0">
                          <ProduceImage src={prodImage} alt="Selected produce preview" />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_PRODUCE_IMAGES.map((img) => (
                            <button
                              key={img.label}
                              type="button"
                              onClick={() => setProdImage(img.url)}
                              className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                                prodImage === img.url
                                  ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                                  : 'bg-white text-[#4A594C] border-[#DCE6D9] hover:border-[#2E7D32]'
                              }`}
                            >
                              {img.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="prod-desc" className="block text-sm font-medium text-[#1A241B] mb-1">
                        Additional Description
                      </label>
                      <textarea
                        id="prod-desc"
                        rows={3}
                        value={prodDescription}
                        onChange={(e) => setProdDescription(e.target.value)}
                        placeholder="Describe crop variety, freshness, packaging (crates/bags), and pickup timing..."
                        className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      {editingProductId && (
                        <button
                          type="button"
                          onClick={() => {
                            resetProductForm();
                            setActiveTab('my-products');
                          }}
                          className="px-4 py-2.5 rounded-lg border border-[#DCE6D9] text-sm font-medium text-[#4A594C] min-h-[46px]"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={savingProduct}
                        className="px-6 py-3 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] disabled:opacity-60 min-h-[46px]"
                      >
                        {savingProduct
                          ? 'Saving...'
                          : editingProductId
                          ? 'Update Product Listing'
                          : 'Publish Product Listing'}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {/* TAB 3: MY PRODUCTS */}
              {activeTab === 'my-products' && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-bold text-xl text-[#1A241B]">
                      My Produce Listings ({myProducts.length})
                    </h2>
                  </div>

                  {myProducts.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#DCE6D9] p-10 text-center space-y-3">
                      <p className="text-sm text-[#4A594C]">
                        You have not listed any agricultural produce yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('add-product')}
                        className="px-5 py-2.5 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold min-h-[44px]"
                      >
                        Add Your First Product
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="farmer-products-list">
                      {myProducts.map((product) => (
                        <article
                          key={product.id}
                          className="bg-white rounded-xl border border-[#DCE6D9] overflow-hidden flex flex-col"
                        >
                          <div className="flex gap-4 p-4">
                            <div className="w-28 h-24 rounded-lg overflow-hidden shrink-0 bg-[#F8FAF5] border border-[#DCE6D9]">
                              <ProduceImage src={product.image} alt={product.name} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[#4A594C]">
                                {product.category} · {product.village}, {product.district}
                                {product.isDemo ? ' · DEMO' : ''}
                              </p>
                              <h3 className="font-display font-bold text-lg text-[#1A241B] mt-0.5 truncate">
                                {product.name}
                              </h3>
                              <p className="font-semibold text-base text-[#1B5E20] tabular-nums">
                                {formatINR(product.expectedPrice)}/{product.unit} ·{' '}
                                {formatQuantity(product.availableQuantity, product.unit)}
                              </p>
                              <p className="text-xs text-[#4A594C] mt-1">
                                Stock: <strong>{product.availabilityStatus}</strong> · Listing:{' '}
                                <strong
                                  className={
                                    product.approvalStatus === 'Approved'
                                      ? 'text-[#2E7D32]'
                                      : product.approvalStatus === 'Pending'
                                      ? 'text-amber-700'
                                      : 'text-red-700'
                                  }
                                >
                                  {product.approvalStatus}
                                </strong>
                              </p>
                            </div>
                          </div>
                          <div className="px-4 py-3 bg-[#F8FAF5] border-t border-[#DCE6D9] flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(product)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#DCE6D9] text-xs font-semibold text-[#1A241B] hover:bg-[#E8F5E9] min-h-[38px]"
                              aria-label={`Edit ${product.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 min-h-[38px]"
                              aria-label={`Delete ${product.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* TAB 4: BUYER ENQUIRIES */}
              {activeTab === 'enquiries' && (
                <section className="space-y-4">
                  <h2 className="font-display font-bold text-xl text-[#1A241B]">
                    Incoming Buyer Enquiries ({enquiries.length})
                  </h2>
                  {enquiries.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#DCE6D9] p-10 text-center text-sm text-[#4A594C]">
                      No enquiries received yet. When buyers express interest in your listings, they
                      will appear here.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enquiries.map((enq) => (
                        <article
                          key={enq.id}
                          className="bg-white rounded-xl border border-[#DCE6D9] p-5 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div>
                              <p className="text-xs text-[#4A594C] tabular-nums">
                                Enquiry #{enq.id} · {formatShortDate(enq.createdAt)}
                                {enq.isDemo ? ' · DEMO DATA' : ''}
                              </p>
                              <h3 className="font-display font-bold text-lg text-[#1A241B] mt-0.5">
                                {enq.productName} — {formatQuantity(enq.requiredQuantity, enq.unit)}{' '}
                                @ {formatINR(enq.expectedPrice)}/{enq.unit}
                              </h3>
                              <p className="text-sm text-[#4A594C] mt-1">
                                Buyer: <strong className="text-[#1A241B]">{enq.buyerName}</strong> ·
                                Location: {enq.deliveryLocation} · Target Date:{' '}
                                {formatShortDate(enq.preferredPurchaseDate)}
                              </p>
                              {enq.message && (
                                <p className="text-sm text-[#1A241B]/85 mt-2 bg-[#F8FAF5] p-3 rounded-lg border border-[#DCE6D9]">
                                  &ldquo;{enq.message}&rdquo;
                                </p>
                              )}
                            </div>

                            <span
                              className={`text-xs font-semibold whitespace-nowrap ${
                                enq.status === 'Accepted'
                                  ? 'text-[#2E7D32]'
                                  : enq.status === 'Rejected'
                                  ? 'text-red-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              Status: {enq.status}
                            </span>
                          </div>

                          <div className="pt-3 border-t border-[#DCE6D9] flex flex-wrap items-center gap-2.5">
                            {enq.status === 'Pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRespondEnquiry(enq.id, 'Accepted')}
                                  className="px-4 py-2 rounded-lg bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#1B5E20] min-h-[38px]"
                                >
                                  Accept &amp; Create Order
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRespondEnquiry(enq.id, 'Rejected')}
                                  className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 min-h-[38px]"
                                >
                                  Reject Enquiry
                                </button>
                              </>
                            )}
                            <WhatsAppButton
                              phone={enq.buyerMobile}
                              message={buildFarmerEnquiryReplyMessage(
                                enq.buyerName,
                                enq.productName,
                                formatQuantity(enq.requiredQuantity, enq.unit),
                                `${formatINR(enq.expectedPrice)}/${enq.unit}`
                              )}
                              label="WhatsApp Buyer"
                              variant="outline"
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* TAB 5: MATCHING BUYERS & OPEN REQUIREMENTS */}
              {activeTab === 'matches' && (
                <div className="space-y-8">
                  <section className="space-y-4">
                    <div>
                      <h2 className="font-display font-bold text-xl text-[#1A241B]">
                        Rule-Based Matching Buyers ({matches.length})
                      </h2>
                      <p className="text-sm text-[#4A594C] mt-0.5">
                        Buyers whose posted requirements match your available crop, quantity,
                        district, and expected price.
                      </p>
                    </div>

                    {matches.length === 0 ? (
                      <div className="bg-white rounded-xl border border-[#DCE6D9] p-8 text-sm text-[#4A594C]">
                        No automatic matches for your current listings yet. Browse all open buyer
                        requirements below.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {matches.map((match) => (
                          <article
                            key={match.id}
                            className="bg-white rounded-xl border border-[#DCE6D9] p-5 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold text-[#1B5E20] tabular-nums">
                                  {match.tier} · {match.score}/100
                                </p>
                                <h3 className="font-display font-bold text-lg text-[#1A241B] mt-0.5">
                                  {match.requirement.businessName} ({match.requirement.district})
                                </h3>
                              </div>
                            </div>
                            <p className="text-sm text-[#4A594C] tabular-nums">
                              Needs{' '}
                              <strong>
                                {formatQuantity(
                                  match.requirement.requiredQuantity,
                                  match.requirement.unit
                                )}{' '}
                                {match.requirement.productName}
                              </strong>{' '}
                              up to{' '}
                              <strong>
                                {formatINR(match.requirement.maxBudgetPerUnit)}/
                                {match.requirement.unit}
                              </strong>{' '}
                              (matches your {match.product.name} at{' '}
                              {formatINR(match.product.expectedPrice)}/{match.product.unit})
                            </p>
                            <ul className="space-y-1 text-xs text-[#4A594C]">
                              {match.reasons.map((r) => (
                                <li key={r} className="flex items-start gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-[#2E7D32] shrink-0 mt-0.5" />
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="pt-2">
                              <WhatsAppButton
                                phone={match.requirement.contactNumber}
                                message={buildRequirementWhatsAppMessage(
                                  match.requirement.productName,
                                  match.requirement.businessName,
                                  formatQuantity(
                                    match.requirement.requiredQuantity,
                                    match.requirement.unit
                                  )
                                )}
                                label="Contact Buyer via WhatsApp"
                                variant="primary"
                              />
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-4">
                    <h2 className="font-display font-bold text-lg text-[#1A241B]">
                      All Open Western Odisha Buyer Requirements ({allRequirements.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allRequirements.map((req) => (
                        <div
                          key={req.id}
                          className="bg-white rounded-xl border border-[#DCE6D9] p-4 flex flex-col justify-between gap-3"
                        >
                          <div>
                            <p className="text-xs text-[#4A594C]">
                              {req.category} · {req.district}
                              {req.isDemo ? ' · DEMO' : ''}
                            </p>
                            <p className="font-semibold text-[#1A241B] mt-0.5">
                              {req.productName} — {formatQuantity(req.requiredQuantity, req.unit)}{' '}
                              @ max {formatINR(req.maxBudgetPerUnit)}/{req.unit}
                            </p>
                            <p className="text-xs text-[#4A594C] mt-1">
                              {req.businessName} · {req.deliveryLocation} · Needed by{' '}
                              {formatShortDate(req.requiredDeliveryDate)}
                            </p>
                          </div>
                          <WhatsAppButton
                            phone={req.contactNumber}
                            message={buildRequirementWhatsAppMessage(
                              req.productName,
                              req.businessName,
                              formatQuantity(req.requiredQuantity, req.unit)
                            )}
                            label="WhatsApp Buyer"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 6: MY ORDERS */}
              {activeTab === 'orders' && (
                <section className="space-y-4">
                  <h2 className="font-display font-bold text-xl text-[#1A241B]">
                    My Orders ({orders.length})
                  </h2>
                  {orders.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#DCE6D9] p-10 text-center text-sm text-[#4A594C]">
                      No orders yet. Accept an incoming buyer enquiry to start an order.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-[#DCE6D9] overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-[#DCE6D9] text-xs font-semibold text-[#4A594C]">
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">Product &amp; Buyer</th>
                            <th className="py-3 px-4 text-right">Qty</th>
                            <th className="py-3 px-4 text-right">Total Value</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCE6D9]">
                          {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-[#F8FAF5]">
                              <td className="py-3.5 px-4 font-mono text-xs text-[#1A241B] whitespace-nowrap">
                                {order.id}
                                {order.isDemo ? ' (DEMO)' : ''}
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-[#1A241B]">{order.productName}</p>
                                <p className="text-xs text-[#4A594C]">
                                  {order.buyerBusiness || order.buyerName} · {order.buyerLocation}
                                </p>
                              </td>
                              <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap">
                                {formatQuantity(order.quantity, order.unit)}
                              </td>
                              <td className="py-3.5 px-4 text-right font-semibold text-[#1B5E20] tabular-nums whitespace-nowrap">
                                {formatINR(order.totalValue)}
                              </td>
                              <td className="py-3.5 px-4">
                                <select
                                  aria-label={`Order status for ${order.id}`}
                                  value={order.status}
                                  onChange={(e) =>
                                    handleInlineStatusChange(
                                      order.id,
                                      e.target.value as OrderStatus
                                    )
                                  }
                                  className="rounded-lg border border-[#DCE6D9] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1A241B]"
                                >
                                  {ORDER_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(order)}
                                  className="px-3 py-1.5 rounded-lg border border-[#DCE6D9] text-xs font-semibold text-[#1A241B] hover:bg-[#E8F5E9]"
                                >
                                  Details
                                </button>
                                <WhatsAppButton
                                  phone={order.buyerMobile}
                                  message={buildOrderWhatsAppMessage(
                                    order.id,
                                    order.productName,
                                    order.status
                                  )}
                                  label="WhatsApp"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {/* TAB 7: SALES HISTORY */}
              {activeTab === 'sales' && (
                <section className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                      <h2 className="font-display font-bold text-xl text-[#1A241B]">
                        Sales History
                      </h2>
                      <p className="text-xs text-[#4A594C]">
                        Accepted, confirmed, and completed direct farm sales (demo transactions
                        clearly labeled)
                      </p>
                    </div>
                    <p className="font-display font-bold text-xl text-[#1B5E20] tabular-nums">
                      Total: {formatINR(totalSalesValue)}
                    </p>
                  </div>

                  {salesOrders.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#DCE6D9] p-10 text-center text-sm text-[#4A594C]">
                      No confirmed or completed sales recorded yet.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-[#DCE6D9] overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-[#DCE6D9] text-xs font-semibold text-[#4A594C]">
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">Produce</th>
                            <th className="py-3 px-4">Buyer</th>
                            <th className="py-3 px-4 text-right">Quantity</th>
                            <th className="py-3 px-4 text-right">Agreed Rate</th>
                            <th className="py-3 px-4 text-right">Total Value</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCE6D9] tabular-nums">
                          {salesOrders.map((o) => (
                            <tr key={o.id}>
                              <td className="py-3 px-4 text-xs text-[#4A594C] whitespace-nowrap">
                                {formatShortDate(o.orderDate)}
                              </td>
                              <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                                {o.id}
                                {o.isDemo ? ' · DEMO' : ''}
                              </td>
                              <td className="py-3 px-4 font-semibold text-[#1A241B]">
                                {o.productName}
                              </td>
                              <td className="py-3 px-4 text-[#4A594C]">
                                {o.buyerBusiness || o.buyerName}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                {formatQuantity(o.quantity, o.unit)}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                {formatINR(o.agreedPrice)}/{o.unit}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-[#1B5E20] whitespace-nowrap">
                                {formatINR(o.totalValue)}
                              </td>
                              <td className="py-3 px-4 text-xs font-semibold text-[#1B5E20]">
                                {o.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {/* TAB 8: FARMER PROFILE */}
              {activeTab === 'profile' && (
                <section className="bg-white rounded-xl border border-[#DCE6D9] p-6 sm:p-8 max-w-2xl">
                  <h2 className="font-display font-bold text-xl text-[#1A241B]">Farmer Profile</h2>
                  <p className="text-sm text-[#4A594C] mt-1">
                    Keep your mobile number and village location accurate so buyers can reach you
                    directly on WhatsApp.
                  </p>

                  <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="f-prof-name" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Full Name
                        </label>
                        <input
                          id="f-prof-name"
                          type="text"
                          required
                          value={profName}
                          onChange={(e) => setProfName(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label htmlFor="f-prof-mobile" className="block text-sm font-medium text-[#1A241B] mb-1">
                          WhatsApp Mobile Number
                        </label>
                        <input
                          id="f-prof-mobile"
                          type="tel"
                          required
                          value={profMobile}
                          onChange={(e) => setProfMobile(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm tabular-nums min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="f-prof-district" className="block text-sm font-medium text-[#1A241B] mb-1">
                          District
                        </label>
                        <select
                          id="f-prof-district"
                          value={profDistrict}
                          onChange={(e) => setProfDistrict(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE6D9] bg-white px-3.5 py-2.5 text-sm min-h-[44px]"
                        >
                          {WESTERN_ODISHA_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="f-prof-village" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Village
                        </label>
                        <input
                          id="f-prof-village"
                          type="text"
                          required
                          value={profVillage}
                          onChange={(e) => setProfVillage(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="f-prof-details" className="block text-sm font-medium text-[#1A241B] mb-1">
                        Farming Details
                      </label>
                      <textarea
                        id="f-prof-details"
                        rows={3}
                        value={profFarming}
                        onChange={(e) => setProfFarming(e.target.value)}
                        className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-6 py-3 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] disabled:opacity-60 min-h-[46px]"
                    >
                      {savingProfile ? 'Saving...' : 'Save Profile'}
                    </button>
                  </form>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          canUpdate={true}
          viewerRole="farmer"
          onClose={() => setSelectedOrder(null)}
          onUpdateOrder={handleUpdateOrder}
        />
      )}
    </div>
  );
}
