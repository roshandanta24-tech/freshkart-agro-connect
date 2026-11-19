import { MessageCircle } from 'lucide-react';
import { buildWhatsAppLink } from '../utils/whatsapp';

interface WhatsAppButtonProps {
  phone?: string;
  message?: string;
  label?: string;
  variant?: 'primary' | 'outline' | 'subtle';
  size?: 'sm' | 'md';
  className?: string;
}

export function WhatsAppButton({
  phone,
  message,
  label = 'WhatsApp',
  variant = 'outline',
  size = 'sm',
  className = '',
}: WhatsAppButtonProps) {
  const href = buildWhatsAppLink(phone, message);

  const sizeStyles =
    size === 'md'
      ? 'px-4 py-2.5 text-sm min-h-[44px]'
      : 'px-3 py-2 text-xs min-h-[38px]';

  const variantStyles =
    variant === 'primary'
      ? 'bg-[#2E7D32] text-white hover:bg-[#1B5E20] border border-[#2E7D32]'
      : variant === 'subtle'
      ? 'bg-[#E8F5E9] text-[#1B5E20] hover:bg-[#D5EAD7] border border-transparent'
      : 'bg-white text-[#1B5E20] hover:bg-[#E8F5E9] border border-[#2E7D32]/30';

  if (!href) {
    return (
      <span
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 bg-neutral-100 text-neutral-500 border border-neutral-200 cursor-not-allowed ${sizeStyles} ${className}`}
        title="Valid Indian mobile number required for WhatsApp"
      >
        <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Phone Unavailable</span>
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${sizeStyles} ${variantStyles} ${className}`}
    >
      <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
}
