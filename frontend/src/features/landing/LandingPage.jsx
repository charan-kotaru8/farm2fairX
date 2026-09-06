import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import LanguageSelector from '../../components/ui/LanguageSelector';
import { 
  Sparkles, ShieldCheck, TrendingUp, Truck, 
  ArrowRight, CheckCircle2, Globe, Building 
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const userRole = profile?.role || user?.user_metadata?.role || 'farmer';
  const dashboardPath = `/${userRole}/dashboard`;

  const isShallowLang = ['te', 'gu'].includes(i18n.language);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Top Bar with Language Selector */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-heading font-extrabold text-xl text-primary">
            🌾 Farm2Fair
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Govt. APMC Linkage
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="text-xs font-bold bg-primary hover:bg-primary-hover text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 pt-16 pb-20 flex flex-col items-center text-center">
        {/* Shallow Language Extensibility Notice (§8.4) */}
        {isShallowLang && (
          <div className="mb-6 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 max-w-xl animate-in fade-in">
            <Globe className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t('landing.shallowNotice')}</span>
          </div>
        )}

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('landing.heroBadge')}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-heading text-slate-900 tracking-tight max-w-3xl leading-[1.15]">
          {t('landing.heroTitle')}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 mt-6 mb-10 max-w-2xl leading-relaxed">
          {t('landing.heroSubtitle')}
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button 
            onClick={() => navigate('/farmer/dashboard')}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <span>🌾</span> {t('landing.ctaFarmer')}
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => navigate('/buyer/marketplace')}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-6 py-3 rounded-2xl font-bold text-sm shadow-xs hover:border-slate-400 transition-all flex items-center gap-2"
          >
            <span>🏢</span> {t('landing.ctaBuyer')}
          </button>
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2"
          >
            <span>🛡️</span> {t('landing.ctaAdmin')}
          </button>
        </div>

        {/* Three Pillars Cards */}
        <div className="mt-20 w-full">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            {t('landing.threePillarsTitle')}
          </h2>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                📈
              </div>
              <h3 className="text-base font-bold font-heading text-slate-900">
                {t('landing.pillar1Title')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('landing.pillar1Desc')}
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                🛡️
              </div>
              <h3 className="text-base font-bold font-heading text-slate-900">
                {t('landing.pillar2Title')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('landing.pillar2Desc')}
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
                🚚
              </div>
              <h3 className="text-base font-bold font-heading text-slate-900">
                {t('landing.pillar3Title')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('landing.pillar3Desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
