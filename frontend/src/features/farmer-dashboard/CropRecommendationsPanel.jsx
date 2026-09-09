import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  AlertCircle,
  Package,
  Clock,
  BarChart3,
  Sparkles,
  Cloud,
  Droplets,
  Thermometer,
  Sun,
  CloudRain,
  ExternalLink,
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import CompareBuyersModal from './CompareBuyersModal';

/* ───── Action visual config ───── */
const ACTION_CONFIG = {
  SELL_NOW: {
    gradient: 'from-emerald-500/15 via-emerald-400/5 to-transparent',
    badge: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white',
    glow: 'shadow-emerald-200/60',
    border: 'border-emerald-200/70',
    accentBar: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Sell Now',
    icon: TrendingUp,
    pulse: true,
  },
  WAIT: {
    gradient: 'from-amber-500/15 via-amber-400/5 to-transparent',
    badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    glow: 'shadow-amber-200/60',
    border: 'border-amber-200/70',
    accentBar: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Wait',
    icon: Clock,
    pulse: false,
  },
  COMPARE_BUYERS: {
    gradient: 'from-blue-500/15 via-blue-400/5 to-transparent',
    badge: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
    glow: 'shadow-blue-200/60',
    border: 'border-blue-200/70',
    accentBar: 'bg-blue-500',
    chip: 'bg-blue-50 text-blue-700 border-blue-200',
    label: 'Compare Buyers',
    icon: BarChart3,
    pulse: false,
  },
};

const getActionLabel = (action, t) => {
  if (action === 'SELL_NOW') return t('farmer.sellNow');
  if (action === 'WAIT') return t('farmer.wait');
  if (action === 'COMPARE_BUYERS') return t('farmer.compareBuyers');
  return action;
};

const SIGNAL_CHIP_STYLES = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  negative: 'bg-red-50 text-red-700 border-red-200',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
};

/* ───── Weather Mini Widget ───── */
function WeatherWidget({ weather, marketName }) {
  if (!weather) return null;

  const riskStyles = {
    clear: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: Sun },
    moderate_rain: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: CloudRain },
    heavy_rain: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: CloudRain },
    heat_stress: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: Thermometer },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: Cloud },
  };

  const style = riskStyles[weather.risk] || riskStyles.clear;
  const RiskIcon = style.icon;

  return (
    <div className={`${style.bg} ${style.border} border rounded-xl p-3 flex items-center gap-3`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${style.bg} ${style.text} shrink-0`}>
        <RiskIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold ${style.text}`}>{weather.condition || 'Clear / Favorable'}</span>
          <span className="text-[10px] text-muted-foreground">{marketName}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Thermometer className="w-3 h-3" /> {weather.temp_c ?? '--'}°C
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Droplets className="w-3 h-3" /> {weather.rainfall_mm ?? 0} mm
          </span>
          {weather.max_temp_c && (
            <span className="text-xs text-muted-foreground">↑ {weather.max_temp_c}°C</span>
          )}
        </div>
      </div>
      <div className="text-[9px] text-muted-foreground shrink-0 text-right">
        <div>{weather.source?.replace('NASA POWER (', '').replace(')', '') || 'NASA'}</div>
      </div>
    </div>
  );
}

