import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, TrendingUp, TrendingDown, Filter } from 'lucide-react';

// Fix Leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MarketIntelligence() {
  const [data, setData] = useState({ crops: [], markets: [], comparison: [], trend: [], loading: true });
  const [filters, setFilters] = useState({
    cropId: '',
    marketId: '',
    days: 30
  });

  useEffect(() => {
    async function loadInitial() {
      try {
        const [cropsRes, marketsRes] = await Promise.all([
          api.getCrops(),
          api.getMarkets()
        ]);
        
        const initialCropId = cropsRes[0]?.id || '';
        const initialMarketId = marketsRes[0]?.id || '';
        
        setFilters(f => ({ ...f, cropId: initialCropId, marketId: initialMarketId }));
        setData(d => ({ ...d, crops: cropsRes, markets: marketsRes, loading: false }));
      } catch (err) {
        console.error(err);
        setData(d => ({ ...d, loading: false }));
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadFiltered() {
      if (!filters.cropId) return;
      try {
        const [compRes, pricesRes] = await Promise.all([
          api.getMarketComparison(filters.cropId),
          api.getMarketPrices({ cropId: filters.cropId, marketId: filters.marketId, days: filters.days })
        ]);
        setData(d => ({ ...d, comparison: compRes, trend: pricesRes }));
      } catch (err) {
        console.error(err);
      }
    }
    if (!data.loading) loadFiltered();
  }, [filters, data.loading]);

  if (data.loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading market intel...</div>;
  }

  const selectedCrop = data.crops.find(c => c.id === filters.cropId);
  const selectedMarket = data.markets.find(m => m.id === filters.marketId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Market Intelligence</h1>
          <p className="text-muted-foreground">Real-time prices and analytics across Maharashtra APMCs.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-muted-foreground mb-1">Crop</label>
          <select 
            className="w-full rounded-md border-border focus:border-primary focus:ring-primary text-sm"
            value={filters.cropId}
            onChange={e => setFilters({...filters, cropId: e.target.value})}
          >
            {data.crops.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-muted-foreground mb-1">Market (for Trend)</label>
          <select 
            className="w-full rounded-md border-border focus:border-primary focus:ring-primary text-sm"
            value={filters.marketId}
            onChange={e => setFilters({...filters, marketId: e.target.value})}
          >
            <option value="">All Markets (Avg)</option>
            {data.markets.map(m => <option key={m.id} value={m.id}>{m.name}, {m.district}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-muted-foreground mb-1">Timeframe</label>
          <select 
            className="w-full rounded-md border-border focus:border-primary focus:ring-primary text-sm"
            value={filters.days}
            onChange={e => setFilters({...filters, days: Number(e.target.value)})}
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Price Trend: {selectedCrop?.name} {selectedMarket ? `at ${selectedMarket.name}` : '(All Markets)'}
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B5E3C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1B5E3C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={str => new Date(str).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                  axisLine={false}
                  tickLine={false}
                  tick={{fontSize: 12, fill: '#6B7280'}}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{fontSize: 12, fill: '#6B7280'}}
                  domain={['auto', 'auto']}
                  tickFormatter={val => `₹${val}`}
                />
                <Tooltip 
                  labelFormatter={str => new Date(str).toLocaleDateString()}
                  formatter={(val) => [`₹${val}`, 'Modal Price']}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="modal_price" stroke="#1B5E3C" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Comparison Cards */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">Latest Prices across Markets</h2>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {data.comparison.map(comp => (
              <div key={comp.id} className={`p-4 rounded-lg border ${comp.is_best_value ? 'border-secondary bg-secondary/5 relative' : 'border-border'}`}>
                {comp.is_best_value && (
                  <div className="absolute -top-3 -right-2 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded shadow-sm">
                    Best Value
                  </div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{comp.markets?.name}</h3>
                    <p className="text-xs text-muted-foreground">{comp.markets?.district}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">₹{comp.modal_price}</div>
                    <p className="text-[10px] text-muted-foreground">/ {selectedCrop?.unit || 'quintal'}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-border/50 flex justify-between">
                  <span>Min: ₹{comp.min_price}</span>
                  <span>Max: ₹{comp.max_price}</span>
                </div>
              </div>
            ))}
            {data.comparison.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No recent data available.</p>
            )}
          </div>
        </div>

        {/* Local Market Discovery Map */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Market Discovery Map
            </h2>
            <p className="text-sm text-muted-foreground">Showing {data.comparison.length} APMCs for {selectedCrop?.name}</p>
          </div>
          <div className="h-[400px] w-full rounded-xl overflow-hidden border border-border z-0">
            <MapContainer 
              center={[19.0, 75.5]} // Center of Maharashtra
              zoom={6} 
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {data.comparison.map(comp => (
                comp.markets?.lat && comp.markets?.lng && (
                  <Marker key={comp.id} position={[comp.markets.lat, comp.markets.lng]}>
                    <Popup>
                      <div className="p-1">
                        <strong className="block mb-1">{comp.markets.name}</strong>
                        <span className="text-sm text-primary font-bold">₹{comp.modal_price} / {selectedCrop?.unit}</span>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
