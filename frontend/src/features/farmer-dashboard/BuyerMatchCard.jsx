import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { api } from '../../services/api';
import { Info } from 'lucide-react';
import BuyerBadge from '../../components/ui/BuyerBadge';
import HowMatchingWorksDrawer from './HowMatchingWorksDrawer';

const FACTOR_COLORS = {
  crop_compatibility: 'bg-emerald-500',
  quantity_fit: 'bg-blue-500',
  quality_match: 'bg-purple-500',
  distance: 'bg-amber-500',
  price_fit: 'bg-rose-500',
  reliability: 'bg-teal-500',
};

function MiniBar({ label, score, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground w-[72px] text-right shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-foreground w-7 text-right tabular-nums">{score}</span>
    </div>
  );
}

function BuyerMatchItem({ match }) {
  const factors = match.factors || {};

  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: buyer name + tier + big % */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div>
            <h4 className="font-bold text-foreground text-sm">{match.business_name}</h4>
            <div className="mt-0.5">
              <BuyerBadge tier={match.verification_tier} size="sm" />
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary tabular-nums">{match.total_score}%</div>
          <div className="text-[10px] text-muted-foreground">match</div>
        </div>
      </div>

      {/* Factor breakdown — mini horizontal bars */}
      <div className="space-y-1.5">
        {Object.entries(factors).map(([key, factor]) => (
          <MiniBar
            key={key}
            label={factor.label || key}
            score={factor.score}
            color={FACTOR_COLORS[key] || 'bg-slate-400'}
          />
        ))}
      </div>
    </div>
  );
}

export default function BuyerMatchCard({ lotId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadMatches() {
      if (!lotId) return;
      setLoading(true);
      try {
        const res = await api.getBuyerMatches(lotId);
        setData(res);
      } catch (err) {
        console.error('Failed to load buyer matches:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, [lotId]);

  if (loading) {
    return (
      <div className="p-8 bg-white rounded-xl border border-border flex flex-col items-center justify-center text-center shadow-2xs">
        <div className="w-20 h-20 flex items-center justify-center">
          <DotLottieReact
            src="https://lottie.host/d0ced338-e3e1-4e86-9553-8fff0dea623e/e5iq7ZgcmA.json"
            loop
            autoplay
          />
        </div>
        <p className="text-xs text-muted-foreground font-medium mt-2">
          Matching verified buyers with weighted scoring model...
        </p>
      </div>
    );
  }

  if (!data || !data.matches || data.matches.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-6 text-center text-muted-foreground">
        <div className="text-3xl mb-2">🔍</div>
        <p className="text-sm">No matching buyers found for this lot.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section header with info icon */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          AI-Matched Buyers ({data.matches.length})
        </h4>
        <button
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
          title="How matching works"
        >
          <Info className="w-3.5 h-3.5" />
          How it works
        </button>
      </div>

      {/* Buyer cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.matches.map(match => (
          <BuyerMatchItem key={match.buyer_id} match={match} />
        ))}
      </div>

      {/* How matching works drawer */}
      {drawerOpen && (
        <HowMatchingWorksDrawer
          weights={data.weights}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}
