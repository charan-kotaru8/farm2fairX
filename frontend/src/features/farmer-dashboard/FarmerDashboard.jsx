import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { TrendingUp, Package, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import PriceRecommendationCard from './PriceRecommendationCard';

export default function FarmerDashboard() {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState({
    crops: [],
    markets: [],
    lots: [],
    loading: true
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [cropsRes, marketsRes, lotsRes] = await Promise.all([
          api.getCrops(),
          api.getMarkets(),
          api.getLots('00000000-0000-0000-0000-000000000001') // demo farmer
        ]);
        setDashboardData({ crops: cropsRes, markets: marketsRes, lots: lotsRes, loading: false });
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    }
    loadData();
  }, []);

  if (dashboardData.loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>;
  }

  const activeLots = dashboardData.lots.filter(l => l.status === 'active');
  const activeLotsCount = activeLots.length;

  // Pick the primary crop/market for the AI recommendation card
  // Default to Soybean + Latur for the demo, or first available
  const soybean = dashboardData.crops.find(c => c.name === 'Soybean') || dashboardData.crops[0];
  const latur = dashboardData.markets.find(m => m.name === 'Latur APMC') || dashboardData.markets[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">{t('farmer.welcome')}</h1>
          <p className="text-muted-foreground">{t('farmer.location')} • {t('common.liveData')}</p>
        </div>
        <Link to="/farmer/create-lot" className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm inline-flex items-center gap-2">
          <span className="text-lg">➕</span> {t('farmer.createLotCta')}
        </Link>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Active Lots Card */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Active Lots</h2>
            <div className="p-2 bg-secondary/20 rounded-full text-secondary">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-bold text-foreground mb-1">{activeLotsCount}</div>
            <p className="text-sm text-muted-foreground">Currently listed on market</p>
          </div>
        </div>

        {/* AI Recommendation — LIVE, not placeholder */}
        <PriceRecommendationCard
          cropId={soybean?.id}
          marketId={latur?.id}
          cropName={soybean?.name}
          marketName={latur?.name}
        />

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-border shadow-sm col-span-1 md:col-span-3">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Your Recent Lots</h2>
          </div>
          <div className="p-6">
            {dashboardData.lots.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🌾</div>
                <h3 className="text-lg font-medium mb-1">No lots yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">Create your first lot to start getting offers from verified buyers across Maharashtra.</p>
                <Link to="/farmer/create-lot" className="text-primary font-medium hover:underline">Create a Lot →</Link>
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
                          {lot.quantity} {lot.crops?.unit || 'quintals'} of {lot.crops?.name}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lot.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {lot.status}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          Grade {lot.quality_grade} • Added {new Date(lot.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Link to={`/farmer/lots/${lot.id}`} className="text-sm font-medium text-primary hover:underline">View details</Link>
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

