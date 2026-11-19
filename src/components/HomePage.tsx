import { ArrowRight, Check, Scale, Sprout, Handshake, ShieldCheck, Truck } from 'lucide-react';
import type { MatchResult, Product } from '../types';
import { GENERATED_IMAGES, formatQuantity, formatShortDate } from '../utils/format';
import { formatINR } from '../utils/projections';
import { buildProductWhatsAppMessage } from '../utils/whatsapp';
import { ProduceImage } from './ProduceImage';
import { WhatsAppButton } from './WhatsAppButton';
import type { AppView } from './Navbar';

interface HomePageProps {
  products: Product[];
  matches: MatchResult[];
  loading?: boolean;
  onNavigate: (view: AppView) => void;
  onJoinRole: (role: 'farmer' | 'buyer') => void;
  onSelectProduct: (product: Product) => void;
}

const WHY_CHOOSE_ITEMS = [
  {
    title: 'Direct Farmer-to-Buyer Connection',
    description:
      'Connect growers in Bargarh and Sambalpur directly with local grocery stores, restaurants, wholesalers, and households.',
    icon: Handshake,
  },
  {
    title: 'Fair and Transparent Pricing',
    description:
      'Farmers set clear per-kilogram or per-quintal prices upfront, while buyers compare listings without hidden commission markups.',
    icon: Scale,
  },
  {
    title: 'Fresh Agricultural Products',
    description:
      'Discover produce listed right after harvest with visible village origin and harvest date, cutting down storage delays.',
    icon: Sprout,
  },
  {
    title: 'Better Market Access',
    description:
      'Rule-based matching alerts farmers to active local buyer requirements during peak harvest seasons to reduce produce wastage.',
    icon: Truck,
  },
  {
    title: 'Reduced Dependence on Middlemen',
    description:
      'Coordinate quantities, negotiation, and delivery directly on WhatsApp and track order status in one organized workspace.',
    icon: ShieldCheck,
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Farmers Register',
    detail: 'Farmers create an account with their mobile number, village, district, and farm details.',
  },
  {
    step: '02',
    title: 'Farmers List Their Produce',
    detail: 'Add fresh vegetables, fruits, or grains with available quantity, harvest date, and expected ₹ price.',
  },
  {
    step: '03',
    title: 'Buyers Browse & Submit Requirements',
    detail: 'Retailers, restaurants, and households search produce or post bulk buying requirements.',
  },
  {
    step: '04',
    title: 'Farmers and Buyers Connect',
    detail: 'Our rule-based matching pairs compatible listings and lets both sides coordinate directly via WhatsApp.',
  },
  {
    step: '05',
    title: 'Order Confirmation & Delivery Coordination',
    detail: 'Accept enquiries, confirm pricing and quantities, and track orders from enquiry to completion.',
  },
];

