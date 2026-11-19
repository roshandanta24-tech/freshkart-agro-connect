import { useState } from 'react';
import { Sprout, MapPin, Phone, Mail, X } from 'lucide-react';
import type { AppView } from './Navbar';

interface FooterProps {
  onNavigate: (view: AppView, sectionId?: string) => void;
  onOpenRegisterRole: (role: 'farmer' | 'buyer') => void;
}

export function Footer({ onNavigate, onOpenRegisterRole }: FooterProps) {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  return (
    <>
      <footer className="bg-[#1B5E20] text-[#E8F5E9] border-t border-[#144718]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* About FreshKart */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[#F9A825] text-[#1A241B] flex items-center justify-center shrink-0">
                  <Sprout className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="font-display font-bold text-lg text-white">
                  FreshKart Agro Connect
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#E8F5E9]/85">
                Connecting farmers in Western Odisha directly with grocery stores, wholesalers,
                restaurants, hotels, and households — reducing unnecessary middlemen and supporting
                transparent farm-gate pricing.
              </p>
              <p className="text-xs text-[#E8F5E9]/70">
                Pilot Service Region: Bargarh, Sambalpur &amp; nearby Western Odisha districts.
              </p>
            </div>

            {/* Platform Links */}
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-white text-base">Marketplace</h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('marketplace')}
                    className="text-[#E8F5E9]/85 hover:text-white transition-colors"
                  >
                    Browse Agricultural Produce
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('requirements')}
                    className="text-[#E8F5E9]/85 hover:text-white transition-colors"
                  >
                    Buyer Requirements Board
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('about')}
                    className="text-[#E8F5E9]/85 hover:text-white transition-colors"
                  >
                    About FreshKart &amp; Business Model
                  </button>
                </li>
              </ul>
            </div>

            {/* Registration */}
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-white text-base">Join FreshKart</h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenRegisterRole('farmer')}
                    className="text-[#E8F5E9]/85 hover:text-white transition-colors"
                  >
                    Farmer Registration
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenRegisterRole('buyer')}
                    className="text-[#E8F5E9]/85 hover:text-white transition-colors"
                  >
                    Buyer Registration
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="text-[#E8F5E9]/85 hover:text-white transition-colors"
                  >
                    Account Login
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-white text-base">
                Contact Information
              </h3>
              <ul className="space-y-2.5 text-sm text-[#E8F5E9]/85">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#F9A825]" aria-hidden="true" />
                  <span>Bargarh &amp; Sambalpur Field Desk, Western Odisha, India</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 shrink-0 text-[#F9A825]" aria-hidden="true" />
                  <span className="tabular-nums">+91 94370 11223 (Demo Desk)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 shrink-0 text-[#F9A825]" aria-hidden="true" />
                  <span>contact@freshkart-agro.demo</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#E8F5E9]/75">
            <p>
              © {new Date().getFullYear()} FreshKart Agro Connect (Western Odisha MVP). Sample
              listings &amp; transactions are clearly labeled as DEMO DATA.
            </p>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="hover:text-white transition-colors"
              >
                Terms and Conditions
              </button>
            </div>
          </div>
        </div>
      </footer>

      {legalModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
        >
          <div className="bg-white rounded-xl max-w-xl w-full p-6 sm:p-8 shadow-xl border border-[#DCE6D9] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#DCE6D9]">
              <h2
                id="legal-modal-title"
                className="font-display font-bold text-xl text-[#1A241B]"
              >
                {legalModal === 'privacy' ? 'Privacy Policy' : 'Terms and Conditions'}
              </h2>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[#4A594C] hover:bg-[#E8F5E9]"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {legalModal === 'privacy' ? (
              <div className="mt-4 space-y-3 text-sm text-[#4A594C] leading-relaxed">
                <p>
                  FreshKart Agro Connect collects only the essential profile and produce details
                  needed to connect farmers and buyers in Western Odisha (name, mobile number,
                  district, village, and listing information).
                </p>
                <p>
                  Account passwords are encrypted using salted scrypt hashing and are never stored
                  in plain text. Private user details are accessible only to the account owner and
                  authorized FreshKart operations administrators.
                </p>
                <p>
                  WhatsApp contact links open directly on the user&apos;s own WhatsApp client so
                  farmers and buyers can communicate transparently.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-sm text-[#4A594C] leading-relaxed">
                <p>
                  FreshKart Agro Connect is a Minimum Viable Product (MVP) facilitating direct
                  discovery, transparent rule-based matching, and enquiry management between farmers
                  and buyers in Bargarh, Sambalpur, and neighboring Western Odisha districts.
                </p>
                <p>
                  This MVP does not include an integrated online payment gateway, automated
                  transport logistics, or GPS delivery tracking. All pricing confirmation, quality
                  inspection, pickup/delivery, and payments are coordinated directly between the
                  farmer and buyer.
                </p>
                <p>
                  No automatic commission is deducted during the pilot MVP phase. Future commission
                  terms will be communicated clearly upon commercial rollout.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="px-5 py-2.5 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
