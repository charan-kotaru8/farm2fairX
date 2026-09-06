import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Edit3, Check, RefreshCw, Zap, Sparkles, 
  ArrowUpRight, AlertCircle, Building, CheckCircle2, X 
} from 'lucide-react';
import { api } from '../../services/api';

export default function MarketPriceEditor() {
  const [crops, setCrops] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({
    modal_price: '',
    min_price: '',
    max_price: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI Live Device Simulator State
  const [simCropId, setSimCropId] = useState('');
  const [simPrice, setSimPrice] = useState('5150');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [cropsData, marketsData] = await Promise.all([
        api.getCrops(),
        api.getMarkets(),
      ]);
      setCrops(cropsData || []);
      setMarkets(marketsData || []);

      if (cropsData?.length > 0) {
        setSelectedCrop(cropsData[0].id);
        setSimCropId(cropsData[0].id);
        await loadMarketPrices(cropsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load market data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMarketPrices = async (cropId) => {
    try {
      const data = await api.getMarketPrices({ cropId, days: 7 });
      setPrices(data || []);
    } catch (err) {
      console.error('Failed to load prices for crop:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleCropChange = (cropId) => {
    setSelectedCrop(cropId);
    loadMarketPrices(cropId);
  };

  const handleOpenEdit = (priceRow) => {
    setEditingRow(priceRow);
    setEditForm({
      modal_price: priceRow.modal_price || '',
      min_price: priceRow.min_price || '',
      max_price: priceRow.max_price || '',
    });
    setSaveSuccess(false);
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!editingRow) return;

    setSaving(true);
    try {
      await api.updateMarketPrice({
        crop_id: editingRow.crop_id,
        market_id: editingRow.market_id,
        modal_price: parseFloat(editForm.modal_price),
        min_price: parseFloat(editForm.min_price),
        max_price: parseFloat(editForm.max_price),
      });

      setSaveSuccess(true);
      await loadMarketPrices(selectedCrop);
      
      // Auto-trigger simulation to show live effect if the crop matches
      if (simCropId === editingRow.crop_id) {
        handleRunAiSimulation();
      }

      setTimeout(() => {
        setEditingRow(null);
        setSaveSuccess(false);
      }, 1000);
    } catch (err) {
      alert('Failed to update price: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRunAiSimulation = async () => {
    if (!simCropId || !simPrice) return;
    setSimLoading(true);
    setSimResult(null);
    try {
      const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(`${BASE}/ai/price-recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop_id: simCropId,
          quantity_quintals: 50,
          quality_grade: 'FAQ',
          farmer_target_price: parseFloat(simPrice),
        }),
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Live Demo Device (§7.4)
            </span>
            <span className="text-xs font-mono text-emerald-600 flex items-center gap-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live AI Dynamic Feeder Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900">
            APMC Mandi Price Control Desk
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Modify benchmark mandi modal prices inline. Changes instantly propagate to AI price recommendations platform-wide.
          </p>
        </div>
      </div>

      {/* Presentation Callout */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/20 shrink-0">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">How This Live Demo Device Works (§7.4)</h4>
            <p className="text-xs text-blue-200/90 leading-relaxed mt-0.5 max-w-3xl">
              The AI price recommendation engine queries real-time mandi prices dynamically on every invocation. When you edit any benchmark price in the table below, the change takes effect immediately without needing server reboots or cache invalidation. Test it with the live simulator below!
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Price Table + Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mandi Prices Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Crop Selector Tabs */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
            {crops.map((crop) => (
              <button
                key={crop.id}
                onClick={() => handleCropChange(crop.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCrop === crop.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{crop.icon || '🌾'}</span>
                <span>{crop.name}</span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  APMC Benchmark Rates
                </h3>
                <p className="text-xs text-slate-500">
                  Latest modal, min, and max arrival prices per quintal
                </p>
              </div>
              <button
                onClick={() => loadMarketPrices(selectedCrop)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                title="Refresh table"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-primary" />
                <span className="text-xs">Loading APMC market benchmarks...</span>
              </div>
            ) : prices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No recent price records found for this crop.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Mandi / District</th>
                      <th className="py-3 px-4">Modal Price (₹/q)</th>
                      <th className="py-3 px-4">Min - Max (₹/q)</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prices.slice(0, 10).map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>{row.markets?.name || 'Local APMC'}</span>
                            <span className="text-slate-400 font-normal">({row.markets?.district})</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 font-heading text-sm">
                          ₹{row.modal_price?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          ₹{row.min_price} – ₹{row.max_price}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {row.date || 'Today'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenEdit(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Live AI Recommendation Simulator (1 col) */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Live AI Price Intelligence Tester
                </h3>
                <p className="text-[11px] text-slate-500">
                  Verify immediate reaction to mandi price updates
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Crop
                </label>
                <select
                  value={simCropId}
                  onChange={(e) => setSimCropId(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.variety || 'Commercial'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Simulated Asking Price (₹/q)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={simPrice}
                    onChange={(e) => setSimPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-primary font-semibold"
                  />
                </div>
              </div>

              <button
                onClick={handleRunAiSimulation}
                disabled={simLoading}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                id="run-ai-eval-btn"
              >
                <Zap className={`w-3.5 h-3.5 text-amber-400 ${simLoading ? 'animate-spin' : ''}`} />
                {simLoading ? 'Evaluating AI Response...' : 'Evaluate AI Recommendation'}
              </button>
            </div>

            {/* Simulation Result Output */}
            {simResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    AI Verdict
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                    simResult.verdict === 'fair' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    simResult.verdict === 'aggressive' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>
                    {simResult.verdict || 'Evaluated'}
                  </span>
                </div>

                <div className="text-xs">
                  <div className="text-slate-500 text-[11px]">Dynamic Expected Range:</div>
                  <div className="font-heading font-bold text-slate-900 text-sm">
                    {simResult.expected_price_range 
                      ? `₹${simResult.expected_price_range[0]} – ₹${simResult.expected_price_range[1]} /q`
                      : 'Updated based on new modal price'}
                  </div>
                </div>

                {simResult.reasoning && (
                  <p className="text-[11px] text-slate-600 leading-relaxed border-t border-slate-200 pt-2 font-mono">
                    {simResult.reasoning}
                  </p>
                )}

                <div className="text-[10px] text-emerald-700 bg-emerald-50 p-1.5 rounded text-center font-medium border border-emerald-200">
                  ✨ Updated live from latest market_prices row!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT PRICE MODAL */}
      {editingRow && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs text-slate-500 font-medium">{editingRow.markets?.name}</span>
                <h3 className="text-base font-heading font-bold text-slate-900">Update Mandi Benchmark</h3>
              </div>
              <button
                onClick={() => setEditingRow(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Benchmark updated! AI feeder updated live.
              </div>
            )}

            <form onSubmit={handleSavePrice} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Modal Benchmark Price (₹/q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editForm.modal_price}
                  onChange={(e) => setEditForm({ ...editForm, modal_price: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary focus:outline-hidden font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Min Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.min_price}
                    onChange={(e) => setEditForm({ ...editForm, min_price: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Max Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.max_price}
                    onChange={(e) => setEditForm({ ...editForm, max_price: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50 text-[11px] text-blue-800">
                ⚡ Directly pushes new benchmark price to backend DB, triggering live updates across AI pricing.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg shadow-xs disabled:opacity-50"
                  id="confirm-price-update-btn"
                >
                  {saving ? 'Updating...' : 'Save & Propagate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
