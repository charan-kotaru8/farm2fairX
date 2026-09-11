import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import BuyerBadge from '../../components/ui/BuyerBadge';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { X, RefreshCw, BarChart3, Star, ShieldCheck, MapPin, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';

const FACTOR_COLORS = {
  quantity_fit: 'bg-blue-500',
  quality_match: 'bg-purple-500',
  distance: 'bg-amber-500',
  price_fit: 'bg-rose-500',
  reliability: 'bg-teal-500',
};

function MiniBar({ label, score, color }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-28 text-right shrink-0 truncate font-medium">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
      </div>
      <span className="font-semibold text-foreground w-8 text-right tabular-nums">{score}%</span>
    </div>
  );
}

export default function CompareBuyersModal({ isOpen, onClose, lotId, cropName, cropIcon, marketName }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadMatches() {
    if (!lotId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getBuyerMatches(lotId);
      setData(res);
    } catch (err) {
      console.error('Failed to load real-time buyer matches:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadMatches();
    }
  }, [isOpen, lotId]);

  if (!isOpen) return null;

  async function handleRefresh() {
    setRefreshing(true);
    await loadMatches();
  }

  const matches = data?.matches || [];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-border max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-border bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-xl shadow-xs border border-blue-100 flex items-center justify-center text-2xl shrink-0">
              {cropIcon || '🌾'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-lg text-foreground">
                  {t('farmer.compareBuyers')} · {cropName || 'Crop'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  <Sparkles className="w-3 h-3" /> Live Scoring
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time AI matching based on buyer ratings, location proximity, price fit & capacity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Refresh Real-Time Match Scores"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 flex items-center justify-center">
                <DotLottieReact
                  src="https://lottie.host/d0ced338-e3e1-4e86-9553-8fff0dea623e/e5iq7ZgcmA.json"
                  loop
                  autoplay
                />
              </div>
              <h4 className="font-heading font-semibold text-foreground text-sm mt-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" /> Scoring Verified Buyers in Real-Time...
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Evaluating 6 transparent dimensions: crop fit, quantity, quality grade, distance, and payment track record.
              </p>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="text-4xl">🔍</div>
              <h4 className="font-heading font-semibold text-foreground">No matched buyers found yet</h4>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No verified buyers currently have matching procurement requests for this lot. Buyers check listings regularly.
              </p>
              {lotId && (
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/farmer/lots/${lotId}`);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {t('farmer.viewLots')} <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium px-1">
                <span>{matches.length} Verified Buyers Matched</span>
                <span>Sorted by AI Compatibility Score</span>
              </div>

              {matches.map((match, idx) => {
                const factors = match.factors || {};
                const isTop = idx === 0;

                return (
                  <div
                    key={match.buyer_id}
                    className={`rounded-2xl border p-5 transition-all relative ${
                      isTop
                        ? 'border-blue-300 bg-gradient-to-br from-blue-50/40 via-white to-white shadow-md shadow-blue-100/50'
                        : 'border-border bg-white shadow-xs hover:border-slate-300'
                    }`}
                  >
                    {isTop && (
                      <div className="absolute -top-3 right-5 inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
                        <Star className="w-3 h-3 fill-current" /> Best Match
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-foreground">{match.business_name}</h4>
                          <BuyerBadge tier={match.verification_tier} size="sm" />
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Buyer
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> Maharashtra APMC Network
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-3xl font-extrabold text-blue-600 tabular-nums">
                            {match.total_score}%
                          </span>
                        </div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Match Score
                        </div>
                      </div>
                    </div>

                    {/* Factor Bars */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 bg-slate-50/60 -mx-5 -mb-5 p-4 rounded-b-2xl">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Transparent Scoring Factors:
                      </div>
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
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            ⚡ Matches computed dynamically with zero bias
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              {t('common.cancel') || 'Close'}
            </button>
            {lotId && (
              <button
                onClick={() => {
                  onClose();
                  navigate(`/farmer/lots/${lotId}`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                {t('farmer.viewLots')} <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
