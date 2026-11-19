/**
 * Validate and normalize an Indian mobile number for WhatsApp click-to-chat.
 * Accepts 10-digit numbers starting with 6-9, optionally prefixed with +91 or 91 or 0.
 * Returns normalized 12-digit string "91XXXXXXXXXX" or null if invalid.
 */
export function normalizeIndianPhone(rawPhone: string | undefined | null): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D/g, '');

  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.slice(1))) {
    return `91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    return digits;
  }
  return null;
}

export function isValidIndianPhone(rawPhone: string | undefined | null): boolean {
  return normalizeIndianPhone(rawPhone) !== null;
}

export function formatIndianPhone(rawPhone: string): string {
  const normalized = normalizeIndianPhone(rawPhone);
  if (!normalized) return rawPhone;
  const ten = normalized.slice(2);
  return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
}

export function buildWhatsAppLink(
  rawPhone: string | undefined | null,
  customMessage?: string
): string | null {
  const normalized = normalizeIndianPhone(rawPhone);
  if (!normalized) return null;

  const defaultMessage =
    'Hello, I found your agricultural product on FreshKart Agro Connect. I am interested in purchasing it. Please share more details.';

  const text = encodeURIComponent(customMessage || defaultMessage);
  return `https://wa.me/${normalized}?text=${text}`;
}

export function buildProductWhatsAppMessage(
  productName: string,
  farmerName?: string,
  priceText?: string
): string {
  const greeting = farmerName ? `Hello ${farmerName},` : 'Hello,';
  const pricePart = priceText ? ` (${priceText})` : '';
  return `${greeting} I found your ${productName}${pricePart} on FreshKart Agro Connect. I am interested in purchasing it. Please share more details.`;
}

export function buildRequirementWhatsAppMessage(
  productName: string,
  businessName: string,
  quantityText: string
): string {
  return `Hello ${businessName}, I saw your buyer requirement for ${quantityText} of ${productName} on FreshKart Agro Connect. I have fresh produce available from my farm. Let's coordinate directly.`;
}

export function buildOrderWhatsAppMessage(
  orderId: string,
  productName: string,
  status: string
): string {
  return `Hello, regarding FreshKart Agro Connect Order #${orderId} (${productName} — Status: ${status}). Let's coordinate pickup/delivery and direct settlement details.`;
}

export function buildFarmerEnquiryReplyMessage(
  buyerName: string,
  productName: string,
  quantityText: string,
  priceText: string
): string {
  return `Hello ${buyerName}, I received your FreshKart Agro Connect enquiry for ${quantityText} of ${productName} (${priceText}). Let's confirm availability and pickup/delivery details.`;
}

export function buildBuyerEnquiryFollowUpMessage(
  farmerName: string | undefined,
  productName: string,
  quantityText: string
): string {
  const greeting = farmerName ? `Hello ${farmerName},` : 'Hello,';
  return `${greeting} I submitted a purchase enquiry on FreshKart Agro Connect for ${quantityText} of ${productName}. Please share availability and pickup/delivery details.`;
}

