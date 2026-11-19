import { useEffect, useState } from 'react';
import { Check, PlusCircle } from 'lucide-react';
import {
  PRODUCT_CATEGORIES,
  WESTERN_ODISHA_DISTRICTS,
  type BuyerRequirement,
  type MatchResult,
  type ProductCategory,
  type PublicUser,
  type QuantityUnit,
} from '../types';
import { formatINR } from '../utils/projections';
import { formatQuantity, formatShortDate } from '../utils/format';
import {
  buildProductWhatsAppMessage,
  buildRequirementWhatsAppMessage,
  isValidIndianPhone,
} from '../utils/whatsapp';
import { WhatsAppButton } from './WhatsAppButton';
import { api } from '../lib/api';

interface RequirementsBoardPageProps {
  requirements: BuyerRequirement[];
  matches: MatchResult[];
  user: PublicUser | null;
  onRequireLogin: () => void;
  onRequirementCreated: () => void;
}

export function RequirementsBoardPage({
  requirements,
  matches,
  user,
  onRequireLogin,
  onRequirementCreated,
}: RequirementsBoardPageProps) {
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [showPostForm, setShowPostForm] = useState(false);

  // Requirement form state
  const [businessName, setBusinessName] = useState(user?.businessName || user?.fullName || '');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Vegetables');
  const [requiredQuantity, setRequiredQuantity] = useState('100');
  const [unit, setUnit] = useState<QuantityUnit>('Kg');
  const [maxBudgetPerUnit, setMaxBudgetPerUnit] = useState('25');
  const [district, setDistrict] = useState<string>(user?.district || 'Bargarh');
  const [deliveryLocation, setDeliveryLocation] = useState(
    user ? `${user.village}, ${user.district}` : ''
  );
  const [requiredDeliveryDate, setRequiredDeliveryDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  );
  const [contactNumber, setContactNumber] = useState(user?.mobile || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    setBusinessName((prev) => prev || user.businessName || user.fullName);
    setDistrict((prev) => prev || user.district || 'Bargarh');
    setDeliveryLocation((prev) => prev || `${user.village}, ${user.district}`);
    setContactNumber((prev) => prev || user.mobile || '');
  }, [user]);

  const filteredReqs = requirements.filter((r) => {
    if (r.status !== 'Open') return false;
    if (districtFilter !== 'All' && r.district !== districtFilter) return false;
    return true;
  });

  const handleSubmitRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!user || (user.role !== 'buyer' && user.role !== 'admin')) {
      onRequireLogin();
      return;
    }
    if (!isValidIndianPhone(contactNumber)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createRequirement({
        businessName,
        productName,
        category,
        requiredQuantity: Number(requiredQuantity),
        unit,
        maxBudgetPerUnit: Number(maxBudgetPerUnit),
        deliveryLocation,
        district,
        requiredDeliveryDate,
        contactNumber,
        notes,
      });
      setSuccessMsg('Buyer requirement posted! Matching farmers can now see it.');
      setProductName('');
      setNotes('');
      setShowPostForm(false);
      onRequirementCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post requirement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#DCE6D9]">
        <div>
          <p className="text-xs font-semibold text-[#2E7D32]">
            Open Demand &amp; Transparent Rule-Based Matching
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#1A241B] mt-1.5">
            Buyer Requirements &amp; Farmer Matches
          </h1>
          <p className="text-sm text-[#4A594C] mt-2 max-w-2xl">
            Buyers post bulk or retail produce needs below. Farmers in Bargarh, Sambalpur, and
            Western Odisha can view compatible requirements and connect directly via WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              onRequireLogin();
            } else {
              setShowPostForm((prev) => !prev);
            }
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] transition-colors whitespace-nowrap self-start md:self-auto min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>{showPostForm ? 'Hide Requirement Form' : 'Post Buyer Requirement'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/25 text-sm font-medium text-[#1B5E20]">
          {successMsg}
        </div>
      )}

      {/* Post Requirement Form */}
      {showPostForm && (
        <section className="bg-white rounded-xl border border-[#DCE6D9] p-6 sm:p-8">
          <h2 className="font-display font-bold text-xl text-[#1A241B]">
            Post a New Buyer Requirement
          </h2>
          {user && user.role === 'farmer' ? (
            <p className="mt-3 text-sm text-[#4A594C]">
              You are logged in as a Farmer. Only Buyer accounts can post purchase requirements.
            </p>
          ) : (
            <form onSubmit={handleSubmitRequirement} className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="req-biz" className="block text-sm font-medium text-[#1A241B] mb-1">
                  Buyer / Business Name
                </label>
                <input
                  id="req-biz"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="req-prod" className="block text-sm font-medium text-[#1A241B] mb-1">
                  Product Required
                </label>
                <input
                  id="req-prod"
                  type="text"
                  required
                  placeholder="e.g. Tomato, Onion, Rice"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="req-cat" className="block text-sm font-medium text-[#1A241B] mb-1">
                  Category
                </label>
                <select
                  id="req-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
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
                  <label htmlFor="req-qty" className="block text-sm font-medium text-[#1A241B] mb-1">
                    Quantity
                  </label>
                  <input
                    id="req-qty"
                    type="number"
                    min="1"
                    required
                    value={requiredQuantity}
                    onChange={(e) => setRequiredQuantity(e.target.value)}
                    className="w-full rounded-lg border border-[#DCE6D9] px-3 py-2.5 text-sm tabular-nums min-h-[44px]"
                  />
                </div>
                <div>
                  <label htmlFor="req-unit" className="block text-sm font-medium text-[#1A241B] mb-1">
                    Unit
                  </label>
                  <select
                    id="req-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as QuantityUnit)}
                    className="w-full rounded-lg border border-[#DCE6D9] bg-white px-3 py-2.5 text-sm min-h-[44px]"
                  >
                    <option value="Kg">Kg</option>
                    <option value="Quintal">Quintal</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="req-budget" className="block text-sm font-medium text-[#1A241B] mb-1">
                  Maximum Budget per {unit} (₹)
                </label>
                <input
                  id="req-budget"
                  type="number"
                  min="1"
                  required
                  value={maxBudgetPerUnit}
                  onChange={(e) => setMaxBudgetPerUnit(e.target.value)}
                  className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm tabular-nums min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="req-district" className="block text-sm font-medium text-[#1A241B] mb-1">
                  District
                </label>
                <select
                  id="req-district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
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
                <label htmlFor="req-location" className="block text-sm font-medium text-[#1A241B] mb-1">
                  Delivery Location
                </label>
                <input
                  id="req-location"
                  type="text"
                  required
                  placeholder="e.g. Bargarh Main Market"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="req-date" className="block text-sm font-medium text-[#1A241B] mb-1">
                  Required Delivery Date
                </label>
                <input
                  id="req-date"
                  type="date"
                  required
                  value={requiredDeliveryDate}
                  onChange={(e) => setRequiredDeliveryDate(e.target.value)}
                  className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="req-phone" className="block text-sm font-medium text-[#1A241B] mb-1">
                  Contact Number
                </label>
                <input
                  id="req-phone"
                  type="tel"
                  required
                  placeholder="+91 98611 45290"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm tabular-nums min-h-[44px]"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label htmlFor="req-notes" className="block text-sm font-medium text-[#1A241B] mb-1">
                  Additional Notes
                </label>
                <textarea
                  id="req-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Quality grade, packaging, morning drop-off preferences..."
                  className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm"
                />
              </div>

              {error && (
                <p className="md:col-span-2 lg:col-span-3 text-sm text-red-700 font-medium">
                  {error}
                </p>
              )}

              <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPostForm(false)}
                  className="px-4 py-2.5 rounded-lg border border-[#DCE6D9] text-sm font-medium text-[#4A594C] min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] disabled:opacity-60 min-h-[44px]"
                >
                  {submitting ? 'Posting...' : 'Publish Buyer Requirement'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Rule-Based Active Matches */}
      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-[#2E7D32]">
            Transparent Rule-Based Matching (Product · Quantity · District · Budget · Availability)
          </p>
          <h2 className="font-display font-bold text-2xl text-[#1A241B] mt-1">
            Compatible Farmer–Buyer Matches ({matches.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {matches.slice(0, 6).map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-xl border border-[#DCE6D9] p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#DCE6D9]">
                <div>
                  <p className="text-xs font-semibold text-[#1B5E20] tabular-nums">
                    {match.tier} · Score {match.score}/100
                    {match.product.isDemo || match.requirement.isDemo ? ' · DEMO DATA' : ''}
                  </p>
                  <h3 className="font-display font-bold text-lg text-[#1A241B] mt-0.5">
                    {match.product.name} — {match.product.farmerName} ↔{' '}
                    {match.requirement.businessName}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-[#F8FAF5] border border-[#DCE6D9]">
                  <p className="text-xs text-[#4A594C]">Farmer Offer ({match.product.district})</p>
                  <p className="font-semibold text-[#1A241B] tabular-nums mt-0.5">
                    {formatQuantity(match.product.availableQuantity, match.product.unit)} @{' '}
                    {formatINR(match.product.expectedPrice)}/{match.product.unit}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#F8FAF5] border border-[#DCE6D9]">
                  <p className="text-xs text-[#4A594C]">
                    Buyer Need ({match.requirement.district})
                  </p>
                  <p className="font-semibold text-[#1A241B] tabular-nums mt-0.5">
                    {formatQuantity(match.requirement.requiredQuantity, match.requirement.unit)} @
                    max {formatINR(match.requirement.maxBudgetPerUnit)}/{match.requirement.unit}
                  </p>
                </div>
              </div>

              <ul className="space-y-1.5 text-xs text-[#4A594C]">
                {match.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#2E7D32] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <WhatsAppButton
                  phone={match.requirement.contactNumber}
                  message={buildRequirementWhatsAppMessage(
                    match.requirement.productName,
                    match.requirement.businessName,
                    formatQuantity(match.requirement.requiredQuantity, match.requirement.unit)
                  )}
                  label="WhatsApp Buyer"
                  variant="primary"
                />
                <WhatsAppButton
                  phone={match.product.farmerMobile}
                  message={buildProductWhatsAppMessage(
                    match.product.name,
                    match.product.farmerName,
                    `${formatINR(match.product.expectedPrice)}/${match.product.unit}`
                  )}
                  label="WhatsApp Farmer"
                  variant="outline"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Open Buyer Requirements List */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display font-bold text-2xl text-[#1A241B]">
            All Open Buyer Requirements ({filteredReqs.length})
          </h2>
          <select
            aria-label="Filter requirements by district"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-3.5 py-2 rounded-lg border border-[#DCE6D9] bg-white text-sm min-h-[40px]"
          >
            <option value="All">All Districts</option>
            {WESTERN_ODISHA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReqs.map((req) => (
            <article
              key={req.id}
              className="bg-white rounded-xl border border-[#DCE6D9] p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <p className="text-xs text-[#4A594C]">
                  {req.category} · {req.district}
                  {req.isDemo ? ' · DEMO DATA' : ''}
                </p>
                <div className="mt-1.5 flex items-baseline justify-between gap-2">
                  <h3 className="font-display font-bold text-lg text-[#1A241B]">
                    {req.productName}
                  </h3>
                  <span className="font-display font-bold text-base text-[#1B5E20] tabular-nums">
                    Up to {formatINR(req.maxBudgetPerUnit)}/{req.unit}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#1A241B] mt-2">{req.businessName}</p>
                <p className="text-xs text-[#4A594C] mt-1 tabular-nums">
                  Needs {formatQuantity(req.requiredQuantity, req.unit)} · By{' '}
                  {formatShortDate(req.requiredDeliveryDate)}
                </p>
                <p className="text-xs text-[#4A594C] mt-1">Location: {req.deliveryLocation}</p>
                {req.notes && (
                  <p className="text-xs text-[#4A594C] mt-2.5 leading-relaxed">{req.notes}</p>
                )}
              </div>

              <div className="pt-3 border-t border-[#DCE6D9]">
                <WhatsAppButton
                  phone={req.contactNumber}
                  message={buildRequirementWhatsAppMessage(
                    req.productName,
                    req.businessName,
                    formatQuantity(req.requiredQuantity, req.unit)
                  )}
                  label="Contact Buyer on WhatsApp"
                  variant="outline"
                  className="w-full"
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
