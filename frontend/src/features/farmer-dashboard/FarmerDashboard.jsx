import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { TrendingUp, Package, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import CropRecommendationsPanel from './CropRecommendationsPanel';
import RealTimeWeatherCard from './RealTimeWeatherCard';
import { useAuth } from '../../context/AuthContext';

export default function FarmerDashboard() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const farmerId = user?.id || null;
  const farmerName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Farmer';
  const [dashboardData, setDashboardData] = useState({
    lots: [],
    loading: true
  });

  useEffect(() => {
    async function loadData() {
      if (!farmerId) return;
      try {
        const lotsRes = await api.getLots(farmerId);
        setDashboardData({ lots: lotsRes, loading: false });
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    }
    loadData();
  }, [farmerId]);

  if (dashboardData.loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>;
  }

  const activeLots = dashboardData.lots.filter(l => l.status === 'active');
  const activeLotsCount = activeLots.length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Welcome back, {farmerName}! 👋</h1>
          <p className="text-muted-foreground">
            {profile?.district
              ? `${profile.village ? `${profile.village}, ` : ''}${profile.district} District, ${profile.state || 'Maharashtra'}`
              : (t('farmer.location') || 'Maharashtra')} • {t('common.liveData')}
          </p>
        </div>
        <Link to="/farmer/create-lot" className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm inline-flex items-center gap-2">
          <span className="text-lg">➕</span> {t('farmer.createLotCta')}
        </Link>
      </div>

      {/* Profile Completion Nudge — show only if district is missing */}
      {!profile?.district && (
        <Link
          to="/farmer/profile"
          className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Set your district to unlock AI price recommendations</p>
              <p className="text-xs text-amber-700">Your district is needed to match your lots with the nearest APMC market data.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-200 px-3 py-1 rounded-full group-hover:bg-amber-300 transition-colors whitespace-nowrap">Complete Profile →</span>
        </Link>
      )}

      {/* Real-Time NASA POWER Weather Indicator */}
      <RealTimeWeatherCard
        district={profile?.district}
        farmerId={farmerId}
        marketName={profile?.district ? `${profile.district} APMC` : undefined}
      />


      {/* Bento Grid */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Active Lots Card */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t('farmer.activeLots')}</h2>
            <div className="p-2 bg-secondary/20 rounded-full text-secondary">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-bold text-foreground mb-1">{activeLotsCount}</div>
            <p className="text-sm text-muted-foreground">{t('farmer.currentlyListed')}</p>
          </div>
        </div>

        {/* Per-Crop AI Recommendations — all crops, tabbed */}
        <CropRecommendationsPanel farmerId={farmerId} />

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-border shadow-sm col-span-1 md:col-span-3">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">{t('farmer.recentLots')}</h2>
          </div>
          <div className="p-6">
            {dashboardData.lots.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-28 h-28 mx-auto -mb-2 flex items-center justify-center pointer-events-none">
                  <DotLottieReact
                    src="https://lottie.host/b3ee1784-ca13-4a98-9103-a46e988993fa/UoD2ajK4uk.json"
                    loop
                    autoplay
                  />
                </div>
                <h3 className="text-lg font-medium mb-1">{t('farmer.noLotsYet')}</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">{t('farmer.noLotsDesc')}</p>
                <Link to="/farmer/create-lot" className="text-primary font-medium hover:underline">{t('farmer.createLotLink')}</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.lots.slice(0, 3).map(lot => (
                  <div key={lot.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl bg-white p-2 rounded-lg shadow-sm border border-border/50">
                        {lot.crops?.icon || '📦'}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          {lot.quantity} {lot.crops?.unit || t('farmer.quintals')} {t('farmer.ofCrop')} {lot.crops?.name}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lot.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {lot.status}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {t('farmer.grade')} {lot.quality_grade} • {t('farmer.addedOn')} {new Date(lot.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Link to={`/farmer/lots/${lot.id}`} className="text-sm font-medium text-primary hover:underline">{t('common.viewDetails')}</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

