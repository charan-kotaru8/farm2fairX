import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useMarketsMeta } from '../../hooks/useMarketsMeta';
import {
  User, Building2, MapPin, Phone, Mail, FileText, Hash,
  Save, CheckCircle2, AlertCircle, ChevronDown, Loader2, ArrowLeft,
  ShieldCheck, Award, Globe
} from 'lucide-react';

const BUSINESS_TYPES = [
  { name: 'Trader', icon: '🏪' },
  { name: 'Processor', icon: '🏭' },
  { name: 'Exporter', icon: '✈️' },
  { name: 'Retailer', icon: '🛒' },
  { name: 'Wholesaler', icon: '📦' },
  { name: 'Institutional', icon: '🏛️' },
];

const TIER_CONFIG = {
  basic: { label: 'Basic', color: 'bg-slate-100 text-slate-700 border-slate-300', icon: '🔵' },
  silver: { label: 'Silver', color: 'bg-slate-100 text-slate-700 border-slate-400', icon: '🥈' },
  gold: { label: 'Gold', color: 'bg-amber-50 text-amber-800 border-amber-300', icon: '🥇' },
  platinum: { label: 'Platinum', color: 'bg-violet-50 text-violet-800 border-violet-300', icon: '💎' },
};

const InputField = ({ label, icon: Icon, required, children, helper }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
      <Icon className="w-4 h-4 text-blue-600" />
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
  </div>
);

