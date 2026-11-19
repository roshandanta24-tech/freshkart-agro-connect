import { useEffect, useState } from 'react';
import { X, MapPin, Calendar, Package, User, CheckCircle2 } from 'lucide-react';
import type { Product, PublicUser } from '../types';
import { formatINR } from '../utils/projections';
import { formatQuantity, formatShortDate } from '../utils/format';
import {
  buildBuyerEnquiryFollowUpMessage,
  buildProductWhatsAppMessage,
} from '../utils/whatsapp';
import { ProduceImage } from './ProduceImage';
import { WhatsAppButton } from './WhatsAppButton';
import { api } from '../lib/api';

interface ProductDetailModalProps {
  product: Product;
  user: PublicUser | null;
  onClose: () => void;
  onRequireLogin: () => void;
  onEnquirySubmitted: () => void;
}

export function ProductDetailModal({
  product,
  user,
  onClose,
  onRequireLogin,
  onEnquirySubmitted,
}: ProductDetailModalProps) {
  const [buyerName, setBuyerName] = useState(
    user?.businessName ? `${user.fullName} (${user.businessName})` : user?.fullName || ''
  );
  const [requiredQuantity, setRequiredQuantity] = useState(
    String(Math.max(1, Math.min(100, product.availableQuantity || 1)))
  );
  const [expectedPrice, setExpectedPrice] = useState(String(product.expectedPrice));
  const [deliveryLocation, setDeliveryLocation] = useState(
    user ? `${user.village}, ${user.district}` : `${product.district} Main Market`
  );
  const [preferredPurchaseDate, setPreferredPurchaseDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  );
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setRequiredQuantity(String(Math.max(1, Math.min(100, product.availableQuantity || 1))));
    setExpectedPrice(String(product.expectedPrice));
    setMessage('');
    setError('');
    setSubmitted(false);
  }, [product.id, product.availableQuantity, product.expectedPrice]);

  useEffect(() => {
    if (user) {
      setBuyerName(user.businessName ? `${user.fullName} (${user.businessName})` : user.fullName);
      setDeliveryLocation(`${user.village}, ${user.district}`);
    }
  }, [user]);

  const isOutOfStock =
    product.availabilityStatus === 'Out of Stock' || product.availableQuantity <= 0;
  const canEnquire = user?.role === 'buyer' || user?.role === 'admin';
  const whatsappMessage = buildProductWhatsAppMessage(
    product.name,
    product.farmerName,
    `${formatINR(product.expectedPrice)}/${product.unit}`
  );
  const followUpMessage = buildBuyerEnquiryFollowUpMessage(
    product.farmerName,
    product.name,
    formatQuantity(Number(requiredQuantity) || 1, product.unit)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!canEnquire) {
      onRequireLogin();
      return;
    }

    const qty = Number(requiredQuantity);
    const price = Number(expectedPrice);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Please enter a valid required quantity.');
      return;
    }
    if (qty > product.availableQuantity) {
      setError(
        `Requested quantity cannot exceed available stock (${product.availableQuantity} ${product.unit}).`
      );
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Please enter a valid expected price.');
      return;
    }
    if (!deliveryLocation.trim()) {
      setError('Please enter your delivery or pickup location.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createEnquiry({
        productId: product.id,
        buyerName: buyerName.trim(),
        requiredQuantity: qty,
        expectedPrice: price,
        deliveryLocation: deliveryLocation.trim(),
        preferredPurchaseDate,
        message: message.trim(),
      });
      setSubmitted(true);
      onEnquirySubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
    >
      <div className="bg-white rounded-xl max-w-4xl w-full shadow-xl border border-[#DCE6D9] max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-6 py-4 border-b border-[#DCE6D9] flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#4A594C]">
              {product.category} · {product.village}, {product.district}
              {product.isDemo ? ' · DEMO DATA' : ''}
            </p>
            <h2
              id="product-detail-title"
              className="font-display font-bold text-xl sm:text-2xl text-[#1A241B]"
            >
              {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#4A594C] hover:bg-[#E8F5E9]"
            aria-label="Close product details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column: Photo, Specs & Farmer Profile */}
          <div className="lg:col-span-5 space-y-5">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#F8FAF5] border border-[#DCE6D9]">
              <ProduceImage src={product.image} alt={`${product.name} from ${product.district}`} />
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between pb-3 border-b border-[#DCE6D9]">
                <span className="font-display font-bold text-2xl text-[#1B5E20] tabular-nums">
                  {formatINR(product.expectedPrice)}
                  <span className="text-sm font-normal text-[#4A594C]"> / {product.unit}</span>
                </span>
                <span
                  className={`text-sm font-semibold ${
                    product.availabilityStatus === 'Available'
                      ? 'text-[#2E7D32]'
                      : product.availabilityStatus === 'Limited Stock'
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }`}
                >
                  {product.availabilityStatus}
                </span>
              </div>

              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-[#4A594C] flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#2E7D32]" aria-hidden="true" />
                    Available Quantity
                  </dt>
                  <dd className="font-semibold text-[#1A241B] tabular-nums">
                    {formatQuantity(product.availableQuantity, product.unit)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#4A594C] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#2E7D32]" aria-hidden="true" />
                    Harvest Date
                  </dt>
                  <dd className="font-medium text-[#1A241B]">
                    {formatShortDate(product.harvestDate)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[#4A594C] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#2E7D32]" aria-hidden="true" />
                    Farm Origin
                  </dt>
                  <dd className="font-medium text-[#1A241B]">
                    {product.village}, {product.district}
                  </dd>
                </div>
              </dl>

              {product.description && (
                <p className="text-sm text-[#4A594C] leading-relaxed pt-2">
                  {product.description}
                </p>
              )}
            </div>

            {/* Farmer Information Card */}
            <div className="p-4 rounded-xl bg-[#F8FAF5] border border-[#DCE6D9] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E8F5E9] text-[#1B5E20] flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-[#4A594C]">Listed Directly By Farmer</p>
                  <p className="font-semibold text-[#1A241B]">{product.farmerName}</p>
                </div>
              </div>
              <p className="text-xs text-[#4A594C] tabular-nums">
                {product.village}, {product.district}, Odisha · {product.farmerMobile}
              </p>
              <WhatsAppButton
                phone={product.farmerMobile}
                message={whatsappMessage}
                label="Contact Farmer on WhatsApp"
                variant="primary"
                size="md"
                className="w-full"
              />
            </div>
          </div>

          {/* Right column: Buyer Enquiry Form */}
          <div className="lg:col-span-7">
            <div className="p-6 rounded-xl border border-[#DCE6D9] bg-white">
              <h3 className="font-display font-bold text-xl text-[#1A241B]">
                Submit Purchase Enquiry
              </h3>
              <p className="text-sm text-[#4A594C] mt-1">
                Send your quantity and price offer directly to {product.farmerName}. Your enquiry
                appears immediately in the farmer&apos;s dashboard.
              </p>

              {submitted ? (
                <div className="mt-6 p-6 rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/25 space-y-3">
                  <div className="flex items-center gap-2 text-[#1B5E20] font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Purchase Enquiry Sent Successfully!</span>
                  </div>
                  <p className="text-sm text-[#1A241B]/85">
                    {product.farmerName} has received your enquiry for{' '}
                    <strong>
                      {requiredQuantity} {product.unit} of {product.name}
                    </strong>{' '}
                    at <strong>{formatINR(Number(expectedPrice))}/{product.unit}</strong>. You can
                    track its status in your Buyer Dashboard or coordinate faster on WhatsApp.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <WhatsAppButton
                      phone={product.farmerMobile}
                      message={followUpMessage}
                      label="Follow Up on WhatsApp"
                      variant="primary"
                      size="md"
                    />
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-lg border border-[#1B5E20]/30 text-sm font-semibold text-[#1B5E20] hover:bg-white min-h-[44px]"
                    >
                      Back to Marketplace
                    </button>
                  </div>
                </div>
              ) : isOutOfStock ? (
                <div className="mt-6 p-6 rounded-xl bg-[#F8FAF5] border border-[#DCE6D9] space-y-3">
                  <p className="text-sm text-red-700 font-semibold">
                    This listing is currently Out of Stock.
                  </p>
                  <p className="text-sm text-[#4A594C]">
                    Purchase enquiries are disabled until {product.farmerName} updates harvest
                    availability. You can still message the farmer directly via WhatsApp to check on
                    upcoming harvest dates.
                  </p>
                </div>
              ) : !user ? (
                <div className="mt-6 p-6 rounded-xl bg-[#F8FAF5] border border-[#DCE6D9] space-y-4">
                  <p className="text-sm text-[#1A241B] font-medium">
                    Please log in with a Buyer account to submit a purchase enquiry and track order
                    status.
                  </p>
                  <p className="text-xs text-[#4A594C]">
                    You can also contact the farmer directly using the WhatsApp button on the left.
                  </p>
                  <button
                    type="button"
                    onClick={onRequireLogin}
                    className="px-5 py-2.5 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] min-h-[44px]"
                  >
                    Log In or Register as Buyer
                  </button>
                </div>
              ) : !canEnquire ? (
                <div className="mt-6 p-5 rounded-xl bg-[#F8FAF5] border border-[#DCE6D9] text-sm text-[#4A594C]">
                  You are currently signed in as a <strong>Farmer</strong>. Switch to a Buyer
                  account to submit purchase enquiries on produce listings.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="enq-buyer-name"
                        className="block text-sm font-medium text-[#1A241B] mb-1"
                      >
                        Buyer / Business Name
                      </label>
                      <input
                        id="enq-buyer-name"
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="enq-product-name"
                        className="block text-sm font-medium text-[#1A241B] mb-1"
                      >
                        Product Name
                      </label>
                      <input
                        id="enq-product-name"
                        type="text"
                        readOnly
                        value={product.name}
                        className="w-full rounded-lg border border-[#DCE6D9] bg-[#F8FAF5] px-3.5 py-2.5 text-sm text-[#4A594C] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="enq-quantity"
                        className="block text-sm font-medium text-[#1A241B] mb-1"
                      >
                        Required Quantity ({product.unit})
                      </label>
                      <input
                        id="enq-quantity"
                        type="number"
                        required
                        min="1"
                        max={product.availableQuantity}
                        value={requiredQuantity}
                        onChange={(e) => setRequiredQuantity(e.target.value)}
                        className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm tabular-nums min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="enq-price"
                        className="block text-sm font-medium text-[#1A241B] mb-1"
                      >
                        Expected Price (₹ per {product.unit})
                      </label>
                      <input
                        id="enq-price"
                        type="number"
                        required
                        min="1"
                        step="0.5"
                        value={expectedPrice}
                        onChange={(e) => setExpectedPrice(e.target.value)}
                        className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm tabular-nums min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="enq-location"
                        className="block text-sm font-medium text-[#1A241B] mb-1"
                      >
                        Delivery / Pickup Location
                      </label>
                      <input
                        id="enq-location"
                        type="text"
                        required
                        value={deliveryLocation}
                        onChange={(e) => setDeliveryLocation(e.target.value)}
                        placeholder="e.g. Bargarh Main Market"
                        className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="enq-date"
                        className="block text-sm font-medium text-[#1A241B] mb-1"
                      >
                        Preferred Purchase Date
                      </label>
                      <input
                        id="enq-date"
                        type="date"
                        required
                        value={preferredPurchaseDate}
                        onChange={(e) => setPreferredPurchaseDate(e.target.value)}
                        className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="enq-notes"
                      className="block text-sm font-medium text-[#1A241B] mb-1"
                    >
                      Additional Requirements
                    </label>
                    <textarea
                      id="enq-notes"
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Quality preferences, crate/bag packaging, pickup time..."
                      className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-[#F8FAF5] border border-[#DCE6D9] flex items-center justify-between text-sm">
                    <span className="text-[#4A594C]">Estimated Order Value</span>
                    <span className="font-display font-bold text-lg text-[#1B5E20] tabular-nums">
                      {formatINR(
                        Math.max(0, Number(requiredQuantity) || 0) *
                          Math.max(0, Number(expectedPrice) || 0)
                      )}
                    </span>
                  </div>

                  {error && <p className="text-sm text-red-700 font-medium">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-5 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] disabled:opacity-60 transition-colors min-h-[46px]"
                  >
                    {submitting ? 'Submitting Enquiry...' : 'Submit Purchase Enquiry'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
