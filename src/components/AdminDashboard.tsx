import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  PackageCheck,
  Users,
  Store,
  ClipboardList,
  LogOut,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import type {
  ApprovalStatus,
  Enquiry,
  Order,
  OrderStatus,
  Product,
  PublicUser,
} from '../types';
import { api } from '../lib/api';
import { formatINR } from '../utils/projections';
import { formatQuantity, formatShortDate } from '../utils/format';
import { OrderDetailModal } from './OrderDetailModal';

type AdminTab = 'overview' | 'listings' | 'farmers' | 'buyers' | 'activity';

interface AdminDashboardProps {
  user: PublicUser;
  refreshKey?: number;
  onGlobalDataChanged: () => void;
  onLogout: () => void;
}

export function AdminDashboard({
  user,
  refreshKey = 0,
  onGlobalDataChanged,
  onLogout,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [feedback, setFeedback] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalBuyers: 0,
    activeListings: 0,
    pendingApprovals: 0,
    totalEnquiries: 0,
    confirmedOrders: 0,
    openRequirements: 0,
    demoOrderVolume: 0,
  });
  const [farmers, setFarmers] = useState<PublicUser[]>([]);
  const [buyers, setBuyers] = useState<PublicUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const loadAdminOverview = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.getAdminOverview();
      setStats(data.stats);
      setFarmers(data.farmers);
      setBuyers(data.buyers);
      setProducts(data.products);
      setEnquiries(data.enquiries);
      setOrders(data.orders);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load admin console.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user.role === 'admin') {
      loadAdminOverview();
    }
  }, [user.role, loadAdminOverview, refreshKey]);

  // Strict client-side guard in addition to server 403 enforcement
  if (user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="font-display font-bold text-2xl text-[#1A241B]">
          Admin Access Protected
        </h1>
        <p className="text-sm text-[#4A594C]">
          This console is restricted to authorized FreshKart Operations Administrators.
        </p>
      </div>
    );
  }

  const handleApprovalChange = async (productId: string, approvalStatus: ApprovalStatus) => {
    setFeedback('');
    setErrorMsg('');
    try {
      await api.updateProductApproval(productId, approvalStatus);
      setFeedback(`Listing approval status updated to ${approvalStatus}.`);
      await loadAdminOverview();
      onGlobalDataChanged();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update approval.');
    }
  };

  const handleRemoveProduct = async (product: Product) => {
    setFeedback('');
    setErrorMsg('');
    try {
      await api.deleteProduct(product.id);
      setFeedback(`Removed listing "${product.name}".`);
      await loadAdminOverview();
      onGlobalDataChanged();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to remove listing.');
    }
  };

  const handleToggleUserStatus = async (account: PublicUser) => {
    const next = account.accountStatus === 'active' ? 'suspended' : 'active';
    setFeedback('');
    setErrorMsg('');
    try {
      await api.updateUserStatus(account.id, next);
      setFeedback(`Account "${account.fullName}" set to ${next}.`);
      await loadAdminOverview();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update account status.');
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
    await loadAdminOverview();
  };

  const navItems: { id: AdminTab; label: string; icon: typeof LayoutDashboard; count?: number }[] = [
    { id: 'overview', label: 'Overview & Stats', icon: LayoutDashboard },
    {
      id: 'listings',
      label: 'Product Approvals',
      icon: PackageCheck,
      count: stats.pendingApprovals,
    },
    { id: 'farmers', label: 'Farmer Accounts', icon: Users, count: stats.totalFarmers },
    { id: 'buyers', label: 'Buyer Accounts', icon: Store, count: stats.totalBuyers },
    { id: 'activity', label: 'Enquiries & Orders', icon: ClipboardList, count: orders.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-[#DCE6D9] p-4 lg:sticky lg:top-24">
            <div className="pb-4 mb-3 border-b border-[#DCE6D9]">
              <p className="text-xs font-semibold text-[#1B5E20]">
                Protected Admin Console
              </p>
              <p className="font-display font-bold text-base text-[#1A241B] mt-0.5 truncate">
                {user.fullName}
              </p>
              <p className="text-xs text-[#4A594C] truncate">{user.email}</p>
            </div>

            <nav aria-label="Admin console navigation" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
              {navItems.map((item) => {
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
                        ? 'bg-[#1B5E20] text-white'
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
                          isActive ? 'text-white/90' : 'text-[#1B5E20]'
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

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="bg-white rounded-xl border border-[#DCE6D9] p-6">
            <h1 className="font-display font-bold text-2xl text-[#1A241B]">
              FreshKart Operations Admin Console
            </h1>
            <p className="text-sm text-[#4A594C] mt-1">
              Monitor Western Odisha marketplace activity, moderate listings, and manage farmer and
              buyer accounts. Sample seed records are clearly tagged as DEMO DATA.
            </p>
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
              Loading marketplace statistics...
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Registered Farmers', value: String(stats.totalFarmers) },
                      { label: 'Registered Buyers', value: String(stats.totalBuyers) },
                      { label: 'Active Product Listings', value: String(stats.activeListings) },
                      { label: 'Pending Approvals', value: String(stats.pendingApprovals) },
                      { label: 'Total Enquiries', value: String(stats.totalEnquiries) },
                      { label: 'Confirmed / Completed Orders', value: String(stats.confirmedOrders) },
                      { label: 'Open Buyer Requirements', value: String(stats.openRequirements) },
                      {
                        label: 'Tracked Order Value (Includes Demo)',
                        value: formatINR(stats.demoOrderVolume),
                        highlight: true,
                      },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="bg-white rounded-xl border border-[#DCE6D9] p-4"
                      >
                        <p className="text-xs text-[#4A594C]">{card.label}</p>
                        <p
                          className={`font-display font-bold text-2xl tabular-nums mt-1.5 ${
                            card.highlight ? 'text-[#1B5E20]' : 'text-[#1A241B]'
                          }`}
                        >
                          {card.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Pending Listings Callout */}
                  <section className="bg-white rounded-xl border border-[#DCE6D9] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display font-bold text-lg text-[#1A241B]">
                        Listings Awaiting Moderation ({stats.pendingApprovals})
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActiveTab('listings')}
                        className="text-xs font-semibold text-[#1B5E20] hover:underline"
                      >
                        Manage All Listings
                      </button>
                    </div>
                    {products.filter((p) => p.approvalStatus === 'Pending').length === 0 ? (
                      <p className="text-sm text-[#4A594C]">
                        All farmer product listings have been reviewed.
                      </p>
                    ) : (
                      <div className="divide-y divide-[#DCE6D9]">
                        {products
                          .filter((p) => p.approvalStatus === 'Pending')
                          .map((prod) => (
                            <div
                              key={prod.id}
                              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div>
                                <p className="font-semibold text-sm text-[#1A241B]">
                                  {prod.name} — {formatQuantity(prod.availableQuantity, prod.unit)}{' '}
                                  @ {formatINR(prod.expectedPrice)}/{prod.unit}
                                </p>
                                <p className="text-xs text-[#4A594C]">
                                  By {prod.farmerName} ({prod.village}, {prod.district})
                                  {prod.isDemo ? ' · DEMO DATA' : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApprovalChange(prod.id, 'Approved')}
                                  className="px-3.5 py-2 rounded-lg bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#1B5E20]"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApprovalChange(prod.id, 'Rejected')}
                                  className="px-3.5 py-2 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {/* PRODUCT LISTINGS MODERATION */}
              {activeTab === 'listings' && (
                <section className="space-y-4">
                  <h2 className="font-display font-bold text-xl text-[#1A241B]">
                    All Marketplace Listings ({products.length})
                  </h2>
                  <div className="bg-white rounded-xl border border-[#DCE6D9] overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-[#DCE6D9] text-xs font-semibold text-[#4A594C]">
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4">Farmer &amp; District</th>
                          <th className="py-3 px-4 text-right">Qty / Price</th>
                          <th className="py-3 px-4">Approval</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE6D9]">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-[#F8FAF5]">
                            <td className="py-3 px-4">
                              <p className="font-semibold text-[#1A241B]">{p.name}</p>
                              <p className="text-xs text-[#4A594C]">
                                {p.category}
                                {p.isDemo ? ' · DEMO' : ''}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-xs text-[#4A594C]">
                              <p className="font-medium text-[#1A241B]">{p.farmerName}</p>
                              <p>
                                {p.village}, {p.district}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                              <p className="font-semibold text-[#1B5E20]">
                                {formatINR(p.expectedPrice)}/{p.unit}
                              </p>
                              <p className="text-xs text-[#4A594C]">
                                {formatQuantity(p.availableQuantity, p.unit)}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-xs font-semibold">
                              <span
                                className={
                                  p.approvalStatus === 'Approved'
                                    ? 'text-[#2E7D32]'
                                    : p.approvalStatus === 'Pending'
                                    ? 'text-amber-700'
                                    : 'text-red-700'
                                }
                              >
                                {p.approvalStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                              {p.approvalStatus !== 'Approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleApprovalChange(p.id, 'Approved')}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#1B5E20]"
                                >
                                  Approve
                                </button>
                              )}
                              {p.approvalStatus !== 'Rejected' && (
                                <button
                                  type="button"
                                  onClick={() => handleApprovalChange(p.id, 'Rejected')}
                                  className="px-2.5 py-1.5 rounded-lg border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-50"
                                >
                                  Reject
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50"
                                aria-label={`Remove listing ${p.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Remove</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* FARMERS TABLE */}
              {activeTab === 'farmers' && (
                <section className="space-y-4">
                  <h2 className="font-display font-bold text-xl text-[#1A241B]">
                    Registered Farmer Accounts ({farmers.length})
                  </h2>
                  <div className="bg-white rounded-xl border border-[#DCE6D9] overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-[#DCE6D9] text-xs font-semibold text-[#4A594C]">
                          <th className="py-3 px-4">Farmer Name</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE6D9]">
                        {farmers.map((f) => (
                          <tr key={f.id}>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-[#1A241B]">{f.fullName}</p>
                              <p className="text-xs text-[#4A594C]">
                                {f.email}
                                {f.isDemo ? ' · DEMO' : ''}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-xs text-[#4A594C]">
                              {f.village}, {f.district}
                            </td>
                            <td className="py-3 px-4 text-xs tabular-nums text-[#4A594C]">
                              {f.mobile}
                            </td>
                            <td className="py-3 px-4 text-xs font-semibold">
                              <span
                                className={
                                  f.accountStatus === 'active' ? 'text-[#2E7D32]' : 'text-red-700'
                                }
                              >
                                {f.accountStatus === 'active' ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(f)}
                                className="px-3 py-1.5 rounded-lg border border-[#DCE6D9] text-xs font-semibold text-[#1A241B] hover:bg-[#F8FAF5]"
                              >
                                {f.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* BUYERS TABLE */}
              {activeTab === 'buyers' && (
                <section className="space-y-4">
                  <h2 className="font-display font-bold text-xl text-[#1A241B]">
                    Registered Buyer Accounts ({buyers.length})
                  </h2>
                  <div className="bg-white rounded-xl border border-[#DCE6D9] overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-[#DCE6D9] text-xs font-semibold text-[#4A594C]">
                          <th className="py-3 px-4">Buyer / Business</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE6D9]">
                        {buyers.map((b) => (
                          <tr key={b.id}>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-[#1A241B]">
                                {b.businessName || b.fullName}
                              </p>
                              <p className="text-xs text-[#4A594C]">
                                {b.fullName} · {b.mobile}
                                {b.isDemo ? ' · DEMO' : ''}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-xs text-[#4A594C]">
                              {b.buyerCategory || 'Buyer'}
                            </td>
                            <td className="py-3 px-4 text-xs text-[#4A594C]">
                              {b.village}, {b.district}
                            </td>
                            <td className="py-3 px-4 text-xs font-semibold">
                              <span
                                className={
                                  b.accountStatus === 'active' ? 'text-[#2E7D32]' : 'text-red-700'
                                }
                              >
                                {b.accountStatus === 'active' ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(b)}
                                className="px-3 py-1.5 rounded-lg border border-[#DCE6D9] text-xs font-semibold text-[#1A241B] hover:bg-[#F8FAF5]"
                              >
                                {b.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* ENQUIRIES & ORDERS MONITOR */}
              {activeTab === 'activity' && (
                <div className="space-y-8">
                  <section className="space-y-3">
                    <h2 className="font-display font-bold text-xl text-[#1A241B]">
                      Order &amp; Transaction Records ({orders.length})
                    </h2>
                    <div className="bg-white rounded-xl border border-[#DCE6D9] overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-[#DCE6D9] text-xs font-semibold text-[#4A594C]">
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">Product</th>
                            <th className="py-3 px-4">Farmer → Buyer</th>
                            <th className="py-3 px-4 text-right">Value</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Inspect</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCE6D9] tabular-nums">
                          {orders.map((o) => (
                            <tr key={o.id}>
                              <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                                {o.id}
                                {o.isDemo ? ' · DEMO' : ''}
                              </td>
                              <td className="py-3 px-4 font-semibold text-[#1A241B]">
                                {o.productName} ({formatQuantity(o.quantity, o.unit)})
                              </td>
                              <td className="py-3 px-4 text-xs text-[#4A594C]">
                                {o.farmerName} → {o.buyerBusiness || o.buyerName}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-[#1B5E20] whitespace-nowrap">
                                {formatINR(o.totalValue)}
                              </td>
                              <td className="py-3 px-4 text-xs font-semibold text-[#1B5E20]">
                                {o.status}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(o)}
                                  className="px-3 py-1.5 rounded-lg border border-[#DCE6D9] text-xs font-semibold text-[#1A241B] hover:bg-[#E8F5E9]"
                                >
                                  Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h2 className="font-display font-bold text-lg text-[#1A241B]">
                      All Buyer Enquiries ({enquiries.length})
                    </h2>
                    <div className="bg-white rounded-xl border border-[#DCE6D9] divide-y divide-[#DCE6D9]">
                      {enquiries.map((e) => (
                        <div
                          key={e.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                        >
                          <div>
                            <p className="font-semibold text-[#1A241B]">
                              {e.productName} ({formatQuantity(e.requiredQuantity, e.unit)} @{' '}
                              {formatINR(e.expectedPrice)}/{e.unit})
                            </p>
                            <p className="text-xs text-[#4A594C]">
                              {e.buyerName} → {e.farmerName} · {formatShortDate(e.createdAt)}
                              {e.isDemo ? ' · DEMO DATA' : ''}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-[#1B5E20]">{e.status}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          canUpdate={true}
          viewerRole="admin"
          onClose={() => setSelectedOrder(null)}
          onUpdateOrder={handleUpdateOrder}
        />
      )}
    </div>
  );
}
