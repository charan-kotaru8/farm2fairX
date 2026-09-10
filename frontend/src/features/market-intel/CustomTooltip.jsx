import React from 'react';

/**
 * Custom Tooltip for Recharts Price Trend Chart (Plan v3.1 §4).
 * Shows date, formatted modal price in ₹ (Indian format), and min/max band.
 */
export default function CustomTooltip({ active, payload, label, unit = 'quintal' }) {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0]?.payload || {};
  const modalPrice = dataPoint.modal_price ?? dataPoint.modal;
  const minPrice = dataPoint.min_price ?? dataPoint.min;
  const maxPrice = dataPoint.max_price ?? dataPoint.max;

  const formattedDate = label
    ? new Date(label).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-emerald-100 p-3 rounded-xl shadow-lg text-xs min-w-[170px] pointer-events-none">
      <div className="font-medium text-muted-foreground pb-1.5 border-b border-border/50 mb-2">
        {formattedDate}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground font-medium">Modal Price:</span>
          <span className="text-sm font-bold text-emerald-800">
            {formatCurrency(modalPrice)}
            <span className="text-[10px] font-normal text-muted-foreground ml-0.5">/{unit}</span>
          </span>
        </div>

        {(minPrice != null || maxPrice != null) && (
          <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground">
            <span>Range:</span>
            <span className="font-medium text-foreground">
              {formatCurrency(minPrice)} – {formatCurrency(maxPrice)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
