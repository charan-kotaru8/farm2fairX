import React, { useState } from 'react';
import { Outlet, useNavigate, NavLink, Navigate } from 'react-router-dom';
import { Bell, LogOut, User, Loader2, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from '../components/ui/NotificationCenter';
import LanguageSelector from '../components/ui/LanguageSelector';

export default function DashboardLayout({ role }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile, loading, logout } = useAuth();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE !== 'false';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {}
    navigate('/login');
  };

  // When Judge/Demo mode is OFF, strictly require real authentication and enforce role access
  if (!isDemoMode) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted">
          <div className="flex items-center gap-3 text-primary font-medium">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span>Authenticating...</span>
          </div>
        </div>
      );
    }
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // Strict Role Guarding: Prevent access to unauthorized role portals
    const userRole = profile?.role || user?.user_metadata?.role || 'farmer';
    if (userRole !== role) {
      const targetPath = userRole === 'farmer' ? '/farmer/dashboard' : `/${userRole}/dashboard`;
      return <Navigate to={targetPath} replace />;
    }
  }

  return (
    <div className="min-h-screen flex bg-muted">
      <aside className="w-64 bg-white border-r border-border hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="text-xl font-heading font-bold text-primary flex items-center gap-2">
            🌾 Farm2Fair
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">{t('common.menu')}</div>
          {role === 'farmer' && (
            <>
              <NavLink to="/farmer/dashboard" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📊</span> {t('nav.dashboard')}
              </NavLink>
              <NavLink to="/farmer/market-intel" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📈</span> {t('nav.marketIntel')}
              </NavLink>
              <NavLink to="/farmer/lots" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📦</span> {t('nav.myLots')}
              </NavLink>
              <NavLink to="/farmer/create-lot" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">➕</span> {t('nav.createLot')}
              </NavLink>
              <NavLink to="/farmer/profile" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">👤</span> My Profile
              </NavLink>
              <NavLink to="/farmer/discover-fpo" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🏛️</span> Join FPO
              </NavLink>
              <NavLink to="/farmer/logistics" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🚚</span> {t('nav.logistics')}
              </NavLink>
              <NavLink to="/farmer/storage" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🏬</span> {t('nav.storage')}
              </NavLink>
            </>
          )}
          {role === 'buyer' && (
            <>
              <NavLink to="/buyer/dashboard" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📊</span> {t('nav.dashboard')}
              </NavLink>
              <NavLink to="/buyer/marketplace" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🛒</span> {t('nav.marketplace')}
              </NavLink>
              <NavLink to="/buyer/logistics" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🚚</span> {t('nav.logistics')}
              </NavLink>
              <NavLink to="/buyer/verification" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🛡️</span> {t('nav.verification')}
              </NavLink>
              <NavLink to="/buyer/profile" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">👤</span> My Profile
              </NavLink>
            </>
          )}
          {role === 'admin' && (
            <>
              <NavLink to="/admin/dashboard" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📊</span> {t('nav.adminDashboard')}
              </NavLink>
              <NavLink to="/admin/verifications" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">✅</span> {t('nav.buyerVerifications')}
              </NavLink>
              <NavLink to="/admin/grievances" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">⚖️</span> {t('nav.grievances')}
              </NavLink>

              <NavLink to="/admin/transactions" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🔍</span> {t('nav.transactions')}
              </NavLink>
            </>
          )}
          {role === 'fpo' && (
            <>
              <NavLink to="/fpo/dashboard" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📊</span> {t('nav.overview')}
              </NavLink>
              <NavLink to="/fpo/members" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">👥</span> {t('nav.memberDirectory')}
              </NavLink>
              <NavLink to="/fpo/join-requests" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📝</span> Join Requests
              </NavLink>
              <NavLink to="/fpo/aggregate" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🔄</span> {t('nav.aggregateLots')}
              </NavLink>
              <NavLink to="/fpo/lots" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📦</span> {t('nav.myLots')}
              </NavLink>
              <NavLink to="/fpo/profile" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">👤</span> FPO Profile
              </NavLink>
            </>
          )}

          {/* Quick Portal Switcher (Gated by DEMO_MODE §8.2) */}
          {isDemoMode && (
            <div className="mt-auto pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t('common.switchRole')}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  {t('common.demoModeBadge')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 px-1">
                <NavLink to="/farmer/dashboard" className={({isActive}) => `text-center py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${role === 'farmer' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  🌾 {t('common.farmerRole')}
                </NavLink>
                <NavLink to="/buyer/marketplace" className={({isActive}) => `text-center py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${role === 'buyer' ? 'bg-blue-50 text-blue-800 border-blue-300 font-semibold' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  🏢 {t('common.buyerRole')}
                </NavLink>
                <NavLink to="/admin/dashboard" className={({isActive}) => `text-center py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${role === 'admin' ? 'bg-purple-50 text-purple-800 border-purple-300 font-semibold' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  🛡️ {t('common.adminRole')}
                </NavLink>
                <NavLink to="/fpo/dashboard" className={({isActive}) => `text-center py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${role === 'fpo' ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  🚜 {t('common.fpoRole')}
                </NavLink>
              </div>
              <div className="text-[9px] text-slate-400 text-center mt-2 px-1 leading-tight">
                {t('common.disabledInProd')}
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white border-b border-border h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="font-heading font-bold text-lg capitalize">{role === 'fpo' ? '🌾 FPO Aggregation Hub' : `${role} Dashboard`}</div>
            {role === 'fpo' && (
              <span className="text-xs bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
                {profile?.full_name ? (profile.full_name.toLowerCase().includes('fpo') ? profile.full_name : `${profile.full_name} FPO`) : 'FPO Collective'} {profile?.district ? `(${profile.district})` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">

            {/* Quick switcher in topbar */}
            {isDemoMode && (
              <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <span className="text-slate-500 px-1.5 font-medium">{t('common.role')}:</span>
                <NavLink to="/farmer/dashboard" className={({isActive}) => `px-2 py-1 rounded transition-colors ${role === 'farmer' ? 'bg-white shadow-xs font-bold text-emerald-700' : 'text-slate-600 hover:text-slate-900'}`}>{t('common.farmerRole')}</NavLink>
                <NavLink to="/buyer/marketplace" className={({isActive}) => `px-2 py-1 rounded transition-colors ${role === 'buyer' ? 'bg-white shadow-xs font-bold text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}>{t('common.buyerRole')}</NavLink>
                <NavLink to="/fpo/dashboard" className={({isActive}) => `px-2 py-1 rounded transition-colors ${role === 'fpo' ? 'bg-white shadow-xs font-bold text-amber-800' : 'text-slate-600 hover:text-slate-900'}`}>{t('common.fpoRole')}</NavLink>
                <NavLink to="/admin/dashboard" className={({isActive}) => `px-2 py-1 rounded transition-colors ${role === 'admin' ? 'bg-white shadow-xs font-bold text-purple-800' : 'text-slate-600 hover:text-slate-900'}`}>{t('common.adminRole')}</NavLink>
              </div>
            )}

            <LanguageSelector />
            <NotificationCenter role={role} />
            <button onClick={() => navigate(`/${role}/profile`)} className="p-2 text-muted-foreground hover:text-foreground flex items-center gap-2" title="My Profile">
              <UserCircle className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 text-danger hover:text-danger/80">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
        
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>

      </main>
    </div>
  );
}
