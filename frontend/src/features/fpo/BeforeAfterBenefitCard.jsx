import React from 'react';
import { TrendingUp, ShieldCheck, Truck, Users, ArrowUpRight } from 'lucide-react';

export default function BeforeAfterBenefitCard({ benefitData, quantity = 100 }) {
  if (!benefitData) return null;

  const withoutFpo = benefitData.without_fpo || {};
  const withFpo = benefitData.with_fpo || {};
  const delta = benefitData.benefit_delta || {};

  const withoutPrice = withoutFpo.best_price_per_quintal || 4780;
  const withPrice = withFpo.best_price_per_quintal || 4950;
  const priceDelta = delta.price_delta_per_quintal || (withPrice - withoutPrice);
  const totalGain = delta.total_extra_member_gain || (priceDelta * quantity);
  const pctGain = delta.percentage_increase || ((priceDelta / withoutPrice) * 100).toFixed(1);

  return (
    <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl p-6 border border-emerald-500/30 shadow-xl overflow-hidden relative">
      {/* Background glow decorative effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold px-2.5 py-0.8 rounded-full uppercase tracking-wider">
              Data-Driven Impact Analysis
            </span>
            <span className="text-xs text-slate-400">Based on active processor requirements</span>
          </div>
          <h3 className="text-2xl font-heading font-bold mt-1 text-slate-50">
            Bulk Pooling Advantage for {quantity} Quintals
          </h3>
        </div>

        {/* Highlight badge */}
        <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl px-4 py-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
            ↑
          </div>
          <div>
            <div className="text-xs text-emerald-200 font-medium">Net Value Uplift</div>
            <div className="text-xl font-bold text-emerald-300">
              +₹{priceDelta.toLocaleString('en-IN')}/q <span className="text-sm font-normal text-emerald-200">({pctGain}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {/* Without FPO Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status Quo</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Individual Farmer</span>
            </div>
            <h4 className="text-base font-semibold text-slate-200 mt-3 mb-1">Selling Alone at Mandi</h4>
            <p className="text-xs text-slate-400 mb-4">
              Small lots (15-30q) are vulnerable to distress prices and local commission cuts.
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Best Buyer Price:</span>
                <span className="text-lg font-bold text-slate-200">₹{withoutPrice.toLocaleString('en-IN')} / q</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Matching Bulk Buyers:</span>
                <span className="text-slate-300 font-medium">1 local aggregator</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Est. Total Pool Revenue:</span>
                <span className="font-semibold text-slate-300">₹{(withoutPrice * quantity).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                <Truck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>Farmer pays mandi transport (~₹80/q) + APMC deductions</span>
              </div>
            </div>
          </div>
        </div>

        {/* With FPO Card */}
        <div className="bg-gradient-to-b from-emerald-950/60 to-slate-900/90 border-2 border-emerald-500/60 rounded-xl p-5 flex flex-col justify-between relative shadow-lg">
          <div className="absolute -top-3 right-4 bg-emerald-500 text-slate-950 text-xs font-bold px-2.5 py-0.5 rounded-full shadow">
            RECOMMENDED
          </div>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Aggregated Pool</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-semibold">
                FPO Collective
              </span>
            </div>
            <h4 className="text-base font-semibold text-emerald-200 mt-3 mb-1">Selling as a 100q Bulk Lot</h4>
            <p className="text-xs text-emerald-100/70 mb-4">
              Direct institutional contracts with verified solvent extraction plants & corporate processors.
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-emerald-100/80">Bulk Contract Price:</span>
                <span className="text-xl font-black text-emerald-300">₹{withPrice.toLocaleString('en-IN')} / q</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-100/80">Active Bulk Buyers:</span>
                <span className="text-emerald-200 font-semibold flex items-center gap-1">
                  2 Verified Partners <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-100/80">Est. Total Pool Revenue:</span>
                <span className="font-bold text-emerald-300 text-base">₹{(withPrice * quantity).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t border-emerald-500/20 text-xs text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Direct farmgate pickup arranged by buyer + secure digital escrow</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary gain bar */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-sm relative z-10">
        <div className="flex items-center gap-2 text-slate-300">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Total extra income distributed to member farmers:</span>
        </div>
        <div className="text-lg font-bold text-emerald-300 flex items-center gap-1.5">
          <span>+₹{totalGain.toLocaleString('en-IN')}</span>
          <span className="text-xs font-normal text-slate-400">added to farmer accounts</span>
        </div>
      </div>
    </div>
  );
}
