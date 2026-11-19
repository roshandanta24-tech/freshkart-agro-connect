import { useState } from 'react';
import { MapPin, Check, AlertCircle } from 'lucide-react';
import {
  VENTURE_SCENARIOS,
  calculateProjection,
  formatINR,
  type ScenarioAssumption,
} from '../utils/projections';

export function AboutPage() {
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<ScenarioAssumption['id']>('base');

  const projections = VENTURE_SCENARIOS.map(calculateProjection);
  const activeProjection =
    projections.find((p) => p.id === selectedScenarioId) || projections[1];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
      {/* Intro & Problem / Solution */}
      <section className="max-w-3xl space-y-4">
        <p className="text-xs font-semibold text-[#2E7D32]">
          About FreshKart Agro Connect · Western Odisha Startup MVP
        </p>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#1A241B] headline-balance">
          Connecting Farmers Directly to Buyers Across Western Odisha
        </h1>
        <p className="text-base text-[#4A594C] leading-relaxed">
          FreshKart Agro Connect is an online and offline agricultural marketplace initiative
          launching in <strong>Bargarh</strong>, <strong>Sambalpur</strong>, and nearby districts of
          Western Odisha. Our goal is to help local farmers receive fair, transparent prices while
          giving grocery retailers, wholesalers, restaurants, hotels, and households direct access
          to fresh farm produce.
        </p>
      </section>

      {/* Problem & Solution 2-Column */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white rounded-xl border border-[#DCE6D9] p-7 space-y-3">
          <h2 className="font-display font-bold text-xl text-[#1A241B]">The Challenge Today</h2>
          <p className="text-sm text-[#4A594C] leading-relaxed">
            Small and medium farmers in Western Odisha frequently receive low realizations because
            multiple intermediaries sit between the farm gate and retail markets. During peak
            harvests, lack of reliable buyer visibility leads to distress sales and produce wastage,
            while buyers pay higher prices with little transparency into farm origin.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE6D9] p-7 space-y-3">
          <h2 className="font-display font-bold text-xl text-[#1A241B]">Our Practical MVP Solution</h2>
          <p className="text-sm text-[#4A594C] leading-relaxed">
            FreshKart Agro Connect focuses on four working essentials: simple farmer registration
            and harvest listings, buyer requirement posting, transparent rule-based matching
            (product, quantity, district, and budget), and direct WhatsApp coordination without
            unnecessary complexity.
          </p>
        </div>
      </section>

      {/* Geographical Focus & MVP Boundaries */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-[#E8F5E9]/60 rounded-xl border border-[#DCE6D9] p-7 space-y-4">
          <div className="flex items-center gap-2 text-[#1B5E20]">
            <MapPin className="w-5 h-5" aria-hidden="true" />
            <h2 className="font-display font-bold text-xl">Initial Geographical Focus</h2>
          </div>
          <p className="text-sm text-[#1A241B]/85 leading-relaxed">
            Rather than promising pan-India logistics at launch, FreshKart Agro Connect is
            purpose-built for dense local farm-to-buyer corridors in Western Odisha:
          </p>
          <ul className="space-y-2 text-sm text-[#1A241B]">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#2E7D32]" aria-hidden="true" />
              <span>Bargarh District (Attabira, Sohela, Bargarh Town)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#2E7D32]" aria-hidden="true" />
              <span>Sambalpur District (Burla, Ainthapali, Khetrajpur, Hirakud)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#2E7D32]" aria-hidden="true" />
              <span>Neighboring Western Odisha districts (Jharsuguda, Balangir, Subarnapur)</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-[#DCE6D9] p-7 space-y-4">
          <h2 className="font-display font-bold text-xl text-[#1A241B]">
            Intentional MVP Scope &amp; Limitations
          </h2>
          <p className="text-sm text-[#4A594C] leading-relaxed">
            To validate real farmer and buyer adoption quickly, the following complex features are
            intentionally excluded from Version 1:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-[#4A594C]">
            {[
              'No integrated online payment gateway',
              'No AI-based price prediction claims',
              'No live GPS delivery tracking',
              'No warehouse or cold-storage management',
              'No automated fleet/transport dispatch',
              'No automatic commission billing in MVP',
            ].map((lim) => (
              <li key={lim} className="flex items-start gap-2">
                <span className="text-[#2E7D32] font-bold">·</span>
                <span>{lim}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* BUSINESS MODEL & ILLUSTRATIVE FINANCIAL PROJECTIONS */}
      <section className="bg-white rounded-xl border border-[#DCE6D9] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#2E7D32]">
              Commission-Based Venture Model · Projected Financial Assumptions
            </p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#1A241B]">
              Illustrative Monthly Business Projections
            </h2>
            <p className="text-sm text-[#4A594C] max-w-2xl">
              FreshKart plans to operate on a transparent commission-based revenue model once market
              liquidity is validated. During the MVP pilot, neither farmers nor buyers are
              automatically charged.
            </p>
          </div>

          {/* Interactive Scenario Selector */}
          <div
            className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F8FAF5] border border-[#DCE6D9] self-start"
            role="group"
            aria-label="Select financial projection scenario"
          >
            {projections.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSelectedScenarioId(sc.id)}
                className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedScenarioId === sc.id
                    ? 'bg-[#2E7D32] text-white'
                    : 'text-[#4A594C] hover:text-[#1A241B]'
                }`}
              >
                {sc.label.replace(' Scenario', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Scenario Highlight Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl bg-[#F8FAF5] border border-[#DCE6D9]">
          <div>
            <p className="text-xs text-[#4A594C]">Projected Monthly Sales</p>
            <p className="font-display font-bold text-2xl text-[#1A241B] tabular-nums mt-1">
              {activeProjection.totalMonthlySales}
            </p>
            <p className="text-xs text-[#4A594C] mt-0.5 tabular-nums">
              {activeProjection.expectedCustomers} customers × {activeProjection.purchasesPerMonth}
              /mo
            </p>
          </div>
          <div>
            <p className="text-xs text-[#4A594C]">Contribution per Sale</p>
            <p className="font-display font-bold text-2xl text-[#1A241B] tabular-nums mt-1">
              {formatINR(activeProjection.contributionPerSale)}
            </p>
            <p className="text-xs text-[#4A594C] mt-0.5 tabular-nums">
              {formatINR(activeProjection.avgTransactionValue)} avg −{' '}
              {formatINR(activeProjection.variableCostPerSale)} variable
            </p>
          </div>
          <div>
            <p className="text-xs text-[#4A594C]">Estimated Monthly Revenue</p>
            <p className="font-display font-bold text-2xl text-[#1B5E20] tabular-nums mt-1">
              {formatINR(activeProjection.estimatedMonthlyRevenue)}
            </p>
            <p className="text-xs text-[#4A594C] mt-0.5">Illustrative projection</p>
          </div>
          <div>
            <p className="text-xs text-[#4A594C]">Estimated Operating Surplus</p>
            <p
              className={`font-display font-bold text-2xl tabular-nums mt-1 ${
                activeProjection.estimatedOperatingSurplus >= 0
                  ? 'text-[#1B5E20]'
                  : 'text-amber-700'
              }`}
            >
              {formatINR(activeProjection.estimatedOperatingSurplus)}
            </p>
            <p className="text-xs text-[#4A594C] mt-0.5 tabular-nums">
              After {formatINR(activeProjection.monthlyFixedCost)} fixed cost
            </p>
          </div>
        </div>

        {/* Complete Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#DCE6D9] text-xs font-semibold text-[#4A594C]">
                <th className="py-3 pr-4">Financial Metric (Monthly Projection)</th>
                {projections.map((p) => (
                  <th key={p.id} className="py-3 px-4 text-right whitespace-nowrap">
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE6D9] tabular-nums">
              <tr>
                <td className="py-3 pr-4 text-[#4A594C]">Expected Active Customers</td>
                {projections.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-right font-medium text-[#1A241B]">
                    {p.expectedCustomers}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-4 text-[#4A594C]">Purchases per Customer / Month</td>
                {projections.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-right font-medium text-[#1A241B]">
                    {p.purchasesPerMonth}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-4 text-[#4A594C]">Average Transaction Value</td>
                {projections.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-right font-medium text-[#1A241B]">
                    {formatINR(p.avgTransactionValue)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-4 text-[#4A594C]">Variable Cost per Sale</td>
                {projections.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-right font-medium text-[#1A241B]">
                    {formatINR(p.variableCostPerSale)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-4 text-[#4A594C]">Contribution per Sale</td>
                {projections.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-right font-semibold text-[#1A241B]">
                    {formatINR(p.contributionPerSale)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-4 text-[#4A594C]">Monthly Fixed Cost</td>
                {projections.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-right font-medium text-[#1A241B]">
                    {formatINR(p.monthlyFixedCost)}
                  </td>
                ))}
              </tr>
              <tr className="bg-[#F8FAF5]">
                <td className="py-3.5 pr-4 font-semibold text-[#1A241B]">
                  Estimated Monthly Revenue
                </td>
                {projections.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 text-right font-bold text-[#1B5E20]">
                    {formatINR(p.estimatedMonthlyRevenue)}
                  </td>
                ))}
              </tr>
              <tr className="bg-[#E8F5E9]/45">
                <td className="py-3.5 pr-4 font-semibold text-[#1A241B]">
                  Estimated Operating Surplus
                </td>
                {projections.map((p) => (
                  <td
                    key={p.id}
                    className={`py-3.5 px-4 text-right font-bold ${
                      p.estimatedOperatingSurplus >= 0 ? 'text-[#1B5E20]' : 'text-amber-700'
                    }`}
                  >
                    {formatINR(p.estimatedOperatingSurplus)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 rounded-lg bg-[#F8FAF5] border border-[#DCE6D9] flex items-start gap-2.5 text-xs text-[#4A594C]">
          <AlertCircle className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <strong>Important Notice:</strong> All figures above are illustrative financial
            projections from the FreshKart Agro Connect venture plan, not verified actual revenue or
            operating results.
          </span>
        </div>
      </section>
    </div>
  );
}
