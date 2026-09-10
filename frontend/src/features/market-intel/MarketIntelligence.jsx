import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, TrendingUp, TrendingDown, Globe, ChevronDown, RefreshCw, Activity, Calendar } from 'lucide-react';
import StateDistrictSelector from './StateDistrictSelector';
import MarketMap from './MarketMap';
import CustomTooltip from './CustomTooltip';
import { usePriceTrend } from './usePriceTrend';

const SelectField = ({ label, icon: Icon, value, onChange, options, placeholder, disabled }) => (
  <div className="flex-1 min-w-[160px]">
    <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </label>
    <div className="relative">
      <select
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 appearance-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  </div>
);

export default function MarketIntelligence() {
  const { t } = useTranslation();

  // Meta: states + districts from DB (never hardcoded)
  const [meta, setMeta] = useState({ states: [], districts_by_state: {} });
  const [syncStatus, setSyncStatus] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    state: '',
    district: '',
    cropId: '',
    marketId: '',
    days: 7, // Plan v3.1: default to 7-day trend window
  });

  // Data
  const [crops, setCrops] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  // Real 7-day price trend hook from local DB (§3 Plan v3.1)
  const {
    data: trendData,
    loading: trendLoading,
    daysCount,
  } = usePriceTrend({
    state: filters.state,
    district: filters.district,
    cropId: filters.cropId,
    marketId: filters.marketId,
    days: filters.days,
  });

  // 1. Load meta (states/districts) + crops + sync status on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const [metaRes, cropsRes, syncRes] = await Promise.all([
          api.getMarketsMeta(),
          api.getCrops(),
          api.getMarketSyncStatus().catch(() => null),
        ]);
        setMeta(metaRes);
        setCrops(cropsRes);
        setSyncStatus(syncRes);

        // Default to first state (Maharashtra if available, else first)
        const defaultState = metaRes.states.includes('Maharashtra')
          ? 'Maharashtra'
          : metaRes.states[0] || '';
        const defaultCropId = cropsRes[0]?.id || '';

        setFilters(f => ({
          ...f,
          state: defaultState,
          district: '',
          cropId: defaultCropId,
        }));
      } catch (err) {
        console.error('Failed to load market meta:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  // 2. Load markets whenever state or district changes
  useEffect(() => {
    if (!filters.state && !filters.district) return;
    async function loadMarkets() {
      try {
        const marketsRes = await api.getMarkets(filters.district || undefined, filters.state || undefined);
        setMarkets(marketsRes);
      } catch (err) {
        console.error('Failed to load markets:', err);
      }
    }
    loadMarkets();
  }, [filters.state, filters.district]);

  // 3. Load comparison whenever crop/state/district changes
  useEffect(() => {
    if (!filters.cropId || loading) return;
    async function loadFiltered() {
      setComparing(true);
      try {
        const compRes = await api.getMarketComparison(filters.cropId, {
          state: filters.state || undefined,
          district: filters.district || undefined,
        });
        setComparison(Array.isArray(compRes) ? compRes : []);
      } catch (err) {
        console.error('Failed to load market comparison:', err);
      } finally {
        setComparing(false);
      }
    }
    loadFiltered();
  }, [filters.cropId, filters.state, filters.district, loading]);

  const selectedCrop = crops.find(c => c.id === filters.cropId);
  const selectedMarket = markets.find(m => m.id === filters.marketId);

  // Latest modal price from trend data
  const latestTrendPoint = trendData.length > 0 ? trendData[trendData.length - 1] : null;
  const previousTrendPoint = trendData.length > 1 ? trendData[trendData.length - 2] : null;
  const trendDelta = latestTrendPoint && previousTrendPoint
    ? latestTrendPoint.modal_price - previousTrendPoint.modal_price
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-primary font-medium">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading market intelligence...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">{t('marketIntel.pageTitle')}</h1>
          <p className="text-muted-foreground">{t('marketIntel.pageSubtitle')}</p>
        </div>
        
        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-2">
          {syncStatus?.status_label && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {syncStatus.status_label}
            </div>
          )}
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Globe className="w-3.5 h-3.5 text-primary" />
            {meta.states.length || 36} States · {
              Object.values(meta.districts_by_state).reduce((acc, ds) => acc + ds.length, 0)
            } Districts · All-India Coverage
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Whole-India Coverage: State → District Selector (§3.1) */}
          <StateDistrictSelector
            state={filters.state}
            district={filters.district}
            onChangeState={val => setFilters(f => ({ ...f, state: val, district: '', marketId: '' }))}
            onChangeDistrict={val => setFilters(f => ({ ...f, district: val, marketId: '' }))}
            allowAllStates={true}
            allowAllDistricts={true}
            statePlaceholder="All States"
            districtPlaceholder="All Districts"
          />

          {/* Crop / Commodity */}
          <SelectField
            label={t('marketIntel.crop')}
            value={filters.cropId}
            onChange={val => setFilters(f => ({ ...f, cropId: val }))}
            options={crops.map(c => ({ value: c.id, label: `${c.icon || '🌾'} ${c.name}` }))}
            placeholder="Select crop"
          />

          {/* Market (for trend chart) */}
          <SelectField
            label={t('marketIntel.marketForTrend')}
            value={filters.marketId}
            onChange={val => setFilters(f => ({ ...f, marketId: val }))}
            options={[
              { value: '', label: `All APMCs (${filters.district || filters.state || 'National'} Avg)` },
              ...markets.map(m => ({ value: m.id, label: `${m.name}, ${m.district}` })),
            ]}
          />

          {/* Timeframe */}
          <SelectField
            label="Timeframe"
            icon={Calendar}
            value={filters.days}
            onChange={val => setFilters(f => ({ ...f, days: Number(val) }))}
            options={[
              { value: 7, label: 'Last 7 Days (Recommended)' },
              { value: 14, label: 'Last 14 Days' },
              { value: 30, label: 'Last 30 Days' },
            ]}
          />

          {comparing && (
            <div className="flex items-center gap-1.5 text-xs text-primary animate-pulse self-end pb-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Refreshing...
            </div>
          )}
        </div>

        {/* Breadcrumb trail */}
        <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{filters.state || 'All States'}</span>
          {filters.district && (
            <>
              <span>›</span>
              <span className="font-medium text-foreground">{filters.district}</span>
            </>
          )}
          {selectedCrop && (
            <>
              <span>›</span>
              <span className="font-medium text-foreground">{selectedCrop.icon || '🌾'} {selectedCrop.name}</span>
            </>
          )}
          <span className="ml-auto font-medium text-slate-600">
            {comparison.length} APMC{comparison.length !== 1 ? 's' : ''} reporting
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (7-Day DB Historical Trend) */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Price Trend: {selectedCrop?.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedMarket ? `${selectedMarket.name} (${selectedMarket.district})` : `Average for ${filters.district || filters.state || 'all markets'}`}
                </p>
              </div>

              {latestTrendPoint && (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg self-start sm:self-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Latest Modal</div>
                    <div className="text-sm font-bold text-emerald-800">
                      ₹{Number(latestTrendPoint.modal_price).toLocaleString('en-IN')}/{selectedCrop?.unit || 'quintal'}
                    </div>
                  </div>
                  {trendDelta !== 0 && (
                    <div className={`flex items-center text-xs font-semibold ${trendDelta > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {trendDelta > 0 ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                      {trendDelta > 0 ? `+₹${trendDelta}` : `-₹${Math.abs(trendDelta)}`}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Honest Sparse History Indicator (§4 Plan v3.1) */}
            {daysCount > 0 && daysCount < filters.days && (
              <div className="flex items-center gap-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                <span>
                  <strong className="font-semibold">Accumulating live history:</strong> {daysCount} of {filters.days} days recorded in database so far (syncing daily via Agmarknet).
                </span>
              </div>
            )}
          </div>

          <div className="h-[280px] w-full mt-2">
            {trendLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                Fetching price trend...
              </div>
            ) : trendData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-lg p-6 text-center">
                <Activity className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
                <p className="font-medium text-foreground">No price history recorded yet for this selection</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Run the live sync or select another APMC/state to view active trend data.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B5E3C" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#1B5E3C" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={str => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    domain={['auto', 'auto']}
                    tickFormatter={val => `₹${Number(val).toLocaleString('en-IN')}`}
                  />
                  <Tooltip content={<CustomTooltip unit={selectedCrop?.unit || 'quintal'} />} />
                  <Area
                    type="monotone"
                    dataKey="modal_price"
                    stroke="#1B5E3C"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    activeDot={{ r: 5, fill: '#1B5E3C', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Market Comparison Cards */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Latest APMC Prices
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              {filters.district ? `in ${filters.district}` : filters.state ? `in ${filters.state}` : 'All APMCs'}
            </p>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {comparison.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-10 border border-dashed border-border rounded-lg p-4">
                No active prices found for this crop in {filters.district || filters.state}.
              </div>
            ) : comparison.map(comp => (
              <div
                key={comp.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  comp.is_best_value
                    ? 'border-emerald-300 bg-emerald-50/40 relative'
                    : 'border-border bg-white hover:border-slate-300'
                }`}
              >
                {comp.is_best_value && (
                  <div className="absolute -top-2.5 right-2 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                    Best Value
                  </div>
                )}
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{comp.markets?.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {comp.markets?.district}
                      {comp.markets?.state && comp.markets.state !== filters.state ? `, ${comp.markets.state}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-emerald-800">
                      ₹{Number(comp.modal_price).toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-muted-foreground">/ {selectedCrop?.unit || 'quintal'}</p>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground pt-1.5 border-t border-border/50 flex justify-between">
                  <span>Min: ₹{Number(comp.min_price).toLocaleString('en-IN')}</span>
                  <span>Max: ₹{Number(comp.max_price).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Discovery Map — Clean, District-Scoped, Lightweight Leaflet Map */}
        <div className="lg:col-span-3">
          <MarketMap
            comparison={comparison}
            selectedCrop={selectedCrop}
            state={filters.state}
            district={filters.district}
            onSelectDistrict={(dist) => setFilters(f => ({ ...f, district: dist, marketId: '' }))}
          />
        </div>
      </div>
    </div>
  );
}
