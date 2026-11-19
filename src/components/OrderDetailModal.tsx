import { useEffect, useState } from 'react';
import { X, CheckCircle2, Info } from 'lucide-react';
import { ORDER_STATUSES, type Order, type OrderStatus } from '../types';
import { formatINR } from '../utils/projections';
import { formatQuantity, formatShortDate } from '../utils/format';
import { buildOrderWhatsAppMessage } from '../utils/whatsapp';
import { WhatsAppButton } from './WhatsAppButton';

interface OrderDetailModalProps {
  order: Order;
  canUpdate: boolean;
  viewerRole: 'farmer' | 'buyer' | 'admin';
  onClose: () => void;
  onUpdateOrder: (
    orderId: string,
    payload: { status?: OrderStatus; agreedPrice?: number; notes?: string }
  ) => Promise<void>;
}

export function OrderDetailModal({
  order,
  canUpdate,
  viewerRole,
  onClose,
  onUpdateOrder,
}: OrderDetailModalProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [agreedPrice, setAgreedPrice] = useState<string>(String(order.agreedPrice));
  const [notes, setNotes] = useState<string>(order.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    setStatus(order.status);
    setAgreedPrice(String(order.agreedPrice));
    setNotes(order.notes || '');
    setError('');
  }, [order.id, order.status, order.agreedPrice, order.notes]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSavedMsg('');
    const numPrice = Number(agreedPrice);
    if (!Number.isFinite(numPrice) || numPrice <= 0) {
      setError('Agreed price must be greater than zero.');
      return;
    }
    setSaving(true);
    try {
      await onUpdateOrder(order.id, {
        status,
        agreedPrice: numPrice,
        notes,
      });
      setSavedMsg('Order details updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order.');
    } finally {
      setSaving(false);
    }
  };

  const activeStepIdx = ORDER_STATUSES.indexOf(order.status);
  const whatsappMessage = buildOrderWhatsAppMessage(order.id, order.productName, order.status);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
    >
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-xl border border-[#DCE6D9] max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#DCE6D9] flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#4A594C] tabular-nums">
              Order ID {order.id} · {formatShortDate(order.orderDate)}
              {order.isDemo ? ' · DEMO DATA' : ''}
            </p>
            <h2
              id="order-detail-title"
              className="font-display font-bold text-2xl text-[#1A241B] mt-1"
            >
              {order.productName} — {formatQuantity(order.quantity, order.unit)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#4A594C] hover:bg-[#E8F5E9]"
            aria-label="Close order details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Value Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#F8FAF5] border border-[#DCE6D9]">
            <div>
              <p className="text-xs text-[#4A594C]">Quantity</p>
              <p className="font-display font-bold text-lg text-[#1A241B] tabular-nums mt-0.5">
                {formatQuantity(order.quantity, order.unit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#4A594C]">Agreed Price</p>
              <p className="font-display font-bold text-lg text-[#1A241B] tabular-nums mt-0.5">
                {formatINR(order.agreedPrice)} / {order.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#4A594C]">Total Order Value</p>
              <p className="font-display font-bold text-xl text-[#1B5E20] tabular-nums mt-0.5">
                {formatINR(order.totalValue)}
              </p>
            </div>
          </div>

          {/* Status Progression */}
          <div>
            <p className="text-xs font-semibold text-[#4A594C] mb-2">
              Current Status: <span className="text-[#1B5E20]">{order.status}</span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {ORDER_STATUSES.map((step, idx) => {
                const isCancelled = order.status === 'Cancelled';
                const isReached = !isCancelled && idx <= activeStepIdx;
                const isCurrent = step === order.status;
                return (
                  <div
                    key={step}
                    className={`p-2 rounded-lg border text-center text-[11px] leading-tight font-medium ${
                      isCurrent && step === 'Cancelled'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : isCurrent
                        ? 'bg-[#2E7D32] border-[#2E7D32] text-white'
                        : isReached
                        ? 'bg-[#E8F5E9] border-[#2E7D32]/20 text-[#1B5E20]'
                        : 'bg-white border-[#DCE6D9] text-[#4A594C]/70'
                    }`}
                  >
                    {step}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Farmer & Buyer Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[#DCE6D9] space-y-2">
              <p className="text-xs font-semibold text-[#4A594C]">Farmer Details</p>
              <p className="font-semibold text-[#1A241B]">{order.farmerName}</p>
              <p className="text-sm text-[#4A594C]">{order.farmerLocation}</p>
              <p className="text-sm text-[#4A594C] tabular-nums">{order.farmerMobile}</p>
              {viewerRole !== 'farmer' && (
                <div className="pt-1">
                  <WhatsAppButton
                    phone={order.farmerMobile}
                    message={whatsappMessage}
                    label="WhatsApp Farmer"
                  />
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-[#DCE6D9] space-y-2">
              <p className="text-xs font-semibold text-[#4A594C]">Buyer Details</p>
              <p className="font-semibold text-[#1A241B]">
                {order.buyerBusiness ? `${order.buyerBusiness} (${order.buyerName})` : order.buyerName}
              </p>
              <p className="text-sm text-[#4A594C]">{order.buyerLocation}</p>
              <p className="text-sm text-[#4A594C] tabular-nums">{order.buyerMobile}</p>
              {viewerRole !== 'buyer' && (
                <div className="pt-1">
                  <WhatsAppButton
                    phone={order.buyerMobile}
                    message={whatsappMessage}
                    label="WhatsApp Buyer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Direct Settlement Disclaimer */}
          <div className="p-3.5 rounded-lg bg-[#F8FAF5] border border-[#DCE6D9] flex items-start gap-2.5 text-xs text-[#4A594C]">
            <Info className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              FreshKart Agro Connect MVP does not process online payments. Please coordinate harvest
              pickup, delivery timing, and direct payment settlement directly via WhatsApp or phone.
            </span>
          </div>

          {/* Update Order Form */}
          {canUpdate && (
            <form onSubmit={handleSave} className="pt-4 border-t border-[#DCE6D9] space-y-4">
              <h3 className="font-display font-semibold text-base text-[#1A241B]">
                Update Order Status &amp; Coordination Notes
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="order-status-select"
                    className="block text-sm font-medium text-[#1A241B] mb-1.5"
                  >
                    Order Status
                  </label>
                  <select
                    id="order-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OrderStatus)}
                    className="w-full rounded-lg border border-[#DCE6D9] bg-white px-3.5 py-2.5 text-sm text-[#1A241B] min-h-[44px]"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="order-agreed-price"
                    className="block text-sm font-medium text-[#1A241B] mb-1.5"
                  >
                    Agreed Price (₹ per {order.unit})
                  </label>
                  <input
                    id="order-agreed-price"
                    type="number"
                    min="1"
                    step="0.5"
                    value={agreedPrice}
                    onChange={(e) => setAgreedPrice(e.target.value)}
                    className="w-full rounded-lg border border-[#DCE6D9] bg-white px-3.5 py-2.5 text-sm text-[#1A241B] tabular-nums min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="order-notes"
                  className="block text-sm font-medium text-[#1A241B] mb-1.5"
                >
                  Delivery / Pickup Notes
                </label>
                <textarea
                  id="order-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-[#DCE6D9] bg-white px-3.5 py-2.5 text-sm text-[#1A241B]"
                  placeholder="E.g. Morning 7 AM farm pickup confirmed..."
                />
              </div>

              {error && <p className="text-sm text-red-700 font-medium">{error}</p>}
              {savedMsg && (
                <p className="text-sm text-[#1B5E20] font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savedMsg}</span>
                </p>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg border border-[#DCE6D9] text-sm font-medium text-[#4A594C] hover:bg-[#F8FAF5] min-h-[44px]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] disabled:opacity-60 min-h-[44px]"
                >
                  {saving ? 'Saving...' : 'Save Order Update'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
