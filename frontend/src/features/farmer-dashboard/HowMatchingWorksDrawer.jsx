import React from 'react';
import { X } from 'lucide-react';

const FACTOR_COLORS = {
  crop_compatibility: 'bg-emerald-500',
  quantity_fit: 'bg-blue-500',
  quality_match: 'bg-purple-500',
  distance: 'bg-amber-500',
  price_fit: 'bg-rose-500',
  reliability: 'bg-teal-500',
};

const FACTOR_DESCRIPTIONS = {
  crop_compatibility: 'Does the buyer actively need this crop?',
  quantity_fit: 'How well do buyer and lot quantities match?',
  quality_match: 'Does the quality grade meet buyer requirements?',
  distance: 'How close is the buyer to the farmer\'s market?',
  price_fit: 'Is the buyer willing to pay near-market rates?',
  reliability: 'Buyer verification tier and transaction history.',
};

export default function HowMatchingWorksDrawer({ weights, onClose }) {
  if (!weights) return null;

  const entries = Object.entries(weights);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-foreground">How Matching Works</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Transparent, weighted scoring — no black box</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Intro */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            Each buyer is scored on 6 factors. Every factor gets a score from 0–100, then weighted by importance. The final match score is the weighted sum.
          </p>

          {/* Stacked weight bar */}
          <div>
            <div className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Weight Distribution</div>
            <div className="h-6 rounded-full overflow-hidden flex shadow-inner border border-border">
              {entries.map(([key, info]) => (
                <div
                  key={key}
                  className={`${FACTOR_COLORS[key] || 'bg-slate-400'} relative group transition-all`}
                  style={{ width: `${(info.value || 0) * 100}%` }}
                  title={`${info.label}: ${((info.value || 0) * 100).toFixed(0)}%`}
                >
                  {(info.value || 0) >= 0.15 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/90">
                      {((info.value || 0) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Factor list with descriptions */}
          <div className="space-y-4">
            {entries.map(([key, info]) => (
              <div key={key} className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${FACTOR_COLORS[key] || 'bg-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{info.label}</span>
                    <span className="text-sm font-bold text-primary tabular-nums">{((info.value || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{FACTOR_DESCRIPTIONS[key] || ''}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="bg-slate-50 border border-border rounded-lg p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Transparency note:</strong> These weights are fixed and visible. Every match score shows the per-factor breakdown so you can see exactly why a buyer was ranked higher or lower.
          </div>
        </div>
      </div>
    </div>
  );
}
