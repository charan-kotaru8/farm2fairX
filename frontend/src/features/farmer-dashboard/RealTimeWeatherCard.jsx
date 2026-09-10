import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import {
  Sun,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  RefreshCw,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function RealTimeWeatherCard({ marketName, district, farmerId }) {
  const { t } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadWeather() {
    try {
      const data = await api.getCurrentWeather({ marketName, district, farmerId });
      if (data) {
        setWeather(data);
      }
    } catch (err) {
      console.error('Failed to load real-time weather:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadWeather();
  }, [marketName, district, farmerId]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadWeather();
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-sky-50 to-blue-50/50 rounded-2xl border border-sky-100 p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-sky-200/50 rounded w-48 mb-2" />
          <div className="h-4 bg-sky-200/50 rounded w-24" />
        </div>
        <div className="h-4 bg-sky-200/40 rounded w-3/4" />
      </div>
    );
  }

  if (!weather) return null;

  const isRain = weather.rainfall_mm > 2 || weather.risk === 'moderate_rain' || weather.risk === 'heavy_rain';
  const isHeat = weather.temp_c > 38 || weather.risk === 'heat_stress';
  const WeatherIcon = isRain ? CloudRain : (isHeat ? Thermometer : Sun);

  const riskBadge = weather.risk === 'warning' || weather.risk === 'heavy_rain' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
      <AlertTriangle className="w-3.5 h-3.5" /> High Moisture Advisory
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
      <CheckCircle2 className="w-3.5 h-3.5" /> Favorable Harvest & Transport
    </span>
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-200/70 bg-gradient-to-r from-sky-50/80 via-white to-blue-50/60 p-4 shadow-xs">
      {/* Subtle background glow */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-200/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Weather condition + description */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white flex items-center justify-center shadow-md shadow-amber-200/60 shrink-0">
            <WeatherIcon className="w-6 h-6 animate-pulse-subtle" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-700">
                {t('farmer.todayWeather') || "Today's Weather Condition"}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-600" /> {weather.market_name || marketName || (district ? `${district} APMC` : 'Local APMC')}
              </span>
              {riskBadge}
            </div>

            <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
              <span className="text-lg font-bold text-foreground">
                {weather.condition || 'Clear / Favorable'}
              </span>
              <span className="text-sm text-muted-foreground">
                · {weather.description}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Metrics + Satellite source + Refresh button */}
        <div className="flex items-center justify-between md:justify-end gap-5 pt-2 md:pt-0 border-t md:border-t-0 border-sky-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <div>
                <div className="text-xs text-muted-foreground">Temp</div>
                <div className="text-sm font-bold text-foreground tabular-nums">
                  {weather.temp_c}°C
                  {weather.max_temp_c && (
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      (Max {weather.max_temp_c}°)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-sky-200/70" />

            <div className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-xs text-muted-foreground">Rainfall</div>
                <div className="text-sm font-bold text-foreground tabular-nums">
                  {weather.rainfall_mm} mm
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block text-right">
              <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('farmer.realTimeNasa') || 'NASA POWER Live'}
              </div>
              <div className="text-[9px] text-muted-foreground">Satellite Meterology</div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl text-sky-700 hover:bg-sky-100 transition-colors disabled:opacity-50"
              title="Refresh Real-Time Weather"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
