import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useMarketsMeta } from '../../hooks/useMarketsMeta';
import {
  User, Building2, MapPin, Phone, Mail, Hash, Users,
  Save, CheckCircle2, AlertCircle, ChevronDown, Loader2, ArrowLeft, Globe
} from 'lucide-react';

const InputField = ({ label, icon: Icon, required, children, helper }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
      <Icon className="w-4 h-4 text-amber-700" />
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
  </div>
);

export default function FPOProfilePage() {
  const navigate = useNavigate();
  const { user, profile: authProfile, roleData, refreshProfile } = useAuth();
  const { meta, districtsFor } = useMarketsMeta();

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    district: '',
    state: 'Maharashtra',
  });

  const [fpoForm, setFpoForm] = useState({
    name: '',
    registration_number: '',
    contact_person: '',
    district: 'Latur',
    state: 'Maharashtra',
    phone: '',
    email: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [fpoEntity, setFpoEntity] = useState(null);

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
          setFpoEntity(rd);
          setFpoForm({
            name: rd.name || '',
            registration_number: rd.registration_number || '',
            contact_person: rd.contact_person || '',
            district: rd.district || 'Latur',
            state: rd.state || 'Maharashtra',
            phone: rd.phone || '',
            email: rd.email || '',
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
      setError('Manager name is required.');
      return;
    }
    if (!fpoForm.name.trim()) {
      setError('FPO organization name is required.');
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
        fpo_data: {
          name: fpoForm.name.trim(),
          registration_number: fpoForm.registration_number || null,
          contact_person: fpoForm.contact_person || form.full_name.trim(),
          district: fpoForm.district || null,
          state: fpoForm.state || 'Maharashtra',
          phone: fpoForm.phone || null,
          email: fpoForm.email || null,
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

  const memberCount = fpoEntity?.total_members || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
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
          <h1 className="text-3xl font-heading font-bold text-foreground">FPO Profile</h1>
          <p className="text-muted-foreground text-sm">
            Manage your organization details — visible to farmers and admin
          </p>
        </div>
      </div>

      {/* Avatar + Stats Card */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/30 border border-amber-200/40 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center text-4xl font-bold text-amber-800">
          🏛️
        </div>
        <div className="flex-1">
          <div className="text-2xl font-heading font-bold text-foreground">{fpoForm.name || 'FPO Organization'}</div>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {fpoForm.district || 'District not set'}, {fpoForm.state}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {memberCount} Members
            </span>
            {fpoEntity?.registration_number && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-300">
                ✅ Registered
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Member Count Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Member count auto-updates</p>
          <p className="text-xs text-blue-700 mt-0.5">
            When a farmer's join request is approved, the member count increments automatically.
            Current: <strong>{memberCount} members</strong>.
          </p>
        </div>
      </div>

      {/* Manager Details */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-700" /> Manager Details
        </h2>

        <InputField label="Manager Name" icon={User} required>
          <input
            type="text"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all"
            placeholder="e.g. Suresh Patil"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          />
        </InputField>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Phone" icon={Phone}>
            <input
              type="tel"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </InputField>

          <InputField label="State" icon={Globe}>
            <div className="relative">
              <select
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 appearance-none bg-white transition-all"
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

          <InputField label="Personal District" icon={MapPin}>
            <div className="relative">
              <select
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 appearance-none bg-white transition-all disabled:opacity-50"
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
      </div>

      {/* Organization Details */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-700" /> Organization Details
        </h2>

        <InputField label="FPO Name" icon={Building2} required helper="Visible to farmers during FPO discovery">
          <input
            type="text"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all"
            placeholder="e.g. Latur Soybean Farmer Producer Co."
            value={fpoForm.name}
            onChange={e => setFpoForm(f => ({ ...f, name: e.target.value }))}
          />
        </InputField>

        <InputField label="Registration Number" icon={Hash} helper="Government registration number (if registered)">
          <input
            type="text"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all"
            placeholder="e.g. MAH/FPO/2024/LATUR/001"
            value={fpoForm.registration_number}
            onChange={e => setFpoForm(f => ({ ...f, registration_number: e.target.value }))}
          />
        </InputField>

        <InputField label="Contact Person" icon={User} helper="Primary contact for farmers & buyers">
          <input
            type="text"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all"
            placeholder="e.g. Suresh Patil"
            value={fpoForm.contact_person}
            onChange={e => setFpoForm(f => ({ ...f, contact_person: e.target.value }))}
          />
        </InputField>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="FPO State" icon={Globe}>
            <div className="relative">
              <select
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 appearance-none bg-white transition-all"
                value={fpoForm.state}
                onChange={e => setFpoForm(f => ({ ...f, state: e.target.value, district: '' }))}
              >
                <option value="">Select state</option>
                {meta.states.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </InputField>

          <InputField label="FPO District" icon={MapPin}>
            <div className="relative">
              <select
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 appearance-none bg-white transition-all disabled:opacity-50"
                value={fpoForm.district}
                onChange={e => setFpoForm(f => ({ ...f, district: e.target.value }))}
                disabled={!fpoForm.state}
              >
                <option value="">{fpoForm.state ? 'Select district' : 'Select state first'}</option>
                {districtsFor(fpoForm.state).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </InputField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="FPO Phone" icon={Phone}>
            <input
              type="tel"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all"
              placeholder="Office phone"
              value={fpoForm.phone}
              onChange={e => setFpoForm(f => ({ ...f, phone: e.target.value }))}
            />
          </InputField>

          <InputField label="FPO Email" icon={Mail}>
            <input
              type="email"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all"
              placeholder="fpo@example.com"
              value={fpoForm.email}
              onChange={e => setFpoForm(f => ({ ...f, email: e.target.value }))}
            />
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
          Organization details are visible in FPO discovery and buyer-facing aggregation cards.
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-amber-700 text-white hover:bg-amber-800'
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
