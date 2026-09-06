import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity } from 'lucide-react';

const ACTION_STYLES = {
  SELL_NOW: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    accent: 'bg-emerald-500',
    label: 'Sell Now',
    icon: TrendingUp,
  },
  WAIT: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
    accent: 'bg-amber-500',
    label: 'Wait',
    icon: Activity,
  },
  COMPARE_BUYERS: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    accent: 'bg-blue-500',
    label: 'Compare Buyers',
    icon: TrendingDown,
  },
};

const SIGNAL_CHIP_STYLES = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  negative: 'bg-red-50 text-red-700 border-red-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function PriceRecommendationCard({ cropId, marketId, cropName, marketName }) {
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    async function loadRec() {
      if (!cropId || !marketId) return;
      setLoading(true);
      try {
        const data = await api.getPriceRecommendation({ cropId, marketId });
        setRec(data);
      } catch (err) {
        console.error('Failed to load AI recommendation:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRec();
  }, [cropId, marketId]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-transparent rounded-xl border border-primary/20 p-6 shadow-sm col-span-1 md:col-span-2 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-primary/10 rounded w-24" />
            <div className="h-6 bg-primary/10 rounded w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!rec) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-transparent rounded-xl border border-primary/20 p-6 shadow-sm col-span-1 md:col-span-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white rounded-xl shadow-sm border border-primary/10">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">No AI recommendation available for this crop-market pair yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const style = ACTION_STYLES[rec.action] || ACTION_STYLES.COMPARE_BUYERS;
  const ActionIcon = style.icon;

  return (
    <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl border border-primary/15 p-6 shadow-sm col-span-1 md:col-span-2 relative overflow-hidden group">
      {/* Subtle background accent */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 group-hover:scale-110 transition-transform duration-500" />

      <div className="relative z-10 space-y-4">
        {/* Header: AI label + verdict badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-primary/10 shrink-0">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                AI Price Insight
              </div>

              {/* Big verdict badge */}
              <div className="flex items-center gap-2.5 mb-1">
                <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold text-lg ${style.bg} ${style.text} border ${style.border}`}>
                  <ActionIcon className="w-5 h-5" />
                  {style.label}
                </span>
              </div>
            </div>
          </div>

          {/* Confidence pill */}
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground mb-1 font-medium">Confidence</div>
            <div className="w-24 h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${style.accent}`}
                style={{ width: `${rec.confidence}%` }}
              />
            </div>
            <div className="text-xs font-semibold text-foreground mt-0.5">{rec.confidence}%</div>
          </div>
        </div>

        {/* Price range band */}
        <div className="text-sm text-foreground">
          <span className="text-muted-foreground">Expected range: </span>
          <span className="font-bold tabular-nums">₹{rec.price_range?.low?.toLocaleString('en-IN')}</span>
          <span className="text-muted-foreground"> – </span>
          <span className="font-bold tabular-nums">₹{rec.price_range?.high?.toLocaleString('en-IN')}</span>
          <span className="text-muted-foreground text-xs ml-1">/ quintal</span>
        </div>

        {/* Explanation — one line, muted, from real numbers */}
        <p className="text-sm text-muted-foreground leading-relaxed">{rec.explanation}</p>

        {/* Signal chips — max 3, reusing badge style */}
        {rec.signals && rec.signals.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {rec.signals.slice(0, 3).map((signal, i) => (
              <span
                key={i}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${SIGNAL_CHIP_STYLES[signal.type] || SIGNAL_CHIP_STYLES.neutral}`}
              >
                {signal.label}
              </span>
            ))}
          </div>
        )}

        {/* Details toggle — collapsed by default */}
        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          {detailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {detailsOpen ? 'Hide details' : 'Details'}
        </button>

        {detailsOpen && rec.details && (
          <div className="bg-white/70 border border-border rounded-lg p-3.5 space-y-2 text-xs text-muted-foreground animate-in fade-in">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <div>
                <span className="font-medium text-foreground">Regression slope:</span> {rec.details.regression?.slope?.toFixed(2)} ₹/day
              </div>
              <div>
                <span className="font-medium text-foreground">R²:</span> {rec.details.regression?.r_squared?.toFixed(3)}
              </div>
              <div>
                <span className="font-medium text-foreground">Residual std dev:</span> ₹{rec.details.regression?.std_dev?.toFixed(0)}
              </div>
              <div>
                <span className="font-medium text-foreground">Data points:</span> {rec.details.data_points_used}
              </div>
            </div>
            {rec.details.backtest_note && (
              <div className="pt-2 border-t border-border/50">
                <span className="font-medium text-foreground">Validation:</span> {rec.details.backtest_note}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
