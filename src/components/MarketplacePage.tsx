import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import {
  PRODUCT_CATEGORIES,
  WESTERN_ODISHA_DISTRICTS,
  type Product,
} from '../types';
import { formatINR } from '../utils/projections';
import { formatQuantity, formatShortDate } from '../utils/format';
import { buildProductWhatsAppMessage } from '../utils/whatsapp';
import { ProduceImage } from './ProduceImage';
import { WhatsAppButton } from './WhatsAppButton';
import type { AppView } from './Navbar';

interface MarketplacePageProps {
  products: Product[];
  loading: boolean;
  onSelectProduct: (product: Product) => void;
  onNavigate: (view: AppView) => void;
}

type SortOption = 'recent' | 'price_asc' | 'price_desc';

export function MarketplacePage({
  products,
  loading,
  onSelectProduct,
  onNavigate,
}: MarketplacePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minQuantity, setMinQuantity] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedDistrict !== 'All' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    minQuantity !== '';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDistrict('All');
    setMinPrice('');
    setMaxPrice('');
    setMinQuantity('');
    setSortBy('recent');
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const minP = minPrice !== '' ? Number(minPrice) : null;
    const maxP = maxPrice !== '' ? Number(maxPrice) : null;
    const minQ = minQuantity !== '' ? Number(minQuantity) : null;

    const list = products.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.farmerName || ''} ${p.village} ${p.district} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (selectedDistrict !== 'All' && p.district !== selectedDistrict) return false;
      if (minP !== null && Number.isFinite(minP) && p.expectedPrice < minP) return false;
      if (maxP !== null && Number.isFinite(maxP) && p.expectedPrice > maxP) return false;
      if (minQ !== null && Number.isFinite(minQ) && p.availableQuantity < minQ) return false;
      return true;
    });

    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.expectedPrice - b.expectedPrice);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.expectedPrice - a.expectedPrice);
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [products, searchQuery, selectedCategory, selectedDistrict, minPrice, maxPrice, minQuantity, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#DCE6D9]">
        <div>
          <p className="text-xs font-semibold text-[#2E7D32]">
            Western Odisha Direct Produce Listings · Sample Items Labeled DEMO DATA
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#1A241B] mt-1.5">
            Agricultural Marketplace
          </h1>
          <p className="text-sm text-[#4A594C] mt-2 max-w-2xl">
            Browse vegetables, fruits, grains, and farm produce listed directly by farmers in
            Bargarh, Sambalpur, and nearby districts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('requirements')}
          className="px-4 py-2.5 rounded-lg border border-[#2E7D32] text-[#1B5E20] text-sm font-semibold hover:bg-[#E8F5E9] transition-colors whitespace-nowrap self-start md:self-auto min-h-[44px]"
        >
          View Buyer Requirements Board
        </button>
      </div>

      {/* Search & Filters Toolbar */}
      <section
        aria-label="Search and filter products"
        className="mt-6 bg-white rounded-xl border border-[#DCE6D9] p-5 space-y-4"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Search input */}
          <div className="lg:col-span-5 relative">
            <label htmlFor="market-search" className="sr-only">
              Search by product name, farmer, or location
            </label>
            <Search
              className="w-4 h-4 text-[#4A594C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="market-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product, farmer name, village, or district..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#DCE6D9] text-sm text-[#1A241B] min-h-[44px]"
            />
          </div>

          {/* District Filter */}
          <div className="lg:col-span-3">
            <label htmlFor="market-district" className="sr-only">
              Filter by district
            </label>
            <select
              id="market-district"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#DCE6D9] bg-white text-sm text-[#1A241B] min-h-[44px]"
            >
              <option value="All">All Western Odisha Districts</option>
              {WESTERN_ODISHA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="lg:col-span-4 flex items-center gap-2">
            <label htmlFor="market-sort" className="text-xs font-medium text-[#4A594C] whitespace-nowrap">
              Sort by
            </label>
            <select
              id="market-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-[#DCE6D9] bg-white text-sm text-[#1A241B] min-h-[44px]"
            >
              <option value="recent">Recently Listed</option>
              <option value="price_asc">Lowest Price First</option>
              <option value="price_desc">Highest Price First</option>
            </select>
          </div>
        </div>

        {/* Interactive Category Tabs + Price/Quantity Range */}
        <div className="pt-3 border-t border-[#DCE6D9] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Product category filters">
            {['All', ...PRODUCT_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap min-h-[36px] ${
                  selectedCategory === cat
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-[#F8FAF5] text-[#4A594C] hover:text-[#1A241B] hover:bg-[#E8F5E9]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <SlidersHorizontal className="w-4 h-4 text-[#4A594C] hidden sm:block" aria-hidden="true" />
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min ₹"
              aria-label="Minimum price in rupees"
              className="w-24 px-2.5 py-2 rounded-lg border border-[#DCE6D9] text-xs tabular-nums min-h-[36px]"
            />
            <span className="text-[#4A594C]">to</span>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max ₹"
              aria-label="Maximum price in rupees"
              className="w-24 px-2.5 py-2 rounded-lg border border-[#DCE6D9] text-xs tabular-nums min-h-[36px]"
            />
            <input
              type="number"
              min="0"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              placeholder="Min Qty"
              aria-label="Minimum available quantity"
              className="w-24 px-2.5 py-2 rounded-lg border border-[#DCE6D9] text-xs tabular-nums min-h-[36px]"
            />
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-[#1B5E20] hover:bg-[#E8F5E9] min-h-[36px]"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results Count */}
      <div className="mt-6 flex items-center justify-between text-sm text-[#4A594C]">
        <p className="tabular-nums">
          Showing <strong className="text-[#1A241B]">{filteredProducts.length}</strong> of{' '}
          {products.length} agricultural listings
        </p>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-xl border border-[#DCE6D9] overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-[#E8F5E9]/60" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-[#E8F5E9] rounded w-1/2" />
                <div className="h-5 bg-[#E8F5E9] rounded w-2/3" />
                <div className="h-3 bg-[#E8F5E9] rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="mt-8 bg-white rounded-xl border border-[#DCE6D9] p-12 text-center space-y-4">
          <h2 className="font-display font-bold text-xl text-[#1A241B]">
            No matching agricultural produce found
          </h2>
          <p className="text-sm text-[#4A594C] max-w-md mx-auto">
            Try widening your price range, clearing the district filter, or posting a Buyer
            Requirement so local farmers can reach out to you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={resetFilters}
              className="px-5 py-2.5 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] min-h-[44px]"
            >
              Clear All Filters
            </button>
            <button
              type="button"
              onClick={() => onNavigate('requirements')}
              className="px-5 py-2.5 rounded-lg border border-[#DCE6D9] text-sm font-semibold text-[#1A241B] hover:bg-[#F8FAF5] min-h-[44px]"
            >
              Post a Buyer Requirement
            </button>
          </div>
        </div>
      ) : (
        <div
          className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          data-testid="marketplace-grid"
        >
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="bg-white rounded-xl border border-[#DCE6D9] overflow-hidden flex flex-col hover:border-[#2E7D32]/50 transition-colors"
            >
              <div className="aspect-[4/3] bg-[#F8FAF5] overflow-hidden">
                <ProduceImage
                  src={product.image}
                  alt={`${product.name} by ${product.farmerName}`}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 text-xs text-[#4A594C]">
                  <span className="truncate">
                    {product.category} · {product.village}, {product.district}
                  </span>
                  <span
                    className={`font-semibold whitespace-nowrap ${
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

                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <h2 className="font-display font-bold text-xl text-[#1A241B]">{product.name}</h2>
                  <p className="font-display font-bold text-lg text-[#1B5E20] tabular-nums whitespace-nowrap">
                    {formatINR(product.expectedPrice)}/{product.unit}
                  </p>
                </div>

                <div className="mt-3 space-y-1 text-sm text-[#4A594C]">
                  <p>
                    Farmer:{' '}
                    <span className="font-medium text-[#1A241B]">{product.farmerName}</span>
                  </p>
                  <p className="text-xs tabular-nums">
                    Quantity: {formatQuantity(product.availableQuantity, product.unit)} · Harvest:{' '}
                    {formatShortDate(product.harvestDate)}
                    {product.isDemo ? ' · DEMO DATA' : ''}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#DCE6D9] flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onSelectProduct(product)}
                    className="flex-1 py-2.5 px-3.5 rounded-lg bg-[#2E7D32] text-white text-xs font-semibold hover:bg-[#1B5E20] transition-colors min-h-[42px] whitespace-nowrap"
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
                    className="min-h-[42px]"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
