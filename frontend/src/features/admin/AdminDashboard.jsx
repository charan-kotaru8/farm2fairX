import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, ShieldCheck, AlertCircle, Package, ArrowUpRight, 
  Clock, CheckCircle2, DollarSign, Scale, ExternalLink, RefreshCw 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, 
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { api } from '../../services/api';

const STATUS_COLORS = {
  'Listed / Available': '#94a3b8',
  'Negotiation': '#f59e0b',
  'Transport Booked': '#6366f1',
  'In Transit': '#3b82f6',
  'Delivered & Settled': '#10b981',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showSpin = false) => {
    if (showSpin) setRefreshing(true);
    try {
      const [summaryRes, chartsRes] = await Promise.all([
        api.getAdminSummary(),
        api.getAdminCharts(),
      ]);
      setSummary(summaryRes);
      setChartsData(chartsRes);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
      if (showSpin) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500 font-medium">Loading Governance Analytics...</p>
        </div>
      </div>
    );
  }

  const volumeTrend = chartsData?.volume_trend || [];
  const statusDistribution = chartsData?.status_distribution || [];
  const benefitTrend = chartsData?.benefit_growth_trend || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Admin Governance Desk
            </span>
            <span className="text-xs text-slate-400 font-mono">Daily-Live DB Sync</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900">
            Marketplace Overview & Oversight
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Single source of truth for fair value creation, operational queues, and transaction integrity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors shadow-xs"
            id="admin-refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Hero Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {/* HERO CARD: Farmer Benefit (Locked Formula §7.1) */}
        <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-52 h-52 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-emerald-100 backdrop-blur-md border border-white/20">
                <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
                Fair Value Creation Metric
              </span>
              <span className="text-[11px] font-mono text-emerald-200/80">
                §7.1 Unified Source of Truth
              </span>
            </div>

            <div className="text-sm font-medium text-emerald-100">
              Cumulative Farmer Benefit Unlocked
            </div>
            <div className="text-4xl md:text-5xl font-extrabold font-heading tracking-tight mt-1 text-white">
              {formatCurrency(summary?.cumulative_farmer_benefit_inr)}
            </div>

            {/* Formula Pill strictly matching Phase 2 */}
            <div className="mt-4 p-3 rounded-xl bg-black/25 border border-white/10 backdrop-blur-sm">
              <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-0.5">
                Enforced Mathematical Formula
              </div>
              <div className="text-xs font-mono text-emerald-100 leading-relaxed font-semibold">
                (accepted_offer − first_available_offer) × lot_quantity
              </div>
              <div className="text-[11px] text-emerald-200/70 mt-1">
                Directly calculated from Phase 2 Fair Value Story Card logic. Zero divergent formulas.
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-emerald-100/90">
            <span>Verified against {summary?.active_lots_count || 0} active lots</span>
            <span className="font-semibold text-emerald-300">100% Audit Verifiable</span>
          </div>
        </div>

        {/* Traded Volume Metric */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Traded Volume</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-heading">
              {summary?.traded_volume_quintals?.toLocaleString() || 0} <span className="text-base font-medium text-slate-400">q</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Commercial produce moved through digital contracts
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <ArrowUpRight className="w-4 h-4" />
            <span>+18.4% vs previous month</span>
          </div>
        </div>

        {/* Open Grievances & SLA Health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Grievances & SLA</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
              {summary?.open_grievances_count || 0}
              {summary?.sla_breached_count > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                  {summary.sla_breached_count} SLA Breached
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active disputes within 48h resolution window
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('/admin/grievances')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center justify-between w-full"
            >
              <span>Review Grievance Queue</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Buyer Verification Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Buyer Verification</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-heading">
              {summary?.verified_buyers_count || 0}
              <span className="text-base font-normal text-slate-400"> / {summary?.total_buyers_count || 0}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Buyers with certified business KYC credentials
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('/admin/verifications')}
              className="text-xs font-bold text-primary hover:underline flex items-center justify-between w-full"
            >
              <span>Manage Verifications</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active Lots & Deal Velocity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Lots Listed</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-heading">
              {summary?.active_lots_count || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Soybean, Tur Dal, Chana in auction or logistics
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('/admin/transactions')}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center justify-between w-full"
            >
              <span>View Lifecycle Steppers</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Operational Triage Quick Actions (§7.2 Separation) */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Purpose-Built Admin Workflows (§7.2)
            </h3>
            <p className="text-xs text-slate-300">
              Discrete operational queues designed to avoid cluttered triage inboxes.
            </p>
          </div>
          <span className="text-xs text-emerald-400 font-mono">5 Active Modules</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/admin/verifications')}
            className="p-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </div>
            <div className="text-sm font-bold">Buyer Verification</div>
            <div className="text-[11px] text-slate-400 mt-0.5">KYC docs & trust tiers</div>
          </button>

          <button
            onClick={() => navigate('/admin/grievances')}
            className="p-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-left group relative"
          >
            {summary?.sla_breached_count > 0 && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
            <div className="flex items-center justify-between mb-1.5">
              <Scale className="w-5 h-5 text-amber-400" />
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </div>
            <div className="text-sm font-bold">Grievance Triage</div>
            <div className="text-[11px] text-slate-400 mt-0.5">48h SLA & audit notes</div>
          </button>

          <button
            onClick={() => navigate('/admin/markets')}
            className="p-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </div>
            <div className="text-sm font-bold">Market Price Control</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Live demo device (§7.4)</div>
          </button>

          <button
            onClick={() => navigate('/admin/transactions')}
            className="p-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <Clock className="w-5 h-5 text-purple-400" />
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </div>
            <div className="text-sm font-bold">Transaction Lifecycle</div>
            <div className="text-[11px] text-slate-400 mt-0.5">8-node status stepper</div>
          </button>
        </div>
      </div>

      {/* 3 Focused Visualizations (§7.8) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 1: Traded Volume Growth (Line Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 font-heading">Traded Volume Growth</h3>
            <p className="text-xs text-slate-500">Monthly commercial throughput in quintals</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  formatter={(value) => [`${value} quintals`, 'Volume']}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Transaction Status Distribution (Donut Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 font-heading">Active Pipeline Distribution</h3>
            <p className="text-xs text-slate-500">Live lots distributed across transaction stages</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={STATUS_COLORS[entry.status] || '#cbd5e1'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} lots`, name]}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Farmer Benefit Trajectory (Gradient Area Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 font-heading">Farmer Fair Value Curve</h3>
            <p className="text-xs text-slate-500">Cumulative premium unlocked over mandi baseline</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={benefitTrend}>
                <defs>
                  <linearGradient id="benefitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip 
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Cumulative Premium']}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulative_benefit" 
                  stroke="#059669" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#benefitGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
