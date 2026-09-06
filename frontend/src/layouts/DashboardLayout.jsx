import React, { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { Bell, LogOut, User, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from '../components/ui/NotificationCenter';
import LanguageSelector from '../components/ui/LanguageSelector';
import GuidedDemoOverlay from '../components/ui/GuidedDemoOverlay';

export default function DashboardLayout({ role }) {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  const isDemoMode = import.meta.env.VITE_DEMO_MODE !== 'false';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {}
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-muted">
      <aside className="w-64 bg-white border-r border-border hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="text-xl font-heading font-bold text-primary flex items-center gap-2">
            🌾 Farm2Fair
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Menu</div>
          {role === 'farmer' && (
            <>
              <NavLink to="/farmer/dashboard" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📊</span> Dashboard
              </NavLink>
              <NavLink to="/farmer/market-intel" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📈</span> Market Intel
              </NavLink>
              <NavLink to="/farmer/lots" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📦</span> My Lots & Offers
              </NavLink>
              <NavLink to="/farmer/create-lot" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">➕</span> Create Lot
              </NavLink>
              <NavLink to="/farmer/logistics" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🚚</span> Logistics & Transport
              </NavLink>
              <NavLink to="/farmer/storage" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🏬</span> Storage & Godowns
              </NavLink>
            </>
          )}
          {role === 'buyer' && (
            <>
              <NavLink to="/buyer/dashboard" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📊</span> Dashboard
              </NavLink>
              <NavLink to="/buyer/marketplace" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🛒</span> Crop Marketplace
              </NavLink>
              <NavLink to="/buyer/logistics" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🚚</span> Logistics & Inspection
              </NavLink>
              <NavLink to="/buyer/verification" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🛡️</span> Verification
              </NavLink>
            </>
          )}
          {role === 'admin' && (
            <>
              <NavLink to="/admin/dashboard" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📊</span> Overview & Analytics
              </NavLink>
              <NavLink to="/admin/verifications" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">✅</span> Buyer Verifications
              </NavLink>
              <NavLink to="/admin/grievances" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">⚖️</span> Grievance Triage
              </NavLink>
              <NavLink to="/admin/markets" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📈</span> Market Prices (Live Demo)
              </NavLink>
              <NavLink to="/admin/transactions" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🔍</span> Transaction Monitoring
              </NavLink>
            </>
          )}
          {role === 'fpo' && (
            <>
              <NavLink to="/fpo/dashboard" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📊</span> Overview
              </NavLink>
              <NavLink to="/fpo/members" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">👥</span> Member Directory
              </NavLink>
              <NavLink to="/fpo/aggregate" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">🔄</span> Aggregate Lots
              </NavLink>
              <NavLink to="/fpo/lots" className={({isActive}) => `flex items-center gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}>
                <span className="text-lg w-6 text-center">📦</span> Aggregated Batches & Payouts
              </NavLink>
            </>
          )}

          {/* Quick Portal Switcher (Gated by DEMO_MODE §8.2) */}
          {isDemoMode && (
            <div className="mt-auto pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Demo Role Switcher</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  Judging Only
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 px-1">
                <NavLink to="/farmer/dashboard" className={({isActive}) => `text-center py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${role === 'farmer' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  🌾 Farmer
                </NavLink>
                <NavLink to="/buyer/marketplace" className={({isActive}) => `text-center py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${role === 'buyer' ? 'bg-blue-50 text-blue-800 border-blue-300 font-semibold' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  🏢 Buyer
                </NavLink>
                <NavLink to="/admin/dashboard" className={({isActive}) => `text-center py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${role === 'admin' ? 'bg-purple-50 text-purple-800 border-purple-300 font-semibold' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  🛡️ Admin
                </NavLink>
                <NavLink to="/fpo/dashboard" className={({isActive}) => `text-center py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${role === 'fpo' ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  🚜 FPO Hub
                </NavLink>
              </div>
              <div className="text-[9px] text-slate-400 text-center mt-2 px-1 leading-tight">
                Disabled in production build (§8.2)
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
                Kisan Vikas FPO (Latur)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Guided Demo Tour Trigger (§8.6) */}
            <button
              onClick={() => setShowGuidedTour(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
              title="Launch Guided Demo Walkthrough for Judges"
              id="guided-tour-trigger-btn"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guided Tour</span>
            </button>

            {/* Quick switcher in topbar */}
            {isDemoMode && (
              <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <span className="text-slate-500 px-1.5 font-medium">Role:</span>
                <NavLink to="/farmer/dashboard" className={({isActive}) => `px-2 py-1 rounded transition-colors ${role === 'farmer' ? 'bg-white shadow-xs font-bold text-emerald-700' : 'text-slate-600 hover:text-slate-900'}`}>Farmer</NavLink>
                <NavLink to="/buyer/marketplace" className={({isActive}) => `px-2 py-1 rounded transition-colors ${role === 'buyer' ? 'bg-white shadow-xs font-bold text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}>Buyer</NavLink>
                <NavLink to="/fpo/dashboard" className={({isActive}) => `px-2 py-1 rounded transition-colors ${role === 'fpo' ? 'bg-white shadow-xs font-bold text-amber-800' : 'text-slate-600 hover:text-slate-900'}`}>FPO</NavLink>
                <NavLink to="/admin/dashboard" className={({isActive}) => `px-2 py-1 rounded transition-colors ${role === 'admin' ? 'bg-white shadow-xs font-bold text-purple-800' : 'text-slate-600 hover:text-slate-900'}`}>Admin</NavLink>
              </div>
            )}

            <LanguageSelector />
            <NotificationCenter />
            <button className="p-2 text-muted-foreground hover:text-foreground flex items-center gap-2">
              <User className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 text-danger hover:text-danger/80">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
        
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>

        {/* Guided Demo Mode Overlay (§8.6) */}
        <GuidedDemoOverlay 
          isOpen={showGuidedTour} 
          onClose={() => setShowGuidedTour(false)} 
        />
      </main>
    </div>
  );
}
