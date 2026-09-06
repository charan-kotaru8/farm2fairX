import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import BuyerBadge from '../../components/ui/BuyerBadge';
import { ShieldCheck, CheckCircle2, Clock, AlertCircle, ChevronRight, Star, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

const TIER_STEPS = [
  {
    key: 'business_info',
    title: 'Business Information',
    desc: 'GSTIN, PAN, business type, and contact details',
    field: 'business_info_verified'
  },
  {
    key: 'location',
    title: 'Location Verified',
    desc: 'Mandi or warehouse address confirmed on record',
    field: 'location_verified'
  },
  {
    key: 'document',
    title: 'Trade Documents',
    desc: 'Mandi Trade License or FSSAI certificate submitted',
    field: 'document_verified'
  }
];

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Pending Admin Review' },
  more_info_requested: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', label: 'More Info Requested' },
  approved: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Approved & Verified' },
  rejected: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Verification Rejected' }
};

export default function BuyerVerificationStatus() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  // For demo: show all buyers status list
  useEffect(() => {
    api.getBuyers().then(setBuyers).catch(console.error).finally(() => setLoading(false));
  }, []);

  const demo_buyer = buyers.find(b => b.business_name?.includes('Sahyadri')) ||
    buyers.find(b => b.verification_status === 'pending') ||
    buyers[0];

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading verification status...</div>;
  if (!demo_buyer) return <div className="p-8 text-center text-muted-foreground">No buyer profiles found.</div>;

  const statusCfg = STATUS_CONFIG[demo_buyer.verification_status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const completedSteps = TIER_STEPS.filter(s => demo_buyer[s.field]).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Buyer Verification</h1>
        <p className="text-muted-foreground">Complete verification to submit offers on farmer lots.</p>
      </div>

      {/* Current Status Card */}
      <div className={`p-5 rounded-2xl border ${statusCfg.bg} flex items-start gap-4`}>
        <div className={`p-2.5 rounded-full bg-white shadow-xs border`}>
          <StatusIcon className={`w-6 h-6 ${statusCfg.color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">{demo_buyer.business_name}</h2>
              <p className={`text-sm font-semibold ${statusCfg.color}`}>{statusCfg.label}</p>
            </div>
            <BuyerBadge tier={demo_buyer.verification_tier} size="lg" />
          </div>
          {demo_buyer.admin_note && demo_buyer.verification_status !== 'approved' && (
            <div className="mt-3 text-sm text-foreground bg-white/70 rounded-lg p-3 border border-current/10">
              <strong className="block mb-0.5">Admin Message:</strong>
              {demo_buyer.admin_note}
            </div>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">KYC Verification Progress</h2>
          <span className="text-sm font-bold text-primary">{completedSteps} / {TIER_STEPS.length} Complete</span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${(completedSteps / TIER_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="space-y-3">
          {TIER_STEPS.map((step, i) => {
            const done = demo_buyer[step.field];
            return (
              <div key={step.key} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {done ? '✓' : i + 1}
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${done ? 'text-emerald-900' : 'text-foreground'}`}>{step.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
                <span className={`text-xs font-semibold ${done ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {done ? 'Verified' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Roadmap */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Verification Tier Roadmap</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { tier: 'basic', icon: '🟡', title: 'Basic', perks: ['Can browse marketplace', 'Can view market prices', 'Cannot submit offers yet'], current: demo_buyer.verification_tier === 'basic' },
            { tier: 'verified', icon: '🟢', title: 'Verified', perks: ['Can submit offers on all active lots', 'Buyers shown with verified badge to farmers', 'Priority in farmer notifications'], current: demo_buyer.verification_tier === 'verified' },
            { tier: 'trusted_partner', icon: '🔵', title: 'Trusted Partner', perks: ['Auto-earned with 5+ deals & 4.5+ rating', '"Most Reliable" ribbon on offer comparison', 'Featured in priority buyer listings'], current: demo_buyer.verification_tier === 'trusted_partner' }
          ].map(t => (
            <div key={t.tier} className={`p-4 rounded-xl border-2 flex flex-col gap-2 ${t.current ? 'border-primary bg-primary/5' : 'border-border bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{t.icon}</span>
                <span className="font-bold text-foreground">{t.title}</span>
                {t.current && <span className="ml-auto text-xs bg-primary text-white px-1.5 py-0.5 rounded font-semibold">Current</span>}
              </div>
              <ul className="space-y-1">
                {t.perks.map((perk, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 text-primary" /> {perk}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* All buyer profiles table (admin helper) */}
      {buyers.length > 1 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">All Demo Buyer Profiles</h2>
          <div className="space-y-3">
            {buyers.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-semibold text-sm text-foreground">{b.business_name}</span>
                  <div className="text-xs text-muted-foreground">{b.district} • {b.completed_transactions} deals • ★ {b.avg_rating}</div>
                </div>
                <BuyerBadge tier={b.verification_tier} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
