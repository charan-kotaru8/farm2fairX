import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Layers, ShieldCheck } from 'lucide-react';
import PriceRecommendationCard from '../farmer-dashboard/PriceRecommendationCard';
import BuyerMatchCard from '../farmer-dashboard/BuyerMatchCard';

export default function FpoAiInsightsPanel({ aiCtx }) {
  const [selectedCropId, setSelectedCropId] = useState(aiCtx?.crop_id || null);
  const [selectedCropName, setSelectedCropName] = useState(aiCtx?.crop_name || null);

  useEffect(() => {
    if (aiCtx?.crop_id && !selectedCropId) {
      setSelectedCropId(aiCtx.crop_id);
      setSelectedCropName(aiCtx.crop_name);
    }
  }, [aiCtx, selectedCropId]);

  if (!aiCtx) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-border shadow-xs animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 rounded w-48" />
            <div className="h-3 bg-slate-100 rounded w-72" />
          </div>
        </div>
      </div>
    );
  }

  const activeCropId = selectedCropId || aiCtx.crop_id;
  const activeCropName = selectedCropName || aiCtx.crop_name;
  const availableCrops = aiCtx.available_crops || [];

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-950 to-emerald-900 rounded-2xl p-5 text-white shadow-sm border border-emerald-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-emerald-200 shrink-0 shadow-inner">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-heading font-bold text-white tracking-tight">
                FPO Collective AI Intelligence & Buyer Matching
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Engine v5.0
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Real-time APMC price forecasting & verified commercial buyer matching for pooled member harvests.
            </p>
          </div>
        </div>

        {/* Crop Selector Tabs (if multiple crops are pooled) */}
        {availableCrops.length > 1 && (
          <div className="flex items-center gap-1.5 bg-emerald-900/90 border border-emerald-700/60 p-1 rounded-xl self-start sm:self-auto overflow-x-auto">
            {availableCrops.map((c) => {
              const isSelected = c.crop_id === activeCropId;
              return (
                <button
                  key={c.crop_id}
                  onClick={() => {
                    setSelectedCropId(c.crop_id);
                    setSelectedCropName(c.crop_name);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
                  }`}
                >
                  {c.crop_name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: 2 Columns Price Recommendation + 1 Column Matched Buyers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real AI Price Recommendation Card (takes 2 columns) */}
        <PriceRecommendationCard
          cropId={activeCropId}
          marketId={aiCtx.market_id}
          cropName={activeCropName}
          marketName={aiCtx.market_name}
        />

        {/* AI Matched Buyers Card (takes 1 column) */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between">
          {aiCtx.aggregated_lot_id ? (
            <BuyerMatchCard lotId={aiCtx.aggregated_lot_id} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground text-sm">No Active Lot for Buyer Matching</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Aggregate member lots to trigger automatic weighted buyer matching across verified institutional buyers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
