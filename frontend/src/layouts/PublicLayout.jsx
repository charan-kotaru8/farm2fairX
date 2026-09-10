import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/ui/LanguageSelector';

export default function PublicLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile, logout } = useAuth();
  const userRole = profile?.role || user?.user_metadata?.role || 'farmer';
  const dashboardPath = `/${userRole}/dashboard`;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {}
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-heading font-extrabold text-xl text-primary hover:opacity-90 transition-opacity">
            🌾 Farm2Fair
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Govt. APMC Linkage
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            {user ? (
              <>
                <Link 
                  to={dashboardPath} 
                  className="text-xs font-bold text-primary hover:text-primary-hover px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors"
                >
                  Dashboard ({userRole})
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="text-xs font-bold text-slate-600 hover:text-danger px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  {t('landing.login', 'Login')}
                </Link>
                <Link
                  to="/signup"
                  className="text-xs font-bold bg-primary hover:bg-primary-hover text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
                >
                  {t('landing.signup', 'Sign Up')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