/* ───── Single Crop Recommendation Card ───── */
function CropCard({ rec, isActive, onActionClick }) {
  const { t } = useTranslation();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const config = ACTION_CONFIG[rec.action] || ACTION_CONFIG.COMPARE_BUYERS;
  const ActionIcon = config.icon;

  if (!rec.has_data) {
    return (
      <div className={`transition-all duration-500 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute'}`}>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{rec.crop_icon}</span>
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">{rec.crop_name}</h3>
              <p className="text-sm text-muted-foreground">{rec.market_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg p-3 border border-amber-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{rec.explanation}</span>
          </div>
          {rec.total_quantity > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Package className="w-3.5 h-3.5" />
              <span>{t('farmer.youHaveListed')} <strong className="text-foreground">{rec.total_quantity} {rec.crop_unit}</strong> {t('farmer.acrossLots')} 1 {t('farmer.lots')}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-500 ease-out ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute'}`}>
      <div className={`relative overflow-hidden rounded-2xl border ${config.border} bg-gradient-to-br ${config.gradient} bg-white shadow-sm hover:shadow-lg ${config.glow} transition-shadow duration-300`}>

        {/* Decorative crop icon background */}
        <div className="absolute -right-4 -top-4 text-[120px] opacity-[0.04] pointer-events-none select-none leading-none">
          {rec.crop_icon}
        </div>

        {/* Accent bar at top */}
        <div className={`h-1 w-full ${config.accentBar}`} />

        <div className="relative z-10 p-5 space-y-4">

          {/* Row 1: Crop identity + action badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-2xl shrink-0">
                {rec.crop_icon}
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground leading-tight">{rec.crop_name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{rec.market_name}</p>
              </div>
            </div>

            {/* Action badge */}
            <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold text-sm ${config.badge} shadow-sm shrink-0 ${config.pulse ? 'animate-pulse-subtle' : ''}`}>
              <ActionIcon className="w-4 h-4" />
              {getActionLabel(rec.action, t)}
            </div>
          </div>

          {/* Row 2: Price range — prominent */}
          <div className="bg-white/70 rounded-xl border border-slate-100 p-4">
            <div className="text-xs text-muted-foreground mb-1 font-medium">{t('farmer.expectedRange')}</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                ₹{rec.price_range?.low?.toLocaleString('en-IN')}
              </span>
              <span className="text-muted-foreground text-lg">–</span>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                ₹{rec.price_range?.high?.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-muted-foreground ml-1">/ {rec.crop_unit || t('farmer.quintals')} {t('farmer.ofCrop')} {rec.crop_name}</span>
            </div>
          </div>

          {/* Row 3: Confidence meter */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground font-medium">{t('farmer.confidence')}</span>
                <span className="text-xs font-bold text-foreground">{rec.confidence}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${config.accentBar}`}
                  style={{ width: `${rec.confidence}%` }}
                />
              </div>
            </div>
          </div>

          {/* Row 4: Explanation */}
          <p className="text-sm text-muted-foreground leading-relaxed">{rec.explanation}</p>

          {/* Row 5: Signal chips */}
          {rec.signals && rec.signals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {rec.signals.slice(0, 4).map((signal, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${SIGNAL_CHIP_STYLES[signal.type] || SIGNAL_CHIP_STYLES.neutral}`}
                >
                  {signal.label}
                </span>
              ))}
            </div>
          )}

          {/* Row 5.5: Weather Conditions */}
          <WeatherWidget weather={rec.details?.weather} marketName={rec.market_name} />

          {/* Row 6: Lot context */}
          {rec.total_quantity > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
              <Package className="w-3.5 h-3.5 text-primary" />
              <span>{t('farmer.youHaveListed')} <strong className="text-foreground">{rec.total_quantity} {rec.crop_unit}</strong> {t('farmer.acrossLots')} {rec.lot_ids?.length || 1} {t('farmer.lots')}</span>
            </div>
          )}

          {/* Row 6.5: Action Buttons — Sell Now / Compare Buyers */}
          {rec.action && (
            <div className="flex flex-wrap gap-2 pt-1">
              {rec.action === 'SELL_NOW' && (
                <>
                  <button
                    onClick={() => onActionClick?.('sell', rec)}
                    className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm hover:shadow-md hover:shadow-emerald-200/50 transition-all duration-200 active:scale-[0.98]"
                  >
                    <TrendingUp className="w-4 h-4" />
                    {t('farmer.sellNow')}
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </button>
                  <button
                    onClick={() => onActionClick?.('compare_modal', rec)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 transition-all duration-200 active:scale-[0.98] shadow-xs"
                    title="Compare verified buyer bids"
                  >
                    <BarChart3 className="w-4 h-4" />
                    {t('farmer.compareBuyers')}
                  </button>
                </>
              )}

              {rec.action === 'COMPARE_BUYERS' && (
                <>
                  <button
                    onClick={() => onActionClick?.('compare_modal', rec)}
                    className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm hover:shadow-md hover:shadow-blue-200/50 transition-all duration-200 active:scale-[0.98]"
                  >
                    <BarChart3 className="w-4 h-4" />
                    {t('farmer.compareBuyers')} (Live)
                    <Sparkles className="w-3.5 h-3.5 opacity-80" />
                  </button>
                  <button
                    onClick={() => onActionClick?.('sell', rec)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all duration-200 active:scale-[0.98] shadow-xs"
                  >
                    {t('farmer.viewLots')}
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </>
              )}

              {rec.action === 'WAIT' && (
                <>
                  <button
                    onClick={() => onActionClick?.('wait', rec)}
                    className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm hover:shadow-md hover:shadow-amber-200/50 transition-all duration-200 active:scale-[0.98]"
                  >
                    <Clock className="w-4 h-4" />
                    {t('farmer.wait')} (Hold)
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </button>
                  <button
                    onClick={() => onActionClick?.('compare_modal', rec)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 transition-all duration-200 active:scale-[0.98] shadow-xs"
                  >
                    <BarChart3 className="w-4 h-4" />
                    {t('farmer.compareBuyers')}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Row 7: Details toggle */}
          <button
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium group"
          >
            {detailsOpen ? <ChevronUp className="w-3.5 h-3.5 group-hover:translate-y-[-1px] transition-transform" /> : <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-[1px] transition-transform" />}
            {detailsOpen ? t('farmer.hideDetails') : t('farmer.modelDetails')}
          </button>

          {detailsOpen && rec.details && (
            <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-xl p-4 space-y-2 text-xs text-muted-foreground animate-in fade-in slide-in-from-top-1">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <span className="font-medium text-foreground">{t('farmer.regressionSlope')}:</span> {rec.details.regression?.slope?.toFixed(2)} ₹/day
                </div>
                <div>
                  <span className="font-medium text-foreground">{t('farmer.rSquared')}:</span> {rec.details.regression?.r_squared?.toFixed(3)}
                </div>
                <div>
                  <span className="font-medium text-foreground">{t('farmer.residualStdDev')}:</span> ₹{rec.details.regression?.std_dev?.toFixed(0)}
                </div>
                <div>
                  <span className="font-medium text-foreground">{t('farmer.dataPoints')}:</span> {rec.details.data_points_used}
                </div>
                <div>
                  <span className="font-medium text-foreground">{t('farmer.priceTrend')}:</span> {rec.details.trend_pct > 0 ? '+' : ''}{rec.details.trend_pct}%
                </div>
                <div>
                  <span className="font-medium text-foreground">{t('farmer.arrivalTrend')}:</span> {rec.details.arrival_trend_pct > 0 ? '+' : ''}{rec.details.arrival_trend_pct}%
                </div>
              </div>
              {rec.details.weather?.description && (
                <div className="pt-2 border-t border-slate-100 text-[11px]">
                  <span className="font-medium text-foreground">🌦️ Weather Impact:</span> {rec.details.weather.description}
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px]">
                <BarChart3 className="w-3 h-3 text-primary" />
                <span>{t('farmer.sourceAgmarknet')}</span>
                {rec.details.weather?.source && (
                  <span className="ml-2">• 🛰️ {rec.details.weather.source}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───── Main Panel ───── */
export default function CropRecommendationsPanel({ farmerId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [compareModalRec, setCompareModalRec] = useState(null);
  const tabsRef = useRef(null);

  async function loadRecommendations() {
    if (!farmerId) return;
    try {
      const result = await api.getFarmerRecommendations(farmerId);
      setData(result);
      setActiveTab(0);
    } catch (err) {
      console.error('Failed to load farmer recommendations:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecommendations();
  }, [farmerId]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await api.syncMarketData(true);
      await loadRecommendations();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-primary/5 via-white to-primary/5 rounded-2xl border border-primary/15 p-8 flex flex-col items-center justify-center text-center shadow-xs">
        <div className="w-24 h-24 flex items-center justify-center">
          <DotLottieReact
            src="https://lottie.host/d0ced338-e3e1-4e86-9553-8fff0dea623e/e5iq7ZgcmA.json"
            loop
            autoplay
          />
        </div>
        <h4 className="font-heading font-bold text-foreground text-sm mt-3 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" /> Computing AI Market Recommendations...
        </h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Synthesizing Agmarknet regression trends, APMC arrival volumes, and live NASA POWER weather data.
        </p>
      </div>
    );
  }

  const recommendations = data?.recommendations || [];
  const syncStatus = data?.sync_status;

  if (recommendations.length === 0) {
    return (
      <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl border border-primary/10 p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">{t('farmer.aiInsightsTitle')}</h3>
            <p className="text-sm text-muted-foreground">{t('farmer.noCropsFound')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-1 md:col-span-2 space-y-0">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-foreground text-sm leading-tight">{t('farmer.aiInsightsTitle')}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                syncStatus?.is_stale_fallback
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${syncStatus?.is_stale_fallback ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                {syncStatus?.status_label || 'Agmarknet'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title={t('farmer.refreshMarketData')}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Crop Tabs */}
      <div ref={tabsRef} className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {recommendations.map((rec, idx) => {
          const isActive = idx === activeTab;
          const config = rec.has_data && rec.action ? ACTION_CONFIG[rec.action] : null;

          return (
            <button
              key={rec.crop_id}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                isActive
                  ? `bg-white shadow-sm ${config ? config.border : 'border-slate-200'} text-foreground`
                  : 'bg-transparent border-transparent text-muted-foreground hover:bg-slate-50 hover:text-foreground'
              }`}
            >
              <span className="text-lg leading-none">{rec.crop_icon}</span>
              <span>{rec.crop_name}</span>
              {rec.has_data && rec.action && isActive && (
                <span className={`ml-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${config?.badge || ''}`}>
                  {getActionLabel(rec.action, t)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Recommendation Card — animate between tabs */}
      <div className="relative min-h-[280px]">
        {recommendations.map((rec, idx) => (
          <CropCard
            key={rec.crop_id}
            rec={rec}
            isActive={idx === activeTab}
            onActionClick={(type, r) => {
              if (type === 'compare_modal') {
                setCompareModalRec(r);
              } else if (type === 'sell' || type === 'compare') {
                // Navigate to farmer lots — the first lot for this crop
                const lotId = r.lot_ids?.[0];
                navigate(lotId ? `/farmer/lots/${lotId}` : '/farmer/lots');
              } else if (type === 'wait') {
                navigate('/farmer/market-intel');
              }
            }}
          />
        ))}
      </div>

      {/* Footer: Official data badge */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <BarChart3 className="w-3 h-3" />
        <span>📊 {t('farmer.cropsAnalyzed')} ({recommendations.filter(r => r.has_data).length}/{recommendations.length})</span>
      </div>

      {/* Real-Time Interactive Buyer Comparison Modal */}
      {compareModalRec && (
        <CompareBuyersModal
          isOpen={Boolean(compareModalRec)}
          onClose={() => setCompareModalRec(null)}
          lotId={compareModalRec.lot_ids?.[0]}
          cropName={compareModalRec.crop_name}
          cropIcon={compareModalRec.crop_icon}
          marketName={compareModalRec.market_name}
        />
      )}
    </div>
  );
}