export function HomePage({
  products,
  matches,
  loading = false,
  onNavigate,
  onJoinRole,
  onSelectProduct,
}: HomePageProps) {
  const featuredProducts = products.slice(0, 6);
  const topMatch = matches[0];

  return (
    <div>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#143D18] text-white">
        <div className="absolute inset-0">
          <ProduceImage
            src={GENERATED_IMAGES.hero}
            alt="Western Odisha farmer inspecting freshly harvested tomatoes and green vegetables in sunlit fields"
            className="w-full h-full object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-[#0F2C12]/78 lg:bg-transparent lg:bg-gradient-to-r lg:from-[#0F2C12]/92 lg:via-[#143D18]/78 lg:to-[#143D18]/35"
            aria-hidden="true"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <div className="max-w-2xl space-y-6">
            <p className="text-sm font-semibold text-[#FFD54F] tracking-wide">
              Bargarh · Sambalpur · Western Odisha Agricultural Marketplace
            </p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[54px] leading-[1.08] tracking-tight text-white headline-balance">
              From Farm to Buyer, Without Unnecessary Middlemen.
            </h1>
            <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-xl">
              FreshKart Agro Connect helps farmers sell directly to retailers, restaurants, and
              consumers while providing buyers with fresh agricultural products at fair prices.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onJoinRole('farmer')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#F9A825] text-[#1A241B] font-semibold text-base hover:bg-[#F59E0B] transition-colors min-h-[48px] whitespace-nowrap"
              >
                <span>Join as Farmer</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('marketplace')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-white text-[#1B5E20] font-semibold text-base hover:bg-[#E8F5E9] transition-colors min-h-[48px] whitespace-nowrap"
              >
                <span>Explore Marketplace</span>
              </button>
            </div>
            <p className="text-xs text-white/75 pt-2">
              Connecting Farmers Directly to Buyers · Direct WhatsApp coordination · Zero online
              payment fees in MVP pilot
            </p>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE FRESHKART */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#DCE6D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#2E7D32] tracking-wide">
              Built for Western Odisha Agriculture
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#1A241B] mt-2 headline-balance">
              Why Choose FreshKart Agro Connect
            </h2>
            <p className="text-[#4A594C] mt-3 leading-relaxed">
              Practical digital tools designed for local farmers and buyers in Bargarh, Sambalpur,
              and neighboring districts.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {WHY_CHOOSE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-6 rounded-xl bg-[#F8FAF5] border border-[#DCE6D9] flex flex-col"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#E8F5E9] text-[#1B5E20] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-display font-semibold text-base text-[#1A241B]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#4A594C] leading-relaxed mt-2">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS SECTION */}
      <section className="py-16 sm:py-20 bg-[#F8FAF5] border-b border-[#DCE6D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#2E7D32]">
                Fresh Harvest Listings · Sample Showcase (DEMO DATA)
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#1A241B] mt-1.5">
                Featured Farm Produce
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('marketplace')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B5E20] hover:text-[#2E7D32] whitespace-nowrap self-start sm:self-auto"
            >
              <span>
                {loading && products.length === 0
                  ? 'Explore All Listings'
                  : `View All ${products.length} Listings`}
              </span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && featuredProducts.length === 0 ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-[#DCE6D9] overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-[#E8F5E9]/70" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-1/2 bg-[#E8F5E9] rounded" />
                    <div className="h-5 w-2/3 bg-[#E8F5E9] rounded" />
                    <div className="h-3 w-3/4 bg-[#E8F5E9] rounded" />
                  </div>
                </div>
              ))
            ) : featuredProducts.map((product) => (
              <article
                key={product.id}
                className="bg-white rounded-xl border border-[#DCE6D9] overflow-hidden flex flex-col hover:border-[#2E7D32]/50 transition-colors"
              >
                <div className="aspect-[4/3] bg-[#F8FAF5] overflow-hidden">
                  <ProduceImage
                    src={product.image}
                    alt={`${product.name} harvested in ${product.district}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-xs text-[#4A594C]">
                    <span>
                      {product.category} · {product.district}
                    </span>
                    <span className="font-medium text-[#1B5E20]">
                      {product.isDemo ? 'DEMO DATA' : product.availabilityStatus}
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between gap-3">
                    <h3 className="font-display font-bold text-xl text-[#1A241B]">
                      {product.name}
                    </h3>
                    <p className="font-display font-bold text-lg text-[#1B5E20] tabular-nums whitespace-nowrap">
                      {formatINR(product.expectedPrice)}/{product.unit}
                    </p>
                  </div>

                  <p className="mt-2 text-sm text-[#4A594C]">
                    Farmer: <span className="font-medium text-[#1A241B]">{product.farmerName}</span>{' '}
                    ({product.village})
                  </p>
                  <p className="mt-1 text-xs text-[#4A594C] tabular-nums">
                    Available: {formatQuantity(product.availableQuantity, product.unit)} · Harvested{' '}
                    {formatShortDate(product.harvestDate)}
                  </p>

                  <div className="mt-5 pt-4 border-t border-[#DCE6D9] flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="flex-1 py-2.5 px-3.5 rounded-lg bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#1B5E20] transition-colors min-h-[40px] whitespace-nowrap"
                    >
                      View Details
                    </button>
                    <WhatsAppButton
                      phone={product.farmerMobile}
                      message={buildProductWhatsAppMessage(
                        product.name,
                        product.farmerName,
                        `${formatINR(product.expectedPrice)}/${product.unit}`
                      )}
                      label="Contact Farmer"
                      variant="outline"
                      size="sm"
                      className="min-h-[40px]"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (5 STEPS) + RULE-BASED MATCHING SPOTLIGHT */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#DCE6D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#2E7D32]">Simple 5-Step Process</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#1A241B] mt-1.5">
              How FreshKart Works
            </h2>
          </div>

          <ol className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {HOW_IT_WORKS_STEPS.map((item) => (
              <li
                key={item.step}
                className="p-5 rounded-xl border border-[#DCE6D9] bg-[#F8FAF5] space-y-2.5"
              >
                <span className="font-mono text-sm font-semibold text-[#2E7D32] tabular-nums">
                  Step {item.step}
                </span>
                <h3 className="font-display font-semibold text-base text-[#1A241B]">
                  {item.title}
                </h3>
                <p className="text-sm text-[#4A594C] leading-relaxed">{item.detail}</p>
              </li>
            ))}
          </ol>

          {/* Transparent Rule-Based Matching Spotlight */}
          {topMatch && (
            <div className="mt-12 p-6 sm:p-8 rounded-xl bg-[#F8FAF5] border border-[#DCE6D9]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <p className="text-xs font-semibold text-[#1B5E20]">
                    Transparent Rule-Based Farmer–Buyer Matching · Live MVP Preview (DEMO DATA)
                  </p>
                  <h3 className="font-display font-bold text-2xl text-[#1A241B]">
                    Automatic Compatibility Without Black-Box Claims
                  </h3>
                  <p className="text-sm text-[#4A594C] leading-relaxed">
                    FreshKart compares produce name, quantity, district proximity, buyer budget, and
                    harvest availability using clear rules so both farmers and buyers see exactly
                    why a match is recommended.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('requirements')}
                  className="px-5 py-3 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] transition-colors whitespace-nowrap self-start lg:self-center min-h-[44px]"
                >
                  Explore Buyer Requirements &amp; Matches
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-[#DCE6D9] grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#4A594C]">Farmer Listing</p>
                  <p className="font-semibold text-[#1A241B]">
                    {topMatch.product.farmerName} · {topMatch.product.district}
                  </p>
                  <p className="text-sm text-[#4A594C] tabular-nums">
                    {topMatch.product.name} —{' '}
                    {formatQuantity(topMatch.product.availableQuantity, topMatch.product.unit)} at{' '}
                    {formatINR(topMatch.product.expectedPrice)}/{topMatch.product.unit}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#4A594C]">Buyer Requirement</p>
                  <p className="font-semibold text-[#1A241B]">
                    {topMatch.requirement.businessName} · {topMatch.requirement.district}
                  </p>
                  <p className="text-sm text-[#4A594C] tabular-nums">
                    Needs {formatQuantity(topMatch.requirement.requiredQuantity, topMatch.requirement.unit)}{' '}
                    at up to {formatINR(topMatch.requirement.maxBudgetPerUnit)}/{topMatch.requirement.unit}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-[#1B5E20] tabular-nums">
                    {topMatch.tier} · Compatibility {topMatch.score}/100
                  </p>
                  <ul className="space-y-1 text-xs text-[#4A594C]">
                    {topMatch.reasons.slice(0, 3).map((reason) => (
                      <li key={reason} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#2E7D32] shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SEPARATE SECTIONS FOR FARMERS AND BUYERS */}
      <section className="py-16 sm:py-20 bg-[#F8FAF5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* For Farmers */}
          <div
            id="for-farmers"
            className="scroll-mt-24 bg-white rounded-xl border border-[#DCE6D9] p-8 flex flex-col justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-[#2E7D32]">For Farmers in Western Odisha</p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#1A241B] mt-2">
                Sell Directly From Your Farm at Fair Prices
              </h2>
              <p className="text-sm text-[#4A594C] mt-3 leading-relaxed">
                Designed to be simple on mobile phones. List your harvest in under two minutes and
                connect directly with verified local grocery shops, restaurants, and bulk buyers.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[#1A241B]">
                {[
                  'Set your own expected price per Kg or Quintal with full transparency.',
                  'Discover active buyer requirements in Bargarh, Sambalpur, and nearby districts.',
                  'Receive purchase enquiries and confirm orders directly without intermediaries.',
                  'Coordinate harvest pickup and direct payment easily over WhatsApp.',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[#DCE6D9]">
              <button
                type="button"
                onClick={() => onJoinRole('farmer')}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] transition-colors min-h-[46px]"
              >
                Register as a Farmer
              </button>
            </div>
          </div>

          {/* For Buyers */}
          <div
            id="for-buyers"
            className="scroll-mt-24 bg-white rounded-xl border border-[#DCE6D9] p-8 flex flex-col justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-[#2E7D32]">
                For Retailers, Restaurants, Wholesalers &amp; Households
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#1A241B] mt-2">
                Source Fresh Produce Directly From Local Farms
              </h2>
              <p className="text-sm text-[#4A594C] mt-3 leading-relaxed">
                Whether you run a grocery store in Bargarh, a restaurant in Sambalpur, or buy for
                your family kitchen, FreshKart gives you direct visibility into farm origin and
                harvest freshness.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[#1A241B]">
                {[
                  'Search and filter produce by category, district, quantity, and ₹ price range.',
                  'Post your exact bulk purchase requirements and target budget per unit.',
                  'Get automatic rule-based suggestions of compatible farmers nearby.',
                  'Track every enquiry and order status transparently from one dashboard.',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[#DCE6D9] flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onJoinRole('buyer')}
                className="px-6 py-3 rounded-lg bg-[#1B5E20] text-white text-sm font-semibold hover:bg-[#144718] transition-colors min-h-[46px]"
              >
                Register as a Buyer
              </button>
              <button
                type="button"
                onClick={() => onNavigate('marketplace')}
                className="px-6 py-3 rounded-lg border border-[#DCE6D9] text-[#1A241B] text-sm font-semibold hover:bg-[#F8FAF5] transition-colors min-h-[46px]"
              >
                Browse Produce
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