export default function BuyerProfilePage() {
  const navigate = useNavigate();
  const { user, profile: authProfile, roleData, refreshProfile } = useAuth();
  const { meta, districtsFor } = useMarketsMeta();

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    state: 'Maharashtra',
    district: '',
  });

  const [buyerForm, setBuyerForm] = useState({
    business_name: '',
    business_type: 'Trader',
    gst_number: '',
    pan_number: '',
    contact_person: '',
    phone: '',
    email: '',
    city: '',
    state: 'Maharashtra',
    district: 'Pune',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [buyerEntity, setBuyerEntity] = useState(null);

  useEffect(() => {
    async function init() {
      if (!user?.id) return;
      try {
        const res = await api.getProfile(user.id);
        const profileData = res?.profile || res;
        const rd = res?.role_data || roleData;

        if (profileData) {
          setForm({
            full_name: profileData.full_name || authProfile?.full_name || '',
            phone: profileData.phone || '',
            district: profileData.district || '',
            state: profileData.state || 'Maharashtra',
          });
        }

        if (rd) {
          setBuyerEntity(rd);
          setBuyerForm({
            business_name: rd.business_name || '',
            business_type: rd.business_type || 'Trader',
            gst_number: rd.gst_number || '',
            pan_number: rd.pan_number || '',
            contact_person: rd.contact_person || '',
            phone: rd.phone || '',
            email: rd.email || '',
            city: rd.city || '',
            state: rd.state || 'Maharashtra',
            district: rd.district || 'Pune',
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user?.id]);

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!buyerForm.business_name.trim()) {
      setError('Business name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.updateProfile(user.id, {
        full_name: form.full_name.trim(),
        phone: form.phone || null,
        district: form.district || null,
        state: form.state || 'Maharashtra',
        buyer_data: {
          business_name: buyerForm.business_name.trim(),
          business_type: buyerForm.business_type,
          gst_number: buyerForm.gst_number || null,
          pan_number: buyerForm.pan_number || null,
          contact_person: buyerForm.contact_person || null,
          phone: buyerForm.phone || null,
          email: buyerForm.email || null,
          city: buyerForm.city || null,
          state: buyerForm.state || 'Maharashtra',
          district: buyerForm.district || null,
        },
      });
      if (refreshProfile) await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const tier = buyerEntity?.verification_tier || 'basic';
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.basic;
  const verificationStatus = buyerEntity?.verification_status || 'pending';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Buyer Profile</h1>
          <p className="text-muted-foreground text-sm">
            Manage your business details — visible to farmers and admin
          </p>
        </div>
      </div>

      {/* Avatar + Tier Card */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50/30 border border-blue-200/40 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-4xl font-bold text-blue-700">
          {form.full_name?.[0]?.toUpperCase() || '🏢'}
        </div>
        <div className="flex-1">
          <div className="text-2xl font-heading font-bold text-foreground">{form.full_name || 'Your Name'}</div>
          <div className="text-sm text-muted-foreground mt-1">{buyerForm.business_name || 'Business Name'}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${tierCfg.color}`}>
              {tierCfg.icon} {tierCfg.label} Tier
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
              verificationStatus === 'approved'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : verificationStatus === 'rejected'
                ? 'bg-red-50 text-red-700 border-red-300'
                : 'bg-amber-50 text-amber-700 border-amber-300'
            }`}>
              {verificationStatus === 'approved' ? '✅ Verified' :
               verificationStatus === 'rejected' ? '❌ Rejected' :
               '⏳ Pending Verification'}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" /> Personal Details
        </h2>

        <InputField label="Full Name" icon={User} required>
          <input
            type="text"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder="e.g. Rajesh Mehta"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          />
        </InputField>

        <InputField label="Phone" icon={Phone}>
          <input
            type="tel"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder="e.g. 9876543210"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          />
        </InputField>

        <InputField label="State" icon={Globe}>
          <div className="relative">
            <select
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 appearance-none bg-white transition-all"
              value={form.state}
              onChange={e => setForm(f => ({ ...f, state: e.target.value, district: '' }))}
            >
              <option value="">Select state</option>
              {meta.states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </InputField>

        <InputField label="District" icon={MapPin}>
          <div className="relative">
            <select
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 appearance-none bg-white transition-all disabled:opacity-50"
              value={form.district}
              onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
              disabled={!form.state}
            >
              <option value="">{form.state ? 'Select district' : 'Select state first'}</option>
              {districtsFor(form.state).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </InputField>
      </div>

      {/* Business Details */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" /> Business Details
        </h2>

        <InputField label="Business Name" icon={Building2} required>
          <input
            type="text"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder="e.g. Mehta Agro Traders"
            value={buyerForm.business_name}
            onChange={e => setBuyerForm(f => ({ ...f, business_name: e.target.value }))}
          />
        </InputField>

        <InputField label="Business Type" icon={Building2}>
          <div className="grid grid-cols-3 gap-2">
            {BUSINESS_TYPES.map(bt => (
              <button
                key={bt.name}
                type="button"
                onClick={() => setBuyerForm(f => ({ ...f, business_type: bt.name }))}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                  buyerForm.business_type === bt.name
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-border hover:border-blue-300 text-foreground'
                }`}
              >
                <span className="text-xl">{bt.icon}</span>
                {bt.name}
              </button>
            ))}
          </div>
        </InputField>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="GST Number" icon={Hash} helper="Required for Gold/Platinum tier">
            <input
              type="text"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="e.g. 27AAPFU0939F1ZV"
              value={buyerForm.gst_number}
              onChange={e => setBuyerForm(f => ({ ...f, gst_number: e.target.value }))}
            />
          </InputField>

          <InputField label="PAN Number" icon={FileText}>
            <input
              type="text"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="e.g. ABCDE1234F"
              value={buyerForm.pan_number}
              onChange={e => setBuyerForm(f => ({ ...f, pan_number: e.target.value }))}
            />
          </InputField>
        </div>

        <InputField label="Contact Person" icon={User}>
          <input
            type="text"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder="Primary contact name"
            value={buyerForm.contact_person}
            onChange={e => setBuyerForm(f => ({ ...f, contact_person: e.target.value }))}
          />
        </InputField>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Business Phone" icon={Phone}>
            <input
              type="tel"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="Office phone"
              value={buyerForm.phone}
              onChange={e => setBuyerForm(f => ({ ...f, phone: e.target.value }))}
            />
          </InputField>

          <InputField label="Email" icon={Mail}>
            <input
              type="email"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="business@example.com"
              value={buyerForm.email}
              onChange={e => setBuyerForm(f => ({ ...f, email: e.target.value }))}
            />
          </InputField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="City" icon={MapPin}>
            <input
              type="text"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="e.g. Pune"
              value={buyerForm.city}
              onChange={e => setBuyerForm(f => ({ ...f, city: e.target.value }))}
            />
          </InputField>

          <InputField label="Business State" icon={Globe}>
            <div className="relative">
              <select
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 appearance-none bg-white transition-all"
                value={buyerForm.state}
                onChange={e => setBuyerForm(f => ({ ...f, state: e.target.value, district: '' }))}
              >
                <option value="">Select state</option>
                {meta.states.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </InputField>

          <InputField label="Business District" icon={MapPin}>
            <div className="relative">
              <select
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 appearance-none bg-white transition-all disabled:opacity-50"
                value={buyerForm.district}
                onChange={e => setBuyerForm(f => ({ ...f, district: e.target.value }))}
                disabled={!buyerForm.state}
              >
                <option value="">{buyerForm.state ? 'Select district' : 'Select state first'}</option>
                {districtsFor(buyerForm.state).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </InputField>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Save */}
      <div className="flex items-center justify-between gap-4 pb-8">
        <p className="text-xs text-muted-foreground">
          Business data is used for verification tier computation and displayed on offer cards.
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-60`}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Saved!</>
          ) : (
            <><Save className="w-4 h-4" /> Save Profile</>
          )}
        </button>
      </div>
    </div>
  );
}
