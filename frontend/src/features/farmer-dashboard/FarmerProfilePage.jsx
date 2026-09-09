import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  User, MapPin, Phone, Wheat, Ruler, Save, CheckCircle2,
  AlertCircle, ChevronDown, Loader2, ArrowLeft
} from 'lucide-react';

const MAHARASHTRA_DISTRICTS = [
  "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara",
  "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli",
  "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban",
  "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar",
  "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
  "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
];


const CROPS_LIST = [
  { name: 'Soybean', icon: '🫘' },
  { name: 'Onion', icon: '🧅' },
  { name: 'Cotton', icon: '🌿' },
  { name: 'Wheat', icon: '🌾' },
  { name: 'Rice', icon: '🍚' },
  { name: 'Sugarcane', icon: '🎍' },
  { name: 'Tur Dal', icon: '🌱' },
  { name: 'Jowar', icon: '🌽' },
  { name: 'Groundnut', icon: '🥜' },
  { name: 'Tomato', icon: '🍅' },
  { name: 'Chilli', icon: '🌶️' },
  { name: 'Orange', icon: '🍊' },
];

const InputField = ({ label, icon: Icon, required, children, helper }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
      <Icon className="w-4 h-4 text-primary" />
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
  </div>
);

export default function FarmerProfilePage() {
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    district: '',
    state: 'Maharashtra',
    village: '',
    land_acres: '',
    primary_crop: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Load existing profile on mount
  useEffect(() => {
    async function init() {
      if (!user?.id) return;
      try {
        const profileData = await api.getProfile(user.id);
        if (profileData) {
          setForm({
            full_name: profileData.full_name || authProfile?.full_name || '',
            phone: profileData.phone || '',
            district: profileData.district || '',
            state: profileData.state || 'Maharashtra',
            village: profileData.village || '',
            land_acres: profileData.land_acres || '',
            primary_crop: profileData.primary_crop || '',
          });
        } else if (authProfile?.full_name) {
          setForm(f => ({ ...f, full_name: authProfile.full_name }));
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
    setSaving(true);
    setError('');
    try {
      await api.updateProfile(user.id, {
        full_name: form.full_name.trim(),
        phone: form.phone || null,
        district: form.district || null,
        state: form.state || 'Maharashtra',
        village: form.village || null,
        land_acres: form.land_acres ? parseFloat(form.land_acres) : null,
        primary_crop: form.primary_crop || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const isProfileComplete = form.full_name && form.district && form.phone;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
          <h1 className="text-3xl font-heading font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground text-sm">
            Update your farm details — used for AI market matching & recommendations
          </p>
        </div>
      </div>

      {/* Completion Banner */}
      {!isProfileComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Complete your profile for better AI recommendations</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Adding your district helps us match you with your nearest APMC market price data.
            </p>
          </div>
        </div>
      )}

      {/* Avatar Card */}
      <div className="bg-gradient-to-br from-primary/10 via-white to-primary/5 border border-primary/15 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
          {form.full_name?.[0]?.toUpperCase() || '👤'}
        </div>
        <div>
          <div className="text-2xl font-heading font-bold text-foreground">{form.full_name || 'Your Name'}</div>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {form.village ? `${form.village}, ` : ''}{form.district || 'District not set'}, {form.state}
          </div>
          {form.primary_crop && (
            <div className="mt-1 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-block">
              🌾 Primary crop: {form.primary_crop}
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">Personal Details</h2>

        {/* Full Name */}
        <InputField label="Full Name" icon={User} required>
          <input
            type="text"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            placeholder="e.g. Charan Patil"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          />
        </InputField>

        {/* Phone */}
        <InputField label="Mobile Number" icon={Phone} helper="Used for offer alerts via SMS">
          <input
            type="tel"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            placeholder="e.g. 9876543210"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          />
        </InputField>

        <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 pt-2">Farm Location</h2>

        {/* District */}
        <InputField label="District" icon={MapPin} required helper="Critical for AI market price matching">
          <div className="relative">
            <select
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 appearance-none bg-white transition-all"
              value={form.district}
              onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
            >
              <option value="">Select your district</option>
              {MAHARASHTRA_DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </InputField>

        {/* Village */}
        <InputField label="Village / Taluka" icon={MapPin}>
          <input
            type="text"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            placeholder="e.g. Udgir, Nilanga"
            value={form.village}
            onChange={e => setForm(f => ({ ...f, village: e.target.value }))}
          />
        </InputField>

        <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 pt-2">Farm Details</h2>

        {/* Land Acres */}
        <InputField label="Total Farm Land (Acres)" icon={Ruler} helper="Helps FPOs calculate aggregation eligibility">
          <input
            type="number"
            min="0"
            step="0.5"
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            placeholder="e.g. 5.5"
            value={form.land_acres}
            onChange={e => setForm(f => ({ ...f, land_acres: e.target.value }))}
          />
        </InputField>

        {/* Primary Crop */}
        <InputField label="Primary Crop" icon={Wheat} helper="Your main cultivation — used for recommendation priority">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {CROPS_LIST.map(crop => (
              <button
                key={crop.name}
                type="button"
                onClick={() => setForm(f => ({ ...f, primary_crop: f.primary_crop === crop.name ? '' : crop.name }))}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                  form.primary_crop === crop.name
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-border hover:border-primary/40 text-foreground'
                }`}
              >
                <span className="text-2xl">{crop.icon}</span>
                {crop.name}
              </button>
            ))}
          </div>
        </InputField>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-between gap-4 pb-8">
        <p className="text-xs text-muted-foreground">
          Profile data is used by AI to match your crops to the nearest APMC market price data.
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
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
