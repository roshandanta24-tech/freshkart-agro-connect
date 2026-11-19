import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBasket,
  PlusCircle,
  FileText,
  GitCompare,
  MessageSquare,
  ClipboardList,
  User,
  LogOut,
  Check,
  Trash2,
} from 'lucide-react';
import {
  BUYER_CATEGORIES,
  PRODUCT_CATEGORIES,
  WESTERN_ODISHA_DISTRICTS,
  type BuyerCategory,
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
import { formatQuantity, formatShortDate } from '../utils/format';
import {
  buildBuyerEnquiryFollowUpMessage,
  buildOrderWhatsAppMessage,
  buildProductWhatsAppMessage,
  isValidIndianPhone,
} from '../utils/whatsapp';
import { WhatsAppButton } from './WhatsAppButton';
import { OrderDetailModal } from './OrderDetailModal';

type BuyerTab =
  | 'dashboard'
  | 'post-requirement'
  | 'my-requirements'
  | 'matches'
  | 'enquiries'
  | 'orders'
  | 'profile';

interface BuyerDashboardProps {
  user: PublicUser;
  refreshKey?: number;
  onUserUpdated: (user: PublicUser) => void;
  onOpenMarketplace: () => void;
  onSelectProduct: (product: Product) => void;
  onGlobalDataChanged: () => void;
  onLogout: () => void;
}

export function BuyerDashboard({
  user,
  refreshKey = 0,
  onUserUpdated,
  onOpenMarketplace,
  onSelectProduct,
  onGlobalDataChanged,
  onLogout,
}: BuyerDashboardProps) {
  const [activeTab, setActiveTab] = useState<BuyerTab>('dashboard');
  const [requirements, setRequirements] = useState<BuyerRequirement[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Requirement Form State
  const [reqBizName, setReqBizName] = useState(user.businessName || user.fullName);
  const [reqProdName, setReqProdName] = useState('');
  const [reqCategory, setReqCategory] = useState<ProductCategory>('Vegetables');
  const [reqQty, setReqQty] = useState('150');
  const [reqUnit, setReqUnit] = useState<QuantityUnit>('Kg');
  const [reqBudget, setReqBudget] = useState('25');
  const [reqDistrict, setReqDistrict] = useState(user.district);
  const [reqLocation, setReqLocation] = useState(`${user.village}, ${user.district}`);
  const [reqDate, setReqDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  );
  const [reqPhone, setReqPhone] = useState(user.mobile);
  const [reqNotes, setReqNotes] = useState('');
  const [postingReq, setPostingReq] = useState(false);

  // Profile State
  const [profName, setProfName] = useState(user.fullName);
  const [profMobile, setProfMobile] = useState(user.mobile);
  const [profBiz, setProfBiz] = useState(user.businessName || '');
  const [profCat, setProfCat] = useState<BuyerCategory>(user.buyerCategory || 'Grocery Store');
  const [profDistrict, setProfDistrict] = useState(user.district);
  const [profVillage, setProfVillage] = useState(user.village);
  const [savingProfile, setSavingProfile] = useState(false);

  const loadBuyerData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, enqRes, ordRes, matchRes] = await Promise.all([
        api.getRequirements(true),
        api.getEnquiries(),
        api.getOrders(),
        api.getMatches('mine'),
      ]);
      setRequirements(reqRes.requirements);
      setEnquiries(enqRes.enquiries);
      setOrders(ordRes.orders);
      setMatches(matchRes.matches);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load buyer dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBuyerData();
  }, [loadBuyerData, refreshKey]);

  useEffect(() => {
    setProfName(user.fullName);
    setProfMobile(user.mobile);
    setProfBiz(user.businessName || '');
    setProfCat(user.buyerCategory || 'Grocery Store');
    setProfDistrict(user.district);
    setProfVillage(user.village);
    setReqBizName(user.businessName || user.fullName);
    setReqDistrict(user.district);
    setReqLocation(`${user.village}, ${user.district}`);
    setReqPhone(user.mobile);
  }, [user]);

  const handlePostRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFeedback('');
    if (!isValidIndianPhone(reqPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setPostingReq(true);
    try {
      await api.createRequirement({
        businessName: reqBizName,
        productName: reqProdName,
        category: reqCategory,
        requiredQuantity: Number(reqQty),
        unit: reqUnit,
        maxBudgetPerUnit: Number(reqBudget),
        deliveryLocation: reqLocation,
        district: reqDistrict,
        requiredDeliveryDate: reqDate,
        contactNumber: reqPhone,
        notes: reqNotes,
      });
      setReqProdName('');
      setReqNotes('');
      setFeedback('Requirement published! Compatible farmers are now matched automatically.');
      await loadBuyerData();
      onGlobalDataChanged();
      setActiveTab('my-requirements');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to post requirement.');
    } finally {
      setPostingReq(false);
    }
  };

  const handleToggleReqStatus = async (req: BuyerRequirement) => {
    const nextStatus = req.status === 'Open' ? 'Fulfilled' : 'Open';
    try {
      await api.updateRequirementStatus(req.id, nextStatus);
      setFeedback(`Requirement "${req.productName}" marked as ${nextStatus}.`);
      await loadBuyerData();
      onGlobalDataChanged();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update requirement.');
    }
  };

  const handleDeleteReq = async (req: BuyerRequirement) => {
    try {
      await api.deleteRequirement(req.id);
      setFeedback(`Deleted requirement "${req.productName}".`);
      await loadBuyerData();
      onGlobalDataChanged();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete requirement.');
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
        businessName: profBiz,
        buyerCategory: profCat,
        district: profDistrict,
        village: profVillage,
      });
      onUserUpdated(res.user);
      setFeedback('Buyer profile saved successfully.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const sidebarItems: { id: BuyerTab; label: string; icon: typeof LayoutDashboard; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'post-requirement', label: 'Post Requirement', icon: PlusCircle },
    { id: 'my-requirements', label: 'My Requirements', icon: FileText, count: requirements.length },
    { id: 'matches', label: 'Matching Farmers', icon: GitCompare, count: matches.length },
    { id: 'enquiries', label: 'My Enquiries', icon: MessageSquare, count: enquiries.length },
    { id: 'orders', label: 'My Orders', icon: ClipboardList, count: orders.length },
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
                {user.buyerCategory || 'Buyer Account'}
                {user.isDemo ? ' · DEMO' : ''}
              </p>
              <p className="font-display font-bold text-base text-[#1A241B] mt-0.5 truncate">
                {user.businessName || user.fullName}
              </p>
              <p className="text-xs text-[#4A594C] truncate">
                {user.village}, {user.district}
              </p>
            </div>

            <nav aria-label="Buyer dashboard navigation" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
              <button
                type="button"
                onClick={onOpenMarketplace}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#1B5E20] bg-[#E8F5E9] hover:bg-[#D5EAD7] transition-colors min-h-[42px] mb-1"
              >
                <ShoppingBasket className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">Browse Marketplace</span>
              </button>

              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
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
          <div className="bg-white rounded-xl border border-[#DCE6D9] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-2xl text-[#1A241B]">Buyer Dashboard</h1>
              <p className="text-sm text-[#4A594C] mt-1">
                Source fresh produce directly from farmers, post bulk requirements, and track orders.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('post-requirement')}
                className="px-4 py-2.5 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] min-h-[44px] whitespace-nowrap"
              >
                Post Requirement
              </button>
              <button
                type="button"
                onClick={onOpenMarketplace}
                className="px-4 py-2.5 rounded-lg border border-[#DCE6D9] text-[#1A241B] text-sm font-semibold hover:bg-[#F8FAF5] min-h-[44px] whitespace-nowrap"
              >
                Explore Produce
              </button>
            </div>
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
              Loading your buyer workspace...
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        label: 'Open Requirements',
                        value: String(requirements.filter((r) => r.status === 'Open').length),
                      },
                      { label: 'Matching Farmers', value: String(matches.length), highlight: true },
                      { label: 'Enquiries Submitted', value: String(enquiries.length) },
                      { label: 'Tracked Orders', value: String(orders.length) },
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

                  {/* Matching Farmers preview */}
                  <section className="bg-white rounded-xl border border-[#DCE6D9] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-display font-bold text-lg text-[#1A241B]">
                          Recommended Farmer Matches
                        </h2>
                        <p className="text-xs text-[#4A594C]">
                          Matched transparently against your posted produce requirements
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('matches')}
                        className="text-xs font-semibold text-[#1B5E20] hover:underline"
                      >
                        See All ({matches.length})
                      </button>
                    </div>
                    {matches.length === 0 ? (
                      <p className="text-sm text-[#4A594C]">
                        Post a produce requirement to receive instant rule-based farmer matches.
                      </p>
                    ) : (
                      <div className="pt-2 border-t border-[#DCE6D9] grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DCE6D9]">
                        {matches.slice(0, 2).map((m, idx) => (
                          <div
                            key={m.id}
                            className={`space-y-2.5 py-4 md:py-2 ${idx === 0 ? 'md:pr-6' : 'md:pl-6'}`}
                          >
                            <p className="text-xs font-semibold text-[#1B5E20] tabular-nums">
                              {m.tier} ({m.score}/100) · {m.product.district}
                            </p>
                            <p className="font-semibold text-sm text-[#1A241B]">
                              {m.product.name} by {m.product.farmerName} ({m.product.village})
                            </p>
                            <p className="text-xs text-[#4A594C] tabular-nums">
                              {formatQuantity(m.product.availableQuantity, m.product.unit)} available
                              @ {formatINR(m.product.expectedPrice)}/{m.product.unit} (Your max:{' '}
                              {formatINR(m.requirement.maxBudgetPerUnit)}/{m.requirement.unit})
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => onSelectProduct(m.product)}
                                className="px-3 py-2 rounded-lg bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#1B5E20]"
                              >
                                View &amp; Enquire
                              </button>
                              <WhatsAppButton
                                phone={m.product.farmerMobile}
                                message={buildProductWhatsAppMessage(
                                  m.product.name,
                                  m.product.farmerName,
                                  `${formatINR(m.product.expectedPrice)}/${m.product.unit}`
                                )}
                                label="WhatsApp Farmer"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {/* POST REQUIREMENT */}
              {activeTab === 'post-requirement' && (
                <section className="bg-white rounded-xl border border-[#DCE6D9] p-6 sm:p-8">
                  <h2 className="font-display font-bold text-xl text-[#1A241B]">
                    Post a Bulk or Regular Purchase Requirement
                  </h2>
                  <p className="text-sm text-[#4A594C] mt-1">
                    Tell local farmers what you need — our rule-based matching will immediately pair
                    compatible farm listings.
                  </p>

                  <form onSubmit={handlePostRequirement} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="b-req-biz" className="block text-sm font-medium text-[#1A241B] mb-1">
                        Buyer / Business Name
                      </label>
                      <input
                        id="b-req-biz"
                        type="text"
                        required
                        value={reqBizName}
                        onChange={(e) => setReqBizName(e.target.value)}
                        className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label htmlFor="b-req-prod" className="block text-sm font-medium text-[#1A241B] mb-1">
                        Product Required
                      </label>
                      <input
                        id="b-req-prod"
                        type="text"
                        required
                        placeholder="e.g. Tomato, Cauliflower, Rice"
                        value={reqProdName}
                        onChange={(e) => setReqProdName(e.target.value)}
                        className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label htmlFor="b-req-cat" className="block text-sm font-medium text-[#1A241B] mb-1">
                        Category
                      </label>
                      <select
                        id="b-req-cat"
                        value={reqCategory}
                        onChange={(e) => setReqCategory(e.target.value as ProductCategory)}
                        className="w-full rounded-lg border border-[#DCE6D9] bg-white px-3.5 py-2.5 text-sm min-h-[44px]"
                      >
                        {PRODUCT_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="b-req-qty" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Required Quantity
                        </label>
                        <input
                          id="b-req-qty"
                          type="number"
                          min="1"
                          required
                          value={reqQty}
                          onChange={(e) => setReqQty(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm tabular-nums min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label htmlFor="b-req-unit" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Unit
                        </label>
                        <select
                          id="b-req-unit"
                          value={reqUnit}
                          onChange={(e) => setReqUnit(e.target.value as QuantityUnit)}
                          className="w-full rounded-lg border border-[#DCE6D9] bg-white px-3.5 py-2.5 text-sm min-h-[44px]"
                        >
                          <option value="Kg">Kg</option>
                          <option value="Quintal">Quintal</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="b-req-budget" className="block text-sm font-medium text-[#1A241B] mb-1">
                        Maximum Budget per {reqUnit} (₹)
                      </label>
                      <input
                        id="b-req-budget"
                        type="number"
                        min="1"
                        required
                        value={reqBudget}
                        onChange={(e) => setReqBudget(e.target.value)}
                        className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm tabular-nums min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label htmlFor="b-req-district" className="block text-sm font-medium text-[#1A241B] mb-1">
                        District
                      </label>
                      <select
                        id="b-req-district"
                        value={reqDistrict}
                        onChange={(e) => setReqDistrict(e.target.value)}
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
                      <label htmlFor="b-req-loc" className="block text-sm font-medium text-[#1A241B] mb-1">
                        Delivery Location
                      </label>
                      <input
                        id="b-req-loc"
                        type="text"
                        required
                        value={reqLocation}
                        onChange={(e) => setReqLocation(e.target.value)}
                        className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label htmlFor="b-req-date" className="block text-sm font-medium text-[#1A241B] mb-1">
                        Required Delivery Date
                      </label>
                      <input
                        id="b-req-date"
                        type="date"
                        required
                        value={reqDate}
                        onChange={(e) => setReqDate(e.target.value)}
                        className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="b-req-phone" className="block text-sm font-medium text-[#1A241B] mb-1">
                        Contact Number (WhatsApp)
                      </label>
                      <input
                        id="b-req-phone"
                        type="tel"
                        required
                        value={reqPhone}
                        onChange={(e) => setReqPhone(e.target.value)}
                        className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm tabular-nums min-h-[44px]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="b-req-notes" className="block text-sm font-medium text-[#1A241B] mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        id="b-req-notes"
                        rows={3}
                        value={reqNotes}
                        onChange={(e) => setReqNotes(e.target.value)}
                        placeholder="Quality grade, packaging, morning drop-off preferences..."
                        className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={postingReq}
                        className="px-6 py-3 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] disabled:opacity-60 min-h-[46px]"
                      >
                        {postingReq ? 'Publishing...' : 'Submit Buyer Requirement'}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {/* MY REQUIREMENTS */}
              {activeTab === 'my-requirements' && (
                <section className="space-y-4">
                  <h2 className="font-display font-bold text-xl text-[#1A241B]">
                    My Posted Requirements ({requirements.length})
                  </h2>
                  {requirements.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#DCE6D9] p-10 text-center space-y-3">
                      <p className="text-sm text-[#4A594C]">
                        You haven&apos;t posted any purchase requirements yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('post-requirement')}
                        className="px-5 py-2.5 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold min-h-[44px]"
                      >
                        Post Your First Requirement
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3" data-testid="buyer-requirements-list">
                      {requirements.map((req) => (
                        <article
                          key={req.id}
                          className="bg-white rounded-xl border border-[#DCE6D9] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <p className="text-xs text-[#4A594C]">
                              {req.category} · {req.district} · Needed by{' '}
                              {formatShortDate(req.requiredDeliveryDate)}
                              {req.isDemo ? ' · DEMO' : ''}
                            </p>
                            <h3 className="font-display font-bold text-lg text-[#1A241B] mt-0.5">
                              {req.productName} — {formatQuantity(req.requiredQuantity, req.unit)}{' '}
                              @ up to {formatINR(req.maxBudgetPerUnit)}/{req.unit}
                            </h3>
                            <p className="text-xs text-[#4A594C] mt-1">
                              Delivery: {req.deliveryLocation} · Status:{' '}
                              <strong className="text-[#1B5E20]">{req.status}</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleReqStatus(req)}
                              className="px-3.5 py-2 rounded-lg border border-[#DCE6D9] text-xs font-semibold text-[#1A241B] hover:bg-[#E8F5E9] min-h-[38px]"
                            >
                              {req.status === 'Open' ? 'Mark Fulfilled' : 'Reopen'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReq(req)}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 min-h-[38px]"
                              aria-label={`Delete requirement for ${req.productName}`}
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

              {/* MATCHING FARMERS */}
              {activeTab === 'matches' && (
                <section className="space-y-4">
                  <div>
                    <h2 className="font-display font-bold text-xl text-[#1A241B]">
                      Matching Farmers for Your Requirements ({matches.length})
                    </h2>
                    <p className="text-sm text-[#4A594C]">
                      Transparent rule-based compatibility matching across Western Odisha farmers.
                    </p>
                  </div>
                  {matches.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#DCE6D9] p-10 text-center text-sm text-[#4A594C]">
                      No farmer listings currently match your open requirements.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {matches.map((match) => (
                        <article
                          key={match.id}
                          className="bg-white rounded-xl border border-[#DCE6D9] p-5 space-y-3"
                        >
                          <p className="text-xs font-semibold text-[#1B5E20] tabular-nums">
                            {match.tier} · Score {match.score}/100
                          </p>
                          <h3 className="font-display font-bold text-lg text-[#1A241B]">
                            {match.product.name} — {match.product.farmerName} (
                            {match.product.village}, {match.product.district})
                          </h3>
                          <p className="text-sm text-[#4A594C] tabular-nums">
                            Available:{' '}
                            <strong>
                              {formatQuantity(match.product.availableQuantity, match.product.unit)}
                            </strong>{' '}
                            @{' '}
                            <strong>
                              {formatINR(match.product.expectedPrice)}/{match.product.unit}
                            </strong>
                          </p>
                          <ul className="space-y-1 text-xs text-[#4A594C]">
                            {match.reasons.map((r) => (
                              <li key={r} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-[#2E7D32] shrink-0 mt-0.5" />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="pt-2 flex flex-wrap gap-2.5">
                            <button
                              type="button"
                              onClick={() => onSelectProduct(match.product)}
                              className="px-4 py-2 rounded-lg bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#1B5E20] min-h-[38px]"
                            >
                              View Product &amp; Send Enquiry
                            </button>
                            <WhatsAppButton
                              phone={match.product.farmerMobile}
                              message={buildProductWhatsAppMessage(
                                match.product.name,
                                match.product.farmerName,
                                `${formatINR(match.product.expectedPrice)}/${match.product.unit}`
                              )}
                              label="WhatsApp Farmer"
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* MY ENQUIRIES */}
              {activeTab === 'enquiries' && (
                <section className="space-y-4">
                  <h2 className="font-display font-bold text-xl text-[#1A241B]">
                    My Purchase Enquiries ({enquiries.length})
                  </h2>
                  {enquiries.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#DCE6D9] p-10 text-center text-sm text-[#4A594C]">
                      No enquiries submitted yet. Browse the marketplace to send enquiries to
                      farmers.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {enquiries.map((enq) => (
                        <article
                          key={enq.id}
                          className="bg-white rounded-xl border border-[#DCE6D9] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <p className="text-xs text-[#4A594C] tabular-nums">
                              #{enq.id} · {formatShortDate(enq.createdAt)}
                              {enq.isDemo ? ' · DEMO' : ''}
                            </p>
                            <h3 className="font-display font-bold text-lg text-[#1A241B] mt-0.5">
                              {enq.productName} — {formatQuantity(enq.requiredQuantity, enq.unit)}{' '}
                              @ {formatINR(enq.expectedPrice)}/{enq.unit}
                            </h3>
                            <p className="text-xs text-[#4A594C] mt-1">
                              Farmer: <strong className="text-[#1A241B]">{enq.farmerName}</strong> ·
                              Status:{' '}
                              <strong
                                className={
                                  enq.status === 'Accepted'
                                    ? 'text-[#2E7D32]'
                                    : enq.status === 'Rejected'
                                    ? 'text-red-700'
                                    : 'text-amber-700'
                                }
                              >
                                {enq.status}
                              </strong>
                            </p>
                          </div>
                          <WhatsAppButton
                            phone={enq.farmerMobile}
                            message={buildBuyerEnquiryFollowUpMessage(
                              enq.farmerName,
                              enq.productName,
                              formatQuantity(enq.requiredQuantity, enq.unit)
                            )}
                            label="WhatsApp Farmer"
                          />
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* MY ORDERS */}
              {activeTab === 'orders' && (
                <section className="space-y-4">
                  <h2 className="font-display font-bold text-xl text-[#1A241B]">
                    My Orders &amp; Tracking ({orders.length})
                  </h2>
                  {orders.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#DCE6D9] p-10 text-center text-sm text-[#4A594C]">
                      No orders yet. Submit a purchase enquiry on any produce listing to start
                      tracking an order here.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-[#DCE6D9] overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-[#DCE6D9] text-xs font-semibold text-[#4A594C]">
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">Product &amp; Farmer</th>
                            <th className="py-3 px-4 text-right">Qty</th>
                            <th className="py-3 px-4 text-right">Total</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCE6D9]">
                          {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-[#F8FAF5]">
                              <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                                {order.id}
                                {order.isDemo ? ' (DEMO)' : ''}
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-[#1A241B]">{order.productName}</p>
                                <p className="text-xs text-[#4A594C]">
                                  {order.farmerName} · {order.farmerLocation}
                                </p>
                              </td>
                              <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap">
                                {formatQuantity(order.quantity, order.unit)}
                              </td>
                              <td className="py-3.5 px-4 text-right font-semibold text-[#1B5E20] tabular-nums whitespace-nowrap">
                                {formatINR(order.totalValue)}
                              </td>
                              <td className="py-3.5 px-4 text-xs font-semibold text-[#1B5E20]">
                                {order.status}
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(order)}
                                  className="px-3 py-1.5 rounded-lg border border-[#DCE6D9] text-xs font-semibold text-[#1A241B] hover:bg-[#E8F5E9]"
                                >
                                  View Details
                                </button>
                                <WhatsAppButton
                                  phone={order.farmerMobile}
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

              {/* PROFILE */}
              {activeTab === 'profile' && (
                <section className="bg-white rounded-xl border border-[#DCE6D9] p-6 sm:p-8 max-w-2xl">
                  <h2 className="font-display font-bold text-xl text-[#1A241B]">Buyer Profile</h2>
                  <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="b-prof-name" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Contact Person Name
                        </label>
                        <input
                          id="b-prof-name"
                          type="text"
                          required
                          value={profName}
                          onChange={(e) => setProfName(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label htmlFor="b-prof-mobile" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Mobile Number (WhatsApp)
                        </label>
                        <input
                          id="b-prof-mobile"
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
                        <label htmlFor="b-prof-cat" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Buyer Category
                        </label>
                        <select
                          id="b-prof-cat"
                          value={profCat}
                          onChange={(e) => setProfCat(e.target.value as BuyerCategory)}
                          className="w-full rounded-lg border border-[#DCE6D9] bg-white px-3.5 py-2.5 text-sm min-h-[44px]"
                        >
                          {BUYER_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="b-prof-biz" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Business Name
                        </label>
                        <input
                          id="b-prof-biz"
                          type="text"
                          value={profBiz}
                          onChange={(e) => setProfBiz(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="b-prof-dist" className="block text-sm font-medium text-[#1A241B] mb-1">
                          District
                        </label>
                        <select
                          id="b-prof-dist"
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
                        <label htmlFor="b-prof-area" className="block text-sm font-medium text-[#1A241B] mb-1">
                          Town / Market Area
                        </label>
                        <input
                          id="b-prof-area"
                          type="text"
                          required
                          value={profVillage}
                          onChange={(e) => setProfVillage(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                        />
                      </div>
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
          viewerRole="buyer"
          onClose={() => setSelectedOrder(null)}
          onUpdateOrder={handleUpdateOrder}
        />
      )}
    </div>
  );
}
