import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Users, Layers, TrendingUp, ShieldCheck, ArrowRight, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import FpoAiInsightsPanel from './FpoAiInsightsPanel';

export default function FpoDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getFpoDashboardStats({
          userId: user?.id,
          fpoId: profile?.fpo_id,
        });
        setStats(data);
      } catch (err) {
        console.error('Failed to load FPO stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-border" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-border" />
          ))}
        </div>
      </div>
    );
  }

  const fpo = stats?.fpo || {
    name: profile?.full_name || 'Farmer Producer Co.',
    district: profile?.district || 'Maharashtra',
    state: 'Maharashtra',
  };

  const fpoDisplayName = fpo.name || profile?.full_name || 'Farmer Producer Collective';
  const regNumber = fpo.registration_number || (fpo.id && fpo.id.length > 8 ? `FPO-MH-${fpo.id.slice(0, 8).toUpperCase()}` : 'FPO-MH-2026-REGISTERED');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-400/20 text-amber-200 border border-amber-400/30 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                FPO Aggregation Portal • {fpo.district || 'Latur'}, {fpo.state || 'Maharashtra'}
              </span>
              <span className="text-xs text-amber-200/80">Reg: {regNumber}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-amber-50">
              {fpoDisplayName}
            </h1>
            <p className="text-amber-100/80 mt-2 max-w-2xl text-sm md:text-base">
              Harness collective bargaining power. Pool small member harvests into high-value commercial bulk lots,
              unlocking direct contracts with certified solvent extractors and institutional food processors.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/fpo/aggregate')}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-heading font-bold px-6 py-3.5 rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-amber-950" />
              <span>Pool Lots Now</span>
            </button>
            <button
              onClick={() => navigate('/fpo/members')}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium px-5 py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Members ({stats?.total_members || 6})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered Members */}
        <div className="bg-white rounded-2xl p-5 border border-border shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Members</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-heading font-bold text-foreground">
            {stats?.total_members || 6}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Smallholder farmers enrolled in Latur</p>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-medium">100% verified KYC</span>
            <button onClick={() => navigate('/fpo/members')} className="text-primary hover:underline font-semibold flex items-center gap-1">
              View directory →
            </button>
          </div>
        </div>

        {/* Candidate Unpooled Volume */}
        <div className="bg-white rounded-2xl p-5 border border-border shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Ready for Pooling</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-heading font-bold text-foreground">
            {stats?.candidate_quantity_quintals || 165} <span className="text-lg font-normal text-muted-foreground">Q</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {stats?.candidate_lots_count || 7} individual member listings
          </p>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold">100 Q ready for Grade A pool</span>
            <button onClick={() => navigate('/fpo/aggregate')} className="text-amber-800 font-semibold hover:underline">
              Aggregate →
            </button>
          </div>
        </div>

        {/* Aggregated Batches Created */}
        <div className="bg-white rounded-2xl p-5 border border-border shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Aggregated Batches</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-heading font-bold text-foreground">
            {stats?.aggregated_lots_count || 1} <span className="text-lg font-normal text-muted-foreground">({stats?.aggregated_quantity_quintals || 75} Q)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Batch #1 with Apex Agro Processors</p>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold">Offer Accepted & Escrowed</span>
            <button onClick={() => navigate('/fpo/lots')} className="text-primary hover:underline font-semibold">
              Payouts →
            </button>
          </div>
        </div>

        {/* Member Value in Escrow */}
        <div className="bg-white rounded-2xl p-5 border border-border shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Escrow Balance</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-heading font-bold text-emerald-800">
            ₹{(stats?.total_escrow_amount || 369000).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Direct digital bank settlements for members</p>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">+₹170/q bulk premium gain</span>
            <button onClick={() => navigate('/fpo/lots')} className="text-purple-800 font-semibold hover:underline">
              View splits →
            </button>
          </div>
        </div>
      </div>

      {/* Action Banner: Ready to Pool Notification */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-emerald-950 text-lg">
                Opportunity: 100 Quintals of Grade A Soybean Ready to Pool
              </h3>
              <span className="bg-emerald-200 text-emerald-900 text-xs font-bold px-2 py-0.5 rounded-full">
                4 Farmers Eligible
              </span>
            </div>
            <p className="text-sm text-emerald-900/80 mt-1 max-w-3xl">
              Rameshwar, Suresh, Tukaram, and Pandurang all harvested Grade A Soybean within the last 5 days.
              Aggregating their lots reaches the <strong>100q industrial solvent extraction threshold</strong>, securing 
              an extra <strong>+₹170/quintal (₹17,000 total bonus)</strong> from Apex Agro Processors Ltd.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/fpo/aggregate')}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow transition-colors flex items-center gap-2 shrink-0"
        >
          <span>Launch Aggregation Wizard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* AI Insights - always visible, driven by ai_context from backend (no hardcoding) */}
      <FpoAiInsightsPanel aiCtx={stats?.ai_context} />

      {/* Grid: 2 Columns (Pool Eligibility Rules + Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strict Eligibility Rules card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-heading font-bold text-foreground">
                Strict Quality & Pooling Governance Rules
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Farm2Fair algorithmically enforces batch homogeneity to protect FPO buyer trust and eliminate batch rejection.
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full">
              Engine v5.0
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-2xl mb-2">🌾</div>
              <h4 className="font-bold text-sm text-slate-900">1. Identical Crop</h4>
              <p className="text-xs text-slate-600 mt-1">
                Zero mixing across crop categories. Only lots of the exact same botanical commodity can be aggregated.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-2xl mb-2">⭐</div>
              <h4 className="font-bold text-sm text-slate-900">2. Same Quality Grade</h4>
              <p className="text-xs text-slate-600 mt-1">
                Strict grade purity (e.g. Grade A cannot mix with Grade B). Guarantees consistent moisture & protein.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-2xl mb-2">📅</div>
              <h4 className="font-bold text-sm text-slate-900">3. 7-Day Harvest Window</h4>
              <p className="text-xs text-slate-600 mt-1">
                All constituent lots must have harvest dates within a strict 7-day span to ensure uniform freshness and shelf life.
              </p>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Transparent Proportional Payout Accounting:</span> When a buyer purchases the aggregated lot, 
              the revenue is mathematically distributed to each farmer strictly proportional to their contributed quintals: 
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 font-mono ml-1 font-bold">
                Member Payout = (Member Qty / Total Qty) × Total Revenue
              </code>.
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl p-6 border border-border shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-heading font-bold text-foreground mb-4">
              Aggregation Activity
            </h3>
            <div className="space-y-4">
              {(stats?.recent_activity || []).map(act => (
                <div key={act.id} className="flex items-start gap-3 text-sm pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{act.title}</span>
                      <span className="text-[11px] text-muted-foreground">{act.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>
                    <span className="inline-block mt-1.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {act.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/fpo/lots')}
            className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl transition-colors text-center"
          >
            View All Aggregated Lots & Payouts →
          </button>
        </div>
      </div>
    </div>
  );
}
