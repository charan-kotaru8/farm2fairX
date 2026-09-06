import React from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BuyerBadge({ tier = 'basic', size = 'sm', showTooltip = true }) {
  const tierConfig = {
    trusted_partner: {
      label: 'Trusted Partner',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: <ShieldCheck className={size === 'lg' ? 'w-4 h-4 text-blue-600' : 'w-3.5 h-3.5 text-blue-600'} />,
      criteria: 'Earned automatically: ≥5 completed transactions & ≥4.5★ rating.'
    },
    verified: {
      label: 'Verified Buyer',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: <CheckCircle2 className={size === 'lg' ? 'w-4 h-4 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'} />,
      criteria: 'Admin verified: Business registration, location & trade licenses verified.'
    },
    basic: {
      label: 'Basic (Unverified)',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: <AlertCircle className={size === 'lg' ? 'w-4 h-4 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />,
      criteria: 'Self-declared profile. Pending document verification by admin.'
    }
  };

  const config = tierConfig[tier] || tierConfig.basic;

  return (
    <div className="group relative inline-flex items-center">
      <span className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${
        size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
      } ${config.badgeClass} shadow-xs`}>
        {config.icon}
        {config.label}
      </span>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
          <div className="bg-slate-900 text-white text-[11px] leading-tight rounded-md py-1.5 px-2.5 max-w-[220px] text-center shadow-lg border border-slate-700">
            <span className="font-bold text-amber-400 block mb-0.5">{config.label}</span>
            {config.criteria}
          </div>
          <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}
